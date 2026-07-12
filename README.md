# TransitOps 🚚 - Odoo Hackathon Submission

TransitOps is a modern, real-time fleet management and logistics dashboard built from scratch. It minimizes reliance on 3rd-party APIs, relying instead on a robust, bespoke full-stack architecture designed for performance, modularity, and an intuitive user experience.

## ✨ Features

- **Real-Time Synchronization**: Sockets (`socket.io`) instantly push state changes (like trip dispatches and completions) across all connected clients without page reloads.
- **Dynamic Analytics Dashboard**: Beautiful, responsive charts built with `Recharts` to monitor fleet utilization and status distributions at a glance.
- **Robust Input Validation**: Strict client-side validation powered by `Zod` and `React Hook Form` ensures data integrity with graceful inline error handling.
- **Premium UI/UX**:
  - Built with `Tailwind CSS`, `shadcn/ui`, and `Framer Motion` for smooth page transitions.
  - Animated Skeleton loaders for seamless data fetching.
  - Native **Light & Dark Mode** support.
- **Atomicity**: Complex database operations (like dispatching a trip and updating vehicle/driver states simultaneously) are wrapped in Prisma Transactions to ensure 100% data consistency.

---

## 🏗 Architecture & Tech Stack

The project follows a modular Service-Controller-Router pattern.

### Backend
- **Runtime**: Node.js & Express.js (TypeScript)
- **Database**: PostgreSQL (via Prisma ORM)
- **Real-Time**: Socket.io
- **Security**: JWT Authentication, bcrypt password hashing, CORS.

### Frontend
- **Framework**: React.js (Vite) & TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS, shadcn/ui
- **State/Fetching**: Axios, Context API
- **Validation**: Zod + React Hook Form
- **Animation**: Framer Motion

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally

### 1. Database Setup
Ensure PostgreSQL is running. Open your terminal and create the database:
```bash
createdb transitops
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Postgres connection string, e.g.:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/transitops?schema=public"

# Run migrations and seed data
npx prisma migrate dev --name init
npm run seed

# Start the dev server
npm run dev
```
The backend will run on `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install

# Start the Vite server
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 4. Demo Login
Use the seeded credentials to log in:
- **Email:** `fleet@transitops.com`
- **Password:** `password123`

---

## 🛠 Design Decisions & Judging Criteria Addressed

1. **Clean Code & Modularity**: The backend strictly separates concerns (Routes -> Controllers -> Services).
2. **Database Design**: The PostgreSQL schema uses Enums (`TripStatus`, `VehicleStatus`) and foreign keys with referential integrity to enforce business rules at the database level.
3. **User Error & Usability**: Replaced generic alerts with intuitive inline Zod validation and non-blocking toast notifications.
4. **Performance & Scalability**: Skeleton loaders keep the perceived performance high. Using Prisma transactions ensures the system can scale to handle concurrent dispatch requests without race conditions.

---

*Built with ❤️ for the Odoo Hackathon.*
