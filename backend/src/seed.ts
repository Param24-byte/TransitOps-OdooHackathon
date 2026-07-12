// src/seed.ts
// Database seeder — populates the database with sample data for development.
// Run with: npm run seed
//
// This creates:
// - 1 user per role (Fleet Manager, Driver, Safety Officer, Financial Analyst)
// - 5 vehicles with varying statuses
// - 4 drivers
// - Sample trips, maintenance logs, fuel logs, and expenses

import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "./lib/prisma";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data (in reverse dependency order)
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data.");

  // ---- Users ----
  const password = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { email: "fleet@transitops.com", password, name: "Rahul Sharma", role: "FLEET_MANAGER" },
    }),
    prisma.user.create({
      data: { email: "driver@transitops.com", password, name: "Amit Kumar", role: "DRIVER" },
    }),
    prisma.user.create({
      data: { email: "safety@transitops.com", password, name: "Priya Singh", role: "SAFETY_OFFICER" },
    }),
    prisma.user.create({
      data: { email: "finance@transitops.com", password, name: "Neha Gupta", role: "FINANCIAL_ANALYST" },
    }),
  ]);

  console.log(`✅ Created ${users.length} users.`);

  // ---- Vehicles ----
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNo: "MH-12-AB-1234",
        name: "Tata Ace Gold",
        type: "Light Truck",
        capacity: 750,
        odometer: 45200,
        acquisitionCost: 650000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNo: "MH-14-CD-5678",
        name: "Ashok Leyland Dost",
        type: "Mini Truck",
        capacity: 1500,
        odometer: 78300,
        acquisitionCost: 850000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNo: "MH-04-EF-9012",
        name: "Eicher Pro 2049",
        type: "Medium Truck",
        capacity: 5000,
        odometer: 120500,
        acquisitionCost: 1500000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNo: "MH-01-GH-3456",
        name: "BharatBenz 1617R",
        type: "Heavy Truck",
        capacity: 16000,
        odometer: 230100,
        acquisitionCost: 2800000,
        status: "IN_SHOP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNo: "MH-09-IJ-7890",
        name: "Tata LPT 1613",
        type: "Heavy Truck",
        capacity: 12000,
        odometer: 310000,
        acquisitionCost: 2200000,
        status: "RETIRED",
      },
    }),
  ]);

  console.log(`✅ Created ${vehicles.length} vehicles.`);

  // ---- Drivers ----
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Rajesh Patil",
        licenseNumber: "MH1220230045678",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2028-06-15"),
        contactNumber: "+91-9876543210",
        safetyScore: 95.5,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Suresh Yadav",
        licenseNumber: "MH1420240012345",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2029-03-20"),
        contactNumber: "+91-9876543211",
        safetyScore: 88.0,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Vikram Joshi",
        licenseNumber: "MH0420220098765",
        licenseCategory: "LMV",
        licenseExpiry: new Date("2027-11-30"),
        contactNumber: "+91-9876543212",
        safetyScore: 92.3,
        status: "OFF_DUTY",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Deepak Thakur",
        licenseNumber: "MH0120230076543",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2027-01-10"),
        contactNumber: "+91-9876543213",
        safetyScore: 78.0,
        status: "AVAILABLE",
      },
    }),
  ]);

  console.log(`✅ Created ${drivers.length} drivers.`);

  // ---- Trips ----
  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        source: "Mumbai Warehouse",
        destination: "Pune Distribution Center",
        cargoWeight: 600,
        plannedDistance: 150,
        status: "COMPLETED",
        vehicleId: vehicles[0]!.id,
        driverId: drivers[0]!.id,
      },
    }),
    prisma.trip.create({
      data: {
        source: "Nashik Depot",
        destination: "Aurangabad Hub",
        cargoWeight: 1200,
        plannedDistance: 190,
        status: "COMPLETED",
        vehicleId: vehicles[1]!.id,
        driverId: drivers[1]!.id,
      },
    }),
    prisma.trip.create({
      data: {
        source: "Pune Depot",
        destination: "Kolhapur Warehouse",
        cargoWeight: 400,
        plannedDistance: 230,
        status: "DRAFT",
        vehicleId: vehicles[0]!.id,
        driverId: drivers[0]!.id,
      },
    }),
  ]);

  console.log(`✅ Created ${trips.length} trips.`);

  // ---- Maintenance Logs ----
  await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        date: new Date("2026-06-15"),
        description: "Engine oil change and filter replacement",
        cost: 4500,
        vehicleId: vehicles[0]!.id,
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        date: new Date("2026-07-01"),
        description: "Brake pad replacement and wheel alignment",
        cost: 12000,
        vehicleId: vehicles[3]!.id,
      },
    }),
  ]);

  console.log("✅ Created 2 maintenance logs.");

  // ---- Fuel Logs ----
  await Promise.all([
    prisma.fuelLog.create({
      data: { date: new Date("2026-07-01"), liters: 45, cost: 4725, vehicleId: vehicles[0]!.id },
    }),
    prisma.fuelLog.create({
      data: { date: new Date("2026-07-03"), liters: 60, cost: 6300, vehicleId: vehicles[1]!.id },
    }),
    prisma.fuelLog.create({
      data: { date: new Date("2026-07-05"), liters: 80, cost: 8400, vehicleId: vehicles[2]!.id },
    }),
    prisma.fuelLog.create({
      data: { date: new Date("2026-07-08"), liters: 50, cost: 5250, vehicleId: vehicles[0]!.id },
    }),
  ]);

  console.log("✅ Created 4 fuel logs.");

  // ---- Expenses ----
  await Promise.all([
    prisma.expense.create({
      data: { date: new Date("2026-07-02"), type: "TOLL", description: "Mumbai-Pune Expressway toll", amount: 350 },
    }),
    prisma.expense.create({
      data: { date: new Date("2026-07-04"), type: "PERMIT", description: "Inter-state transport permit renewal", amount: 5000 },
    }),
    prisma.expense.create({
      data: { date: new Date("2026-07-06"), type: "INSURANCE", description: "Annual vehicle insurance - MH-12-AB-1234", amount: 25000 },
    }),
  ]);

  console.log("✅ Created 3 expenses.");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Test credentials:");
  console.log("   Fleet Manager: fleet@transitops.com / password123");
  console.log("   Driver:        driver@transitops.com / password123");
  console.log("   Safety Officer: safety@transitops.com / password123");
  console.log("   Finance:       finance@transitops.com / password123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
