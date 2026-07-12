// src/services/fuel.service.ts
// Fuel log business logic.
// Tracks fuel consumption per vehicle for efficiency analytics.

import prisma from "../lib/prisma";

export const fuelService = {
  /**
   * Get all fuel logs. Optionally filter by vehicleId.
   */
  async getAll(vehicleId?: number) {
    return prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: {
        vehicle: {
          select: { id: true, registrationNo: true, name: true },
        },
      },
      orderBy: { date: "desc" },
    });
  },

  /**
   * Create a fuel log entry.
   */
  async create(data: {
    date: string;
    liters: number;
    cost: number;
    vehicleId: number;
  }) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    return prisma.fuelLog.create({
      data: {
        date: new Date(data.date),
        liters: data.liters,
        cost: data.cost,
        vehicleId: data.vehicleId,
      },
      include: {
        vehicle: { select: { registrationNo: true, name: true } },
      },
    });
  },

  /**
   * Get fuel efficiency stats per vehicle.
   * Returns total liters, total cost, and average cost per liter.
   */
  async getEfficiencyStats() {
    const stats = await prisma.fuelLog.groupBy({
      by: ["vehicleId"],
      _sum: { liters: true, cost: true },
      _count: true,
    });

    // Enrich with vehicle details
    const enriched = await Promise.all(
      stats.map(async (stat) => {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: stat.vehicleId },
          select: { registrationNo: true, name: true, odometer: true },
        });

        const totalLiters = stat._sum.liters || 0;
        const totalCost = stat._sum.cost || 0;

        return {
          vehicleId: stat.vehicleId,
          vehicle,
          totalLiters: Math.round(totalLiters * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          avgCostPerLiter: totalLiters > 0
            ? Math.round((totalCost / totalLiters) * 100) / 100
            : 0,
          refuelCount: stat._count,
        };
      })
    );

    return enriched;
  },

  /**
   * Delete a fuel log by ID.
   */
  async delete(id: number) {
    const log = await prisma.fuelLog.findUnique({ where: { id } });
    if (!log) {
      throw new Error("Fuel log not found.");
    }
    return prisma.fuelLog.delete({ where: { id } });
  },
};
