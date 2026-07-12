# TransitOps 🚚 - Odoo Hackathon Submission

TransitOps is a modern, real-time fleet management and logistics dashboard built from scratch. It minimizes reliance on 3rd-party APIs, relying instead on a robust, bespoke full-stack architecture designed for performance, modularity, and an intuitive user experience.

---

## 📸 Application Showcase & Features

### 1. 📊 Interactive Dashboard
* **Use Case:** Monitor key metrics like active trips, vehicles in maintenance, driver statuses, and fleet utilization with dynamic, real-time charts. Get a bird's-eye view of your entire operation at a single glance.
<br>
<img src="./docs/dashboard.png" alt="Dashboard Screenshot" width="800"/>

### 2. 💸 Expenses & Direct Fuel Logging
* **Use Case:** Keep a strict record of all operational costs including insurance, tolls, and permits. Includes a dedicated modal to log fuel usage directly against individual vehicles.
<br>
<img src="./docs/expenses.png" alt="Expenses Screenshot" width="800"/>

### 3. 📈 Reports & Analytics
* **Use Case:** Export actionable insights via CSV, including fuel efficiency, vehicle ROI, and operational costs. View a graphical breakdown (Bar Charts) of total expenses for each individual vehicle to quickly identify cost outliers.
<br>
<img src="./docs/reports.png" alt="Reports Screenshot" width="800"/>

### 4. 👥 Driver Management & Safety Scoring
* **Use Case:** Manage driver profiles, track license categories and expiries, and monitor safety scores to ensure fleet compliance and driver accountability.
<br>
<img src="./docs/drivers.png" alt="Drivers Screenshot" width="800"/>

### 5. ⚙️ Settings & Customization
* **Use Case:** Personalize the dashboard interface. The application features native support for a sleek Dark Mode to reduce eye strain during late-night monitoring.
<br>
<img src="./docs/settings.png" alt="Settings Screenshot" width="800"/>

*(Note: Please ensure the screenshots are placed in a `docs/` folder in the root directory with the matching filenames).*

---

## 🚀 Try it Out! (Live Demo Credentials)

Explore the platform as an administrative **Fleet Manager** using the seeded demo credentials:

> 📧 **Email:** `fleet@transitops.com`
> 🔑 **Password:** `password123`

---

## ✨ Core Technical Features

- **Real-Time Synchronization**: Sockets (`socket.io`) instantly push state changes (like trip dispatches and completions) across all connected clients without page reloads.
- **Dynamic Analytics Dashboard**: Beautiful, responsive charts built with `Recharts`.
- **Robust Input Validation**: Strict client-side validation powered by `Zod` and `React Hook Form` ensures data integrity.
- **Premium UI/UX**: Built with `Tailwind CSS`, `shadcn/ui`, and `Framer Motion` for smooth page transitions and animated Skeleton loaders.
- **Atomicity**: Complex database operations are wrapped in Prisma Transactions to ensure 100% data consistency.

---

## 🏗 Architecture & Tech Stack

The project follows a strict modular Service-Controller-Router pattern.

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
- **Charts**: Recharts

### System Flow
```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef db fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef wss fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef controller fill:#f3f4f6,stroke:#9ca3af,stroke-width:1px,color:#1f2937,rx:4,ry:4
    classDef service fill:#e5e7eb,stroke:#6b7280,stroke-width:1px,color:#1f2937,rx:4,ry:4

    subgraph Client ["Client Side (React / Vite)"]
        UI["React UI Components<br/>(Tailwind, shadcn/ui, Recharts)"]:::frontend
        State["State Management<br/>(React Context)"]:::frontend
        DataFetch["REST Client<br/>(Axios)"]:::frontend
        WSClient["WebSocket Client<br/>(Socket.io-client)"]:::wss
        
        UI --> State
        State --> DataFetch
        State --> WSClient
    end

    subgraph Server ["Backend Server (Node.js / Express)"]
        Gateway["Express Router & Middleware<br/>(Auth, Validation, Error Handling)"]:::backend
        WSServer["WebSocket Server<br/>(Socket.io)"]:::wss
        
        subgraph Controllers ["Controllers (Request/Response)"]
            AuthC["Auth Controller"]:::controller
            TripC["Trip Controller"]:::controller
            VehicleC["Vehicle Controller"]:::controller
            DriverC["Driver Controller"]:::controller
            ReportC["Report Controller"]:::controller
        end
        
        subgraph Services ["Services (Business Logic & Transactions)"]
            AuthS["Auth Service"]:::service
            TripS["Trip Service"]:::service
            VehicleS["Vehicle Service"]:::service
            DriverS["Driver Service"]:::service
            ReportS["Report Service"]:::service
        end
        
        ORM["Prisma ORM<br/>(Data Access Layer)"]:::backend
    end

    subgraph Database ["Storage Layer"]
        Postgres[("PostgreSQL DB<br/>(Relational Data)")]:::db
    end

    %% Connections
    DataFetch -- "HTTP Request (JWT)" --> Gateway
    WSClient <== "Real-time Sync" ==> WSServer

    Gateway --> AuthC & TripC & VehicleC & DriverC & ReportC
    
    AuthC --> AuthS
    TripC --> TripS
    VehicleC --> VehicleS
    DriverC --> DriverS
    ReportC --> ReportS

    Services --> ORM
    ORM <== "TCP/IP" ==> Postgres
    
    %% Realtime Events
    TripS -. "Emits State Change" .-> WSServer
    VehicleS -. "Emits State Change" .-> WSServer
    DriverS -. "Emits State Change" .-> WSServer
```

---

## 🗄️ Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        Int id PK
        String email
        String password
        String name
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Vehicle {
        Int id PK
        String registrationNo
        String name
        String type
        Float capacity
        Float odometer
        Float acquisitionCost
        VehicleStatus status
        String region
    }

    Driver {
        Int id PK
        String name
        String licenseNumber
        String licenseCategory
        DateTime licenseExpiry
        String contactNumber
        Float safetyScore
        DriverStatus status
    }

    Trip {
        Int id PK
        String source
        String destination
        Float cargoWeight
        Float plannedDistance
        Float actualDistance
        Float revenue
        DateTime completedAt
        TripStatus status
        Int vehicleId FK
        Int driverId FK
    }

    MaintenanceLog {
        Int id PK
        DateTime date
        String description
        Float cost
        MaintenanceStatus status
        DateTime closedAt
        Int vehicleId FK
    }

    FuelLog {
        Int id PK
        DateTime date
        Float liters
        Float cost
        Int vehicleId FK
    }

    Expense {
        Int id PK
        DateTime date
        String type
        String description
        Float amount
        Int vehicleId FK
    }

    Vehicle ||--o{ Trip : "trips"
    Driver ||--o{ Trip : "trips"
    Vehicle ||--o{ MaintenanceLog : "maintenanceLogs"
    Vehicle ||--o{ FuelLog : "fuelLogs"
    Vehicle ||--o{ Expense : "expenses"
```

---

## ⚙️ Getting Started

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
# Edit .env with your Postgres connection string

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

---

## 🛠 Design Decisions & Hackathon Criteria

1. **Clean Code & Modularity**: The backend strictly separates concerns (Routes -> Controllers -> Services) making it highly maintainable.
2. **Database Design**: The PostgreSQL schema utilizes Native Enums and strict referential integrity to enforce business rules.
3. **User Error & Usability**: Replaced native generic alerts with intuitive inline Zod validation and non-blocking toast notifications.
4. **Performance & Scalability**: Skeleton loaders keep perceived performance high, while backend transactions prevent race conditions during concurrent updates.

---
*Built with ❤️ for the Odoo Hackathon.*
