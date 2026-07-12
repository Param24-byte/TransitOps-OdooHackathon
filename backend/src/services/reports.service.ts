import prisma from "../lib/prisma";

export const reportsService = {
  async getFuelEfficiency() {
    // sum(trip.plannedDistance or actualDistance) / sum(fuelLog.liters) per vehicle
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: {
          where: { status: "COMPLETED" },
        },
        fuelLogs: true,
      },
    });

    return vehicles.map(v => {
      const totalDistance = v.trips.reduce((acc, t) => acc + (t.actualDistance || t.plannedDistance || 0), 0);
      const totalFuel = v.fuelLogs.reduce((acc, f) => acc + f.liters, 0);
      
      const efficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;
      
      return {
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        name: v.name,
        totalDistance,
        totalFuel,
        efficiency: Number(efficiency.toFixed(2))
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  },

  async getOperationalCosts() {
    // sum(fuelLog.cost) + sum(maintenanceLog.cost) + sum(expense.amount) per vehicle
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: true,
        maintenanceLogs: true,
        expenses: true,
      }
    });

    return vehicles.map(v => {
      const fuelCost = v.fuelLogs.reduce((acc, f) => acc + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);
      const expensesCost = v.expenses.reduce((acc, e) => acc + e.amount, 0);
      
      const totalCost = fuelCost + maintenanceCost + expensesCost;
      
      return {
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        name: v.name,
        fuelCost,
        maintenanceCost,
        expensesCost,
        totalCost
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  },

  async getFleetUtilization() {
    const onTripCount = await prisma.vehicle.count({ where: { status: "ON_TRIP" } });
    const totalCount = await prisma.vehicle.count({ where: { status: { not: "RETIRED" } } });
    const utilizationPercent = totalCount === 0 ? 0 : Math.round((onTripCount / totalCount) * 100);

    return {
      onTripCount,
      totalCount,
      utilizationPercent
    };
  },

  async getVehicleROI() {
    // (revenue - (maintenanceCost + fuelCost)) / acquisitionCost per vehicle
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: {
          where: { status: "COMPLETED" },
        },
        fuelLogs: true,
        maintenanceLogs: true,
        expenses: true
      },
    });

    return vehicles.map(v => {
      const revenue = v.trips.reduce((acc, t) => acc + (t.revenue || 0), 0);
      const fuelCost = v.fuelLogs.reduce((acc, f) => acc + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);
      const expensesCost = v.expenses.reduce((acc, e) => acc + e.amount, 0);
      
      const totalCost = fuelCost + maintenanceCost + expensesCost;
      
      const profit = revenue - totalCost;
      const roi = v.acquisitionCost > 0 ? (profit / v.acquisitionCost) * 100 : 0;
      
      return {
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        name: v.name,
        revenue,
        totalCost,
        profit,
        acquisitionCost: v.acquisitionCost,
        roiPercent: Number(roi.toFixed(2))
      };
    }).sort((a, b) => b.roiPercent - a.roiPercent);
  },
  
  async getExportCSV(type: string) {
    let headers: string[] = [];
    let rows: any[][] = [];
    
    if (type === "fuel-efficiency") {
      const data = await this.getFuelEfficiency();
      headers = ["Registration No", "Name", "Total Distance (km)", "Total Fuel (L)", "Efficiency (km/L)"];
      rows = data.map(d => [d.registrationNo, d.name, d.totalDistance, d.totalFuel, d.efficiency]);
    } else if (type === "operational-costs") {
      const data = await this.getOperationalCosts();
      headers = ["Registration No", "Name", "Fuel Cost", "Maintenance Cost", "Other Expenses", "Total Cost"];
      rows = data.map(d => [d.registrationNo, d.name, d.fuelCost, d.maintenanceCost, d.expensesCost, d.totalCost]);
    } else if (type === "vehicle-roi") {
      const data = await this.getVehicleROI();
      headers = ["Registration No", "Name", "Revenue", "Total Cost", "Profit", "Acquisition Cost", "ROI (%)"];
      rows = data.map(d => [d.registrationNo, d.name, d.revenue, d.totalCost, d.profit, d.acquisitionCost, d.roiPercent]);
    } else {
      throw new Error("Invalid export type");
    }
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");
    
    return csvContent;
  }
};
