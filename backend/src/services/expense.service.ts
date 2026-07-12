// src/services/expense.service.ts
// General expense tracking (tolls, permits, miscellaneous costs).

import prisma from "../lib/prisma";

export const expenseService = {
  /**
   * Get all expenses, ordered by date descending.
   */
  async getAll() {
    return prisma.expense.findMany({
      include: {
        vehicle: {
          select: { id: true, registrationNo: true, name: true, status: true }
        }
      },
      orderBy: { date: "desc" },
    });
  },

  /**
   * Create a new expense entry.
   */
  async create(data: {
    date: string;
    type: string;
    description: string;
    amount: number;
    vehicleId: number;
  }) {
    return prisma.expense.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        amount: data.amount,
        vehicleId: data.vehicleId,
      },
    });
  },

  /**
   * Delete an expense by ID.
   */
  async delete(id: number) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new Error("Expense not found.");
    }
    return prisma.expense.delete({ where: { id } });
  },

  /**
   * Get expense summary grouped by type (for charts).
   */
  async getSummary() {
    const summary = await prisma.expense.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: true,
    });

    const totalExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
    });

    return {
      byType: summary.map((s) => ({
        type: s.type,
        totalAmount: Math.round((s._sum.amount || 0) * 100) / 100,
        count: s._count,
      })),
      grandTotal: Math.round((totalExpenses._sum.amount || 0) * 100) / 100,
    };
  },
};
