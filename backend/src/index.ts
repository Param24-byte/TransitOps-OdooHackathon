// src/index.ts
// Entry point for the TransitOps backend server.
//
// ARCHITECTURE:
// 1. Express handles all HTTP requests (REST API).
// 2. Socket.io is attached to the same HTTP server for real-time events.
// 3. CORS is configured to allow the React frontend to communicate.
// 4. All routes are prefixed under /api for clean separation.
// 5. The global error handler is registered LAST (Express requirement).

import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketServer } from "socket.io";

// Route imports
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import driverRoutes from "./routes/driver.routes";
import tripRoutes from "./routes/trip.routes";
import maintenanceRoutes from "./routes/maintenance.routes";
import fuelRoutes from "./routes/fuel.routes";
import expenseRoutes from "./routes/expense.routes";

// Middleware imports
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const server = http.createServer(app);

// Socket.io setup — attached to the same HTTP server
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default dev server port
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// ---- Global Middleware ----
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// ---- API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/expenses", expenseRoutes);

// Health check endpoint (useful for Docker/deployment verification)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TransitOps API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ---- Socket.io Connection Handler ----
io.on("connection", (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Export io so services can emit events (e.g., after dispatching a trip)
export { io };

// ---- Global Error Handler (MUST be registered last) ----
app.use(errorHandler);

// ---- Start Server ----
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 TransitOps API server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io listening for real-time connections`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
