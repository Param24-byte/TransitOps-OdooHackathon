// src/services/maintenance.service.ts
// Maintenance log business logic.
// KEY RULE: Creating a maintenance record sets the vehicle status to IN_SHOP.

import prisma from "../lib/prisma";

export const maintenanceService = {
  /**
   * Get all maintenance logs. Optionally filter by vehicleId.
   */
  async getAll(vehicleId?: number) {
    return prisma.maintenanceLog.findMany({
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
   * Create a maintenance log.
   * BUSINESS RULE: Automatically sets the vehicle status to IN_SHOP.
   * Uses a transaction to ensure both operations succeed or fail together.
   */
  async create(data: {
    date: string;
    description: string;
    cost: number;
    vehicleId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found.");
      }

      if (vehicle.status === "ON_TRIP") {
        throw new Error(
          "Cannot create maintenance for a vehicle currently on a trip. Complete or cancel the trip first."
        );
      }

      // Create the log and update vehicle status atomically
      const [log] = await Promise.all([
        tx.maintenanceLog.create({
          data: {
            date: new Date(data.date),
            description: data.description,
            cost: data.cost,
            vehicleId: data.vehicleId,
          },
          include: {
            vehicle: { select: { registrationNo: true, name: true } },
          },
        }),
        tx.vehicle.update({
          where: { id: data.vehicleId },
          data: { status: "IN_SHOP" },
        }),
      ]);

      return log;
    });
  },

  /**
   * Delete a maintenance log by ID.
   */
  async delete(id: number) {
    const log = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!log) {
      throw new Error("Maintenance log not found.");
    }
    return prisma.maintenanceLog.delete({ where: { id } });
  },
};
