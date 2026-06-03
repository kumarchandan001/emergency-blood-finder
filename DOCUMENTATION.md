# 🩸 LifeFlow AI — Technical Documentation & Architecture Manual

**LifeFlow AI** is a full-stack emergency matchmaking platform designed to connect patients with nearby compatible blood donors in real-time. Instead of acting as a static database, the system calculates proximity rankings, validates donor health metrics with Gemini AI, and dispatches targeted alerts instantly.

This document provides detailed documentation of the application's design, database schemas, algorithms, AI services, frontend portals, API endpoints, and execution workflows.

---

## 🗺️ System Overview & Directory Architecture

LifeFlow AI is structured as a monorepo consisting of an Express/Node.js backend and a React/Vite/TypeScript frontend.

```
blood-bank/
├── package.json          # Root scripts coordinator
├── plan.md               # Implementation phase log
├── README.md             # Project introductory documentation
├── DOCUMENTATION.md      # This file (Detailed architectural manual)
├── backend/              # Node.js + Express + TypeScript Server
│   ├── src/
│   │   ├── config/       # Database connector (MongoDB connection configuration)
│   │   ├── middleware/   # Authentication (JWT verification and role checks)
│   │   ├── models/       # Mongoose schemas (User, Donor, Request, etc.)
│   │   ├── routes/       # Express route handlers (auth, donor, requests, admin, ai)
│   │   ├── controllers/  # Business logic implementations
│   │   │   ├── authController.ts
│   │   │   ├── donorController.ts
│   │   │   ├── requestController.ts
│   │   │   ├── adminController.ts
│   │   │   └── aiController.ts
│   │   └── utils/        # Mathematical helpers (Haversine formula, database seed scripts)
│   └── package.json
└── frontend/             # React Client Application (Vite + TypeScript + Tailwind CSS)
    ├── src/
    │   ├── components/   # Leaflet mapping and navbar controls
    │   ├── context/      # Global state providers (Authentication Context)
    │   ├── pages/        # Route views (Login, Dashboards, AIChat, Eligibility, Reports, etc.)
    │   ├── App.css       # Global visual animations and styles
    │   ├── index.css     # Design tokens and tailwind imports
    │   └── main.tsx      # Client entry point
    └── package.json
```

---

## 🗄️ Database Models (Mongoose Schema Design)

All models are built using standard Mongoose schemas. Location fields use **GeoJSON Point** geometries indexed with `2dsphere` to allow optimized geospatial indexing and queries.

### 1. `User` Schema ([User.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/User.ts))
Holds authentication credentials, roles, and profiles.
*   `name` (String, required): User's full name.
*   `email` (String, required, unique, lowercase): User's authentication email.
*   `password` (String, required, minlength: 6): Bcrypt-hashed password.
*   `role` (String, default: 'recipient'): Role flag, must be one of `['donor', 'recipient', 'admin']`.
*   `createdAt` (Date, default: `Date.now`): Timestamp.

### 2. `Donor` Schema ([Donor.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/Donor.ts))
Contains metrics and location details for registered blood donors.
*   `userId` (ObjectId, ref: 'User', required): Relation to user profile.
*   `bloodGroup` (String, required): Target blood group, must be one of `['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']`.
*   `phone` (String, required): Mobile number for SMS dispatch simulations.
*   `age` (Number, required): Donor age (used for eligibility checks).
*   `gender` (String, required): One of `['Male', 'Female', 'Other']`.
*   `city` (String, required): City boundary string.
*   `location` (GeoJSON Point, required): Latitude and longitude values. Indexed with `2dsphere` for geographic distance filters.
*   `lastDonationDate` (Date, optional): Cooldown check anchor point.
*   `available` (Boolean, default: true): Availability flag toggleable by the donor.
*   `eligibilityStatus` (Subdocument):
    *   `isEligible` (Boolean, default: true): Flag indicating if the donor passed the AI/heuristic checklist.
    *   `reason` (String): Diagnostic explanation details.
    *   `checkedAt` (Date): Timing log of verification diagnostics.
*   `verificationStatus` (String, default: 'Pending'): Auditing status: `['Pending', 'Approved', 'Rejected', 'Suspended']`.
*   `verifiedBy` (ObjectId, ref: 'User'): Admin ID responsible for status modification.
*   `verifiedAt` (Date): Audit date.
*   `verificationRemarks` (String): Auditable explanation remarks from admin.

### 3. `Request` Schema ([Request.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/Request.ts))
Created when recipients request emergency blood units.
*   `patientName` (String, required): Patient's name.
*   `hospitalName` (String, required): Target hospital center name/address.
*   `bloodGroup` (String, required): Blood group requested.
*   `unitsRequired` (Number, required, default: 1): Units needed.
*   `urgency` (String, default: 'High'): Urgency label, must be one of `['Critical', 'High', 'Medium']`.
*   `location` (GeoJSON Point, required): Geolocation tag of the hospital. Indexed with `2dsphere`.
*   `status` (String, default: 'Pending'): State indicator: `['Pending', 'Fulfilled', 'Cancelled']`.
*   `createdBy` (ObjectId, ref: 'User', required): ID of the recipient user.
*   `createdAt` (Date, default: `Date.now`): Creation timestamp.

### 4. `Notification` Schema ([Notification.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/Notification.ts))
Logs dispatch records and matching responses.
*   `requestId` (ObjectId, ref: 'Request', required): Link to the emergency campaign.
*   `donorId` (ObjectId, ref: 'Donor', required): Link to the targeted donor.
*   `message` (String, required): Formatted text alert details.
*   `status` (String, default: 'Sent'): Response tracker state: `['Sent', 'Accepted', 'Rejected']`.
*   `createdAt` (Date, default: `Date.now`): Timestamp.

### 5. `BloodInventory` Schema ([BloodInventory.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/BloodInventory.ts))
Monitors static blood stock reserves (e.g., blood bank centers).
*   `bloodGroup` (String, unique): Target blood type.
*   `availableUnits` (Number, default: 10): Current unit inventory level.
*   `lowStockThreshold` (Number, default: 5): Alert trigger point for low stock levels.
*   `updatedAt` (Date, default: `Date.now`): Last updated timestamp.

### 6. `Donation` Schema ([Donation.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/Donation.ts))
Keeps records of successfully completed donor match campaigns.
*   `donorId` (ObjectId, ref: 'Donor', required): The giving donor.
*   `requestId` (ObjectId, ref: 'Request', required): The emergency campaign.
*   `bloodGroup` (String, required): Transfused blood group.
*   `hospital` (String, required): Hospital destination.
*   `donationDate` (Date, default: `Date.now`): Timing log.
*   `remarks` (String): Campaign notes.

### 7. `AuditLog` Schema ([AuditLog.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/models/AuditLog.ts))
Tracks administrative actions for accountability.
*   `adminId` (ObjectId, ref: 'User', required): Performing admin.
*   `adminName` (String, required): Admin user's name.
*   `action` (String, required): Performed action (e.g., 'UPDATE_INVENTORY', 'DELETE_USER').
*   `details` (String, required): Log summary.
*   `ipAddress` (String, default: '127.0.0.1'): Connection IP.
*   `timestamp` (Date, default: `Date.now`): Timestamp.

---

## 🎯 Proximity-Based Matchmaking & Scoring Engine

The matchmaking module ([matching.ts](file:///c:/Users/Chandan%20Kumar/Desktop/blood%20bank/backend/src/utils/matching.ts)) uses geographical calculations and scoring heuristics to rank donors.

### 1. Blood Compatibility Matrix
Blood transfers are audited via a strict mapping rule:

| Recipient Blood Group | Compatible Donor Blood Groups |
| :--- | :--- |
| **O-** | `O-` |
| **O+** | `O+`, `O-` |
| **A-** | `A-`, `O-` |
| **A+** | `A+`, `A-`, `O+`, `O-` |
| **B-** | `B-`, `O-` |
| **B+** | `B+`, `B-`, `O+`, `O-` |
| **AB-** | `AB-`, `A-`, `B-`, `O-` |
| **AB+** | `AB+`, `AB-`, `A+`, `A-`, `B+`, `B-`, `O+`, `O-` (Universal Recipient) |

### 2. Distance Computation (Haversine Formula)
To locate compatible donors on the spherical surface of the Earth, the server calculates distances using the Haversine equation:

$$\Delta\text{lat} = \text{lat}_2 - \text{lat}_1$$
$$\Delta\text{lon} = \text{lon}_2 - \text{lon}_1$$
$$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta\text{lon}}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$\text{Distance} = R \cdot c$$

Where:
*   $R = 6371\text{ km}$ (Earth's radius)
*   Coordinates are converted from degrees to radians.

### 3. Match Scoring Weights
The system ranks eligible donors out of a **maximum score of 100 points**:

1.  **Availability Flag (40 Points)**:
    *   If `available === false`, matching returns a score of `0` (excluded from matching).
    *   If active and checked-in, the base score starts at `40`.
2.  **Proximity Distance Scoring (Max 40 Points)**:
    *   $\text{Distance} \le 2\text{ km}$: $+40$ points
    *   $\text{Distance} \le 5\text{ km}$: $+30$ points
    *   $\text{Distance} \le 10\text{ km}$: $+20$ points
    *   $\text{Distance} \le 20\text{ km}$: $+10$ points
    *   $\text{Distance} > 20\text{ km}$: $+5$ points
3.  **Recent Activity / Cooldown Check (Max 20 Points)**:
    *   Donors require a minimum **90-day rest interval** between donations.
    *   $\text{Donation Interval} < 90\text{ days}$: Returns a score of `0` (ineligible, safety cooldown lock).
    *   $\text{Donation Interval} > 180\text{ days}$ (or no history): $+20$ points (optimal readiness).
    *   $90\text{ days} \le \text{Donation Interval} \le 180\text{ days}$: $+10$ points (eligible but relatively recent).

---

## 🤖 Gemini AI Service & Heuristic Diagnostics

The application utilizes the Google Generative AI (Gemini API) to automate health diagnostics and answer compatibility queries, backed by a local rule-based fallback system.

### 1. Donor Health Diagnostics
*   **API Hook**: Prompt evaluates user age, weight, last donation date, chronic conditions, and medications using `gemini-1.5-flash` in JSON format.
*   **Prompt Configuration**:
    ```text
    Analyze the following donor metrics for blood donation eligibility and respond in a clear JSON format.
    Donor Metrics:
    - Age: {age} years old
    - Weight: {weight} kg
    - Last Donation Date: {lastDonationDate}
    - Chronic Conditions: {chronicConditions}
    - Medications: {medications}
    ```
*   **Local Fallback Engine**: If the API key is not configured, or the server detects connection timeouts, the system runs local heuristics:
    *   Rejects candidates if age is $<18$ or $>65$.
    *   Rejects candidates if body weight is $<50\text{ kg}$.
    *   Rejects candidates if the last donation is within $90\text{ days}$.
    *   Rejects candidates if chronic conditions match `/hiv|hepatitis|cancer|diabetes|kidney/i`.
    *   Rejects candidates if medications match `/blood thinner|antibiotic|immunosuppressant/i`.

### 2. Conversational Compatibility Assistant
*   **System Instructions**: Configures Gemini to behave as an expert AI Blood Donation Companion. It limits responses to blood types, donation intervals, and medical safe-donation guidelines. Unrelated queries are politely redirected.
*   **Local Fallback Chat Heuristics**: Evaluates queries against predefined keyword matchers to answer specific compatibility pairs (e.g., `"Can O- donate to AB+?"`), single type queries, proximity explanations, and campaign workflows.

---

## 🖥️ Frontend Portals & Dashboards

The client app is a responsive dashboard structured around user roles:

### 1. Emergency Recipient Dashboard
*   **Campaign Registry**: Creates new requests with location tracking. Displays patient names, hospital locations, and real-time statuses.
*   **Proximity Search Widget**: Allows recipients to dynamically search for compatible donors by blood type and radius slider ($5\text{ to }50\text{ km}$).
*   **Leaflet.js Map Canvas**: Displays hospital coordinates, compatible donor pins, and renders dynamic routing coordinates.
*   **Matches Log**: Lists matched donors, their phone numbers, and response states (Pending, Accepted, Rejected).

### 2. Blood Donor Dashboard
*   **Emergency Alerts**: Displays critical request notifications in the donor's region.
*   **Action Controls**: Allows donors to accept or reject alerts. Accepting an alert automatically sets the request to 'Fulfilled' and updates the donor's `lastDonationDate` to today's timestamp.
*   **Map Route Tracker**: Renders Leaflet mapping routes from the donor's location coordinates directly to the hospital target.
*   **AI Diagnosis Status**: Displays diagnostic auditing logs and cooldown warnings.

### 3. Administrator Dashboard
*   **Metrics Grid**: Displays total registered users, active donors, recipient base, pending audits, active campaigns, fulfilled matches, and rejected donor accounts.
*   **Analytics Charts**: Integrates `recharts` to render a **Monthly Campaigns vs. Matches Trend** (Line Chart) and a **Blood Group Proportions Distribution** (Bar Chart).
*   **Audits Panel**: Allows administrators to approve, reject, or suspend pending donor accounts with custom remarks.
*   **User Management**: Enables viewing all registered profiles and deleting users to comply with data policies.
*   **Inventory Panel**: Allows updating available blood bags in storage and setting low-stock thresholds.
*   **Compliance Reports**: Exports system metrics and logs to CSV reports.

---

## 🔌 API Endpoint Directory

All routes (except Auth registration/login) require authentication via JWT Bearer tokens passed in request headers: `Authorization: Bearer <token>`.

### 1. Authentication Router ([authRoutes.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/routes/authRoutes.ts))
*   `POST /api/auth/register` — Registers new recipient, donor, or admin.
*   `POST /api/auth/login` — Verifies credentials and yields access tokens.
*   `GET /api/auth/me` — Fetches profile parameters.

### 2. Donor Router ([donorRoutes.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/routes/donorRoutes.ts))
*   `GET /api/donors/search` — Search eligible compatible donors (Query parameters: `bloodGroup`, `latitude`, `longitude`, `radiusKm`).
*   `PUT /api/donors/profile` — Update phone, coordinates, city, gender, and donation logs.
*   `PATCH /api/donors/availability` — Toggle availability state.

### 3. Emergency Requests Router ([requestRoutes.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/routes/requestRoutes.ts))
*   `POST /api/requests` — Creates a request and dispatches alerts.
*   `GET /api/requests/my` — Retrieves campaigns created by the current user.
*   `GET /api/requests/all` — Retrieves all requests.
*   `GET /api/requests/alerts` — Retrieves alerts sent to the current donor.
*   `GET /api/requests/:id` — Fetches request details and donor notifications.
*   `PATCH /api/requests/alerts/:alertId` — Updates alert response status (`Accepted`/`Rejected`).

### 4. Admin Router ([adminRoutes.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/routes/adminRoutes.ts))
*   `GET /api/admin/stats` — Statistics dashboard metrics and charts trend arrays.
*   `PATCH /api/admin/verify/:donorId` — Sets donor verification status.
*   `GET /api/admin/users` — Fetches all user details.
*   `DELETE /api/admin/users/:id` — Deletes a user account.
*   `PATCH /api/admin/requests/:requestId` — Admin controls for request status updates.
*   `GET /api/admin/inventory` — Retrieves current blood inventory levels.
*   `POST /api/admin/inventory` — Adjusts blood group units.
*   `GET /api/admin/audit-logs` — Administrative audit trail logs.
*   `GET /api/admin/donations` — Completed donation records.
*   `POST /api/admin/donations` — Manually logs a donation.
*   `POST /api/admin/broadcast` — Sends custom system notification alerts.

### 5. AI Router ([aiRoutes.ts](file:///c:/Users/Chandan%2520Kumar/Desktop/blood%2520bank/backend/src/routes/aiRoutes.ts))
*   `POST /api/ai/eligibility` — Runs the Gemini AI donor health diagnostic engine.
*   `POST /api/ai/chat` — Conversational assistant handling blood compatibility queries.

---

## 🚀 Execution & Setup Guide

### 1. Configuration of Environment Variables
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blood_bank
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no `GEMINI_API_KEY` is provided, the application will fallback to the local heuristics engines.*

### 2. Seed Mock Database Records
To populate the database with mock accounts, coordinates around Bangalore, and blood stock inventories, run the following command in the workspace root:
```bash
npm run seed
```

### 3. Run Development Servers
Start both services in development mode:
```bash
# In one terminal: Start Express server (Port 5000)
npm run dev:backend

# In another terminal: Start Vite server (Port 5173)
npm run dev:frontend
```

### 4. Seed Test Account Credentials
Use these pre-seeded profiles to test the user roles and dashboards:
*   **Recipient Profile**: `karan@gmail.com` / `password123`
*   **Admin Profile**: `admin@gmail.com` / `adminpassword`
*   **Available Donor (O+, 1.1 km range)**: `rahul@gmail.com` / `password123`
*   **Resting Donor (AB+, 20 days cooldown)**: `priya@gmail.com` / `password123`
*   **Unavailable Donor (A+, available set to false)**: `neha@gmail.com` / `password123`
