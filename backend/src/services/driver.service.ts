// src/services/driver.service.ts
// Driver business logic.
// Handles CRUD, license expiry validation, and safety score tracking.

import prisma from "../lib/prisma";
import { DriverStatus } from "@prisma/client";

export const driverService = {
  /**
   * Get all drivers with optional status filter.
   */
  async getAll(status?: DriverStatus) {
    return prisma.driver.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: { trips: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single driver by ID with recent trip history.
   */
  async getById(id: number) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            vehicle: {
              select: { registrationNo: true, name: true },
            },
          },
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found.");
    }

    return driver;
  },

  /**
   * Create a new driver. License number must be unique.
   * Also validates that the license is not already expired.
   */
  async create(data: {
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiry: string;
    contactNumber: string;
  }) {
    // Check for duplicate license
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existing) {
      throw new Error(`Driver with license ${data.licenseNumber} already exists.`);
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(data.licenseExpiry);
    if (expiryDate <= new Date()) {
      throw new Error("Cannot register a driver with an expired license.");
    }

    return prisma.driver.create({
      data: {
        ...data,
        licenseExpiry: expiryDate,
      },
    });
  },

  /**
   * Update driver details.
   */
  async update(
    id: number,
    data: Partial<{
      name: string;
      licenseCategory: string;
      licenseExpiry: string;
      contactNumber: string;
      safetyScore: number;
      status: DriverStatus;
    }>
  ) {
    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new Error("Driver not found.");
    }

    // If updating license expiry, ensure new date is valid
    const updateData: Record<string, unknown> = { ...data };
    if (data.licenseExpiry) {
      const expiryDate = new Date(data.licenseExpiry);
      if (expiryDate <= new Date()) {
        throw new Error("License expiry date must be in the future.");
      }
      updateData.licenseExpiry = expiryDate;
    }

    return prisma.driver.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * Delete a driver. Only allowed if the driver is not ON_TRIP.
   */
  async delete(id: number) {
    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new Error("Driver not found.");
    }

    if (driver.status === "ON_TRIP") {
      throw new Error("Cannot delete a driver that is currently on a trip.");
    }

    return prisma.driver.delete({ where: { id } });
  },

  /**
   * Get dashboard statistics for drivers.
   */
  async getStats() {
    const [total, available, onTrip, offDuty, suspended] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: "AVAILABLE" } }),
      prisma.driver.count({ where: { status: "ON_TRIP" } }),
      prisma.driver.count({ where: { status: "OFF_DUTY" } }),
      prisma.driver.count({ where: { status: "SUSPENDED" } }),
    ]);

    // Find drivers with expiring licenses (within 30 days)
    const expiringLicenses = await prisma.driver.count({
      where: {
        licenseExpiry: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });

    return { total, available, onTrip, offDuty, suspended, expiringLicenses };
  },
};
