// src/services/vehicle.service.ts
// Vehicle business logic.
// All database operations and business rule enforcement for vehicles live here.

import prisma from "../lib/prisma";
import { VehicleStatus } from "@prisma/client";

export const vehicleService = {
  /**
   * Get all vehicles with optional status filter.
   * Includes a count of related trips for dashboard metrics.
   */
  async getAll(status?: VehicleStatus) {
    return prisma.vehicle.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: { trips: true, maintenanceLogs: true, fuelLogs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single vehicle by ID with all related records.
   */
  async getById(id: number) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          orderBy: { createdAt: "desc" },
          take: 10, // Only return the 10 most recent trips for performance
        },
        maintenanceLogs: {
          orderBy: { date: "desc" },
          take: 5,
        },
        fuelLogs: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    return vehicle;
  },

  /**
   * Create a new vehicle. Registration number must be unique.
   */
  async create(data: {
    registrationNo: string;
    name: string;
    type: string;
    capacity: number;
    odometer: number;
    acquisitionCost: number;
  }) {
    // Check for duplicate registration number
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNo: data.registrationNo },
    });

    if (existing) {
      throw new Error(`Vehicle with registration ${data.registrationNo} already exists.`);
    }

    return prisma.vehicle.create({ data });
  },

  /**
   * Update vehicle details. Cannot update a vehicle that is currently on a trip
   * (to prevent data inconsistency during active operations).
   */
  async update(
    id: number,
    data: Partial<{
      name: string;
      type: string;
      capacity: number;
      odometer: number;
      status: VehicleStatus;
    }>
  ) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    return prisma.vehicle.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a vehicle. Only allowed if the vehicle is not ON_TRIP.
   */
  async delete(id: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    if (vehicle.status === "ON_TRIP") {
      throw new Error("Cannot delete a vehicle that is currently on a trip.");
    }

    return prisma.vehicle.delete({ where: { id } });
  },

  /**
   * Get dashboard statistics for vehicles.
   */
  async getStats() {
    const [total, available, onTrip, inShop, retired] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
      prisma.vehicle.count({ where: { status: "IN_SHOP" } }),
      prisma.vehicle.count({ where: { status: "RETIRED" } }),
    ]);

    return { total, available, onTrip, inShop, retired };
  },
};
