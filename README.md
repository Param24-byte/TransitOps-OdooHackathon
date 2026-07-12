# TransitOps - Smart Transport Operations Platform

TransitOps is a centralized, end-to-end transport operations platform designed to digitize vehicle, driver, dispatch, maintenance, and expense management. It enforces strict business rules and provides real-time operational insights without relying on external 3rd-party SaaS APIs.

## 🚀 Tech Stack & Architecture

This project is built with a strictly typed, modular, and enterprise-grade architecture:

### Frontend
- **Framework:** React + Vite (TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui for a premium, clean, and interactive UI
- **Animations:** Framer Motion for micro-interactions and smooth navigation
- **Charts:** Recharts for dynamic visual analytics (ROI, Fleet Utilization)
- **Real-time:** Socket.io-client for live dashboard updates

### Backend
- **Framework:** Node.js + Express (TypeScript)
- **Architecture:** Modular MVC pattern (Routes ➔ Controllers ➔ Services)
- **Validation:** Strict server-side payload validation for robust error handling
- **Real-time:** Socket.io server to push dynamic updates to connected clients
- **Authentication:** Custom JWT-based Role-Based Access Control (RBAC) (No Auth0/Firebase)

### Database
- **Database:** PostgreSQL (Running locally via Docker)
- **ORM:** Prisma for type-safe schema modeling, migrations, and referential integrity

---

## 🛠️ Key Features

1. **Authentication & RBAC:** Secure login for Fleet Managers, Drivers, Safety Officers, and Financial Analysts.
2. **Real-Time Dashboard:** Live KPIs for active vehicles, pending trips, and fleet utilization.
3. **Vehicle & Driver Registries:** Full CRUD operations with strict status enums (`Available`, `On Trip`, `In Shop`, `Suspended`).
4. **Trip Management:** Comprehensive trip lifecycle (Draft ➔ Dispatched ➔ Completed ➔ Cancelled) with automatic entity status updates.
5. **Maintenance & Fuel Logs:** Automatic operational cost tracking and dynamic status routing.
6. **Graceful Error Handling:** Robust validation ensures bad data is caught at the API layer and returned as readable, user-friendly UI toasts.

---

## 🏗️ Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Docker Desktop
- npm or yarn

### 1. Database Setup
We use Docker to spin up a local PostgreSQL instance.

```bash
# Start the PostgreSQL container in the background
docker compose up -d

# Navigate to the backend
cd backend

# Push the Prisma schema to sync the database
npx prisma db push
```

### 2. Backend Setup
```bash
# Open a new terminal and navigate to the backend
cd backend

# Install dependencies
npm install

# Start the Express server (typically runs on port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to the frontend
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

---

## 🧠 Evaluation Criteria Addressed
- **Clean Code & Modularity:** Separation of concerns in both frontend (components/pages) and backend (routes/controllers/services).
- **Zero 3rd-Party API Reliance:** Fully self-hosted authentication, file storage, and real-time sockets.
- **Dynamic Database & Real-Time:** Socket.io ensures the UI reacts instantly to database mutations.
- **Robustness:** No raw stack traces exposed to the user. Every edge case (e.g. assigning a suspended driver to a trip) is gracefully caught.
- **Scalability & Security:** Password hashing via bcrypt, JWT route protection, and optimized relational database design via Prisma.
