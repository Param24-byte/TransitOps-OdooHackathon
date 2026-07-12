// src/services/trip.service.ts
// Trip lifecycle management — the most complex service in TransitOps.
//
// KEY BUSINESS RULES:
// 1. Vehicle must be AVAILABLE to be dispatched.
// 2. Driver must be AVAILABLE to be dispatched.
// 3. Cargo weight CANNOT exceed the vehicle's maximum capacity.
// 4. Dispatching a trip sets both the Vehicle and Driver to ON_TRIP.
// 5. Completing or cancelling a trip sets both back to AVAILABLE.
//
// These rules use Prisma transactions to ensure atomicity —
// if any step fails, ALL changes are rolled back.

import prisma from "../lib/prisma";
import { TripStatus } from "@prisma/client";
import { io } from "../index";

export const tripService = {
  /**
   * Get all trips with optional status filter.
   * Includes vehicle and driver details for the list view.
   */
  async getAll(status?: TripStatus) {
    return prisma.trip.findMany({
      where: status ? { status } : undefined,
      include: {
        vehicle: {
          select: { id: true, registrationNo: true, name: true, status: true },
        },
        driver: {
          select: { id: true, name: true, licenseNumber: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single trip by ID with full vehicle and driver details.
   */
  async getById(id: number) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    if (!trip) {
      throw new Error("Trip not found.");
    }

    return trip;
  },

  /**
   * Create a new trip in DRAFT status.
   * At this stage, we only validate that the vehicle and driver exist,
   * and that the cargo weight doesn't exceed vehicle capacity.
   * The vehicle/driver statuses are NOT changed yet (that happens on dispatch).
   */
  async create(data: {
    source: string;
    destination: string;
    cargoWeight: number;
    plannedDistance: number;
    vehicleId: number;
    driverId: number;
  }) {
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) {
      throw new Error("Vehicle not found.");
    }

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId },
    });
    if (!driver) {
      throw new Error("Driver not found.");
    }
    
    if (driver.licenseExpiry <= new Date()) {
      throw new Error(`Driver ${driver.name}'s license expired on ${driver.licenseExpiry.toDateString()}.`);
    }

    // BUSINESS RULE: Cargo weight must not exceed vehicle capacity
    if (data.cargoWeight > vehicle.capacity) {
      throw new Error(
        `Cargo weight (${data.cargoWeight}kg) exceeds vehicle capacity (${vehicle.capacity}kg).`
      );
    }

    const newTrip = await prisma.trip.create({
      data: {
        ...data,
        status: "DRAFT",
      },
      include: {
        vehicle: { select: { registrationNo: true, name: true } },
        driver: { select: { name: true, licenseNumber: true } },
      },
    });
    
    io.emit("tripUpdated", { action: "create", trip: newTrip });
    return newTrip;
  },

  /**
   * Dispatch a trip: DRAFT → DISPATCHED.
   * Uses a Prisma transaction to atomically:
   * 1. Verify vehicle is AVAILABLE
   * 2. Verify driver is AVAILABLE
   * 3. Update trip status to DISPATCHED
   * 4. Set vehicle status to ON_TRIP
   * 5. Set driver status to ON_TRIP
   *
   * If ANY step fails, the entire transaction is rolled back.
   */
  async dispatch(id: number) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { vehicle: true, driver: true },
      });

      if (!trip) throw new Error("Trip not found.");
      if (trip.status !== "DRAFT") {
        throw new Error(`Cannot dispatch a trip with status "${trip.status}". Must be DRAFT.`);
      }

      // BUSINESS RULE: Vehicle must be AVAILABLE and updated atomically
      const vehicleUpdate = await tx.vehicle.updateMany({
        where: { id: trip.vehicleId, status: "AVAILABLE" },
        data: { status: "ON_TRIP" },
      });
      if (vehicleUpdate.count === 0) {
        throw new Error(
          `Vehicle ${trip.vehicle.registrationNo} is currently not AVAILABLE or was dispatched concurrently.`
        );
      }

      // BUSINESS RULE: Driver must be AVAILABLE and updated atomically
      const driverUpdate = await tx.driver.updateMany({
        where: { id: trip.driverId, status: "AVAILABLE" },
        data: { status: "ON_TRIP" },
      });
      if (driverUpdate.count === 0) {
        throw new Error(
          `Driver ${trip.driver.name} is currently not AVAILABLE or was dispatched concurrently.`
        );
      }

      if (trip.driver.licenseExpiry <= new Date()) {
        throw new Error(`Driver ${trip.driver.name}'s license expired on ${trip.driver.licenseExpiry.toDateString()}.`);
      }

      // All checks passed — execute the state transitions atomically
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status: "DISPATCHED" },
        include: {
          vehicle: { select: { registrationNo: true, name: true } },
          driver: { select: { name: true } },
        },
      });

      io.emit("tripUpdated", { action: "dispatch", trip: updatedTrip });
      return updatedTrip;
    });
  },

  /**
   * Complete a trip: DISPATCHED → COMPLETED.
   * Releases the vehicle and driver back to AVAILABLE.
   */
  async complete(id: number, data?: { actualDistance?: number; revenue?: number }) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { vehicle: true, driver: true },
      });

      if (!trip) throw new Error("Trip not found.");
      if (trip.status !== "DISPATCHED") {
        throw new Error(`Cannot complete a trip with status "${trip.status}". Must be DISPATCHED.`);
      }

      const [updatedTrip] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: { 
            status: "COMPLETED",
            actualDistance: data?.actualDistance,
            revenue: data?.revenue,
            completedAt: new Date()
          },
          include: {
            vehicle: { select: { registrationNo: true, name: true } },
            driver: { select: { name: true } },
          },
        }),
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        }),
        tx.driver.update({
          where: { id: trip.driverId },
          data: { status: "AVAILABLE" },
        }),
      ]);

      io.emit("tripUpdated", { action: "complete", trip: updatedTrip });
      return updatedTrip;
    });
  },

  /**
   * Cancel a trip: DRAFT or DISPATCHED → CANCELLED.
   * If the trip was DISPATCHED, releases vehicle/driver back to AVAILABLE.
   */
  async cancel(id: number) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { vehicle: true, driver: true },
      });

      if (!trip) throw new Error("Trip not found.");
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
        throw new Error(`Cannot cancel a trip that is already "${trip.status}".`);
      }

      const updates: Promise<unknown>[] = [
        tx.trip.update({
          where: { id },
          data: { status: "CANCELLED" },
        }),
      ];

      // Only release vehicle/driver if the trip was actively dispatched
      if (trip.status === "DISPATCHED") {
        updates.push(
          tx.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: "AVAILABLE" },
          }),
          tx.driver.update({
            where: { id: trip.driverId },
            data: { status: "AVAILABLE" },
          })
        );
      }

      await Promise.all(updates);

      const updatedTrip = await tx.trip.findUnique({
        where: { id },
        include: {
          vehicle: { select: { registrationNo: true, name: true } },
          driver: { select: { name: true } },
        },
      });
      
      io.emit("tripUpdated", { action: "cancel", trip: updatedTrip });
      return updatedTrip;
    });
  },

  /**
   * Trip statistics for the dashboard.
   */
  async getStats() {
    const [total, draft, dispatched, completed, cancelled] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { status: "DRAFT" } }),
      prisma.trip.count({ where: { status: "DISPATCHED" } }),
      prisma.trip.count({ where: { status: "COMPLETED" } }),
      prisma.trip.count({ where: { status: "CANCELLED" } }),
    ]);

    return { total, draft, dispatched, completed, cancelled };
  },

  /**
   * Utilization statistics for the dashboard.
   */
  async getUtilizationStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompletedTrips = await prisma.trip.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: sevenDaysAgo } },
      select: { updatedAt: true },
    });

    const tripsPerDay: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = days[d.getDay()] as string;
      tripsPerDay[dayStr] = 0;
    }

    recentCompletedTrips.forEach(t => {
      const day = days[t.updatedAt.getDay()] as string;
      if (tripsPerDay[day] !== undefined) {
        tripsPerDay[day]++;
      }
    });

    const chartData = Object.keys(tripsPerDay).map(name => ({ name, trips: tripsPerDay[name] }));

    const onTripCount = await prisma.vehicle.count({ where: { status: "ON_TRIP" } });
    const totalCount = await prisma.vehicle.count({ where: { status: { not: "RETIRED" } } });
    const utilizationPercent = totalCount === 0 ? 0 : Math.round((onTripCount / totalCount) * 100);

    return { chartData, utilizationPercent };
  },
};
