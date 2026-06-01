# LifeFlow AI - Emergency Blood Donor Finder and Alert System

This file serves as the workspace guide and phased implementation log for the project.

---

## Tech Stack
- **Backend**: Node.js + Express.js + Mongoose/MongoDB
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Proximity Mapping**: Leaflet.js (OpenStreetMap) for free, account-less map styling
- **AI Core**: Google Gen AI (Gemini API) with local fallback diagnostics

---

## Directory Architecture
```
blood-bank/
├── package.json        # Root scripts coordinator
├── plan.md             # This guide
├── backend/            # Express Node Server
│   ├── src/
│   │   ├── config/     # MongoDB connector config
│   │   ├── models/     # Users, Donors, Requests, Notifications models
│   │   ├── routes/     # Express route handlers
│   │   ├── controllers/# Business logic (auth, matching, requests, AI)
│   │   └── utils/      # Haversine proximity formulas, seed data scripts
│   └── package.json
└── frontend/           # React Client App
    ├── src/
    │   ├── components/ # Leaflet mapping & Navigation headers
    │   ├── context/    # Global Authentication states
    │   └── pages/      # Views (Login, Signup, Dashboard, AI Chat, Auditor)
    └── package.json
```

---

## Phased Execution Progress

- [x] **Phase 1: Project & Backend Setup**
  - [x] Monorepo structure, package managers, typescript dependencies
  - [x] Environment files (`.env`) configuring local fallback parameters
  - [x] Mongoose structures defining indexing filters and geometry targets
- [x] **Phase 2: Core Matching Logic & AI Connectors**
  - [x] Implementing Haversine distance computations and scoring matrix in backend
  - [x] Setting up Gemini API hooks for eligibility and compatibility assistants
  - [x] Implementing local rules engine as robust API fallback
- [x] **Phase 3: Frontend Client Setup & Shell**
  - [x] Scaffold Vite app, Tailwind configurations, stylesheet animations
  - [x] Context provider handling local tokens, registrations, and logins
- [x] **Phase 4: Proximity Maps & Dashboards**
  - [x] Integrating Leaflet mapping canvas, drawing hospital locations and donor pins
  - [x] Setting up Login, Register, and Emergency submission portals
  - [x] Creating dashboard tracking pending request logs
- [x] **Phase 5: AI & Auditor Portals**
  - [x] Building AI chat dialog boxes with suggestion chips
  - [x] Building sliders auditing weight, age, and chronic conditions
- [x] **Phase 6: Seeding & Verification**
  - [x] Creating seed script placing mock accounts around Bangalore area
  - [x] Verifying API distance checks and score calculations
- [x] **Phase 7: Backend Admin Panel Expansion**
  - [x] Verification updates, donations tracking, and compliance logs
- [x] **Phase 8: Frontend Admin UI Setup & Analytics**
  - [x] recharts integration, statistics dashboard, and donor audit panels
- [x] **Phase 9: User & Inventory Modules**
  - [x] user deletion controls, blood stock adjusting triggers, and CSV reports

---

## How to Run the Project

### Prerequisites
1. **Node.js**: Ensure Node.js is installed (`node --version`).
2. **MongoDB**: Make sure a local MongoDB instance is executing on `mongodb://127.0.0.1:27017/blood_bank` (or edit `backend/.env` with your custom connection string).
3. **Gemini API Key (Optional)**: If you have one, add it to `GEMINI_API_KEY=` in `backend/.env`. If omitted, the server automatically defaults to the robust built-in local heuristics engines.

### Execution Instructions
From the root project directory:

1. **Seed Testing Database**:
   Populate testing accounts (recipients, admin, and surrounding compatible/resting donors):
   ```bash
   npm run seed
   ```

2. **Start Backend Server** (Port `5000`):
   ```bash
   npm run dev:backend
   ```

3. **Start Frontend Server** (Port `5173` / Vite default):
   ```bash
   npm run dev:frontend
   ```

---

## Testing Credentials
After seeding the database, you can log in with these profiles:
- **Recipient**: `karan@gmail.com` / `password123`
- **Donor (Available, 1km Proximity)**: `rahul@gmail.com` / `password123`
- **Donor (Resting/In Cooldown)**: `priya@gmail.com` / `password123`
- **Donor (Unavailable)**: `neha@gmail.com` / `password123`
