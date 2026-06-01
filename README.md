# 🩸 LifeFlow AI — AI-Powered Emergency Blood Donor Finder & Alert System

**LifeFlow AI** is a full-stack emergency matchmaking platform designed to connect patients with nearby compatible blood donors in real-time. Instead of acting as a static database, the system calculates proximity rankings, validates donor health metrics with Gemini AI, and dispatches targeted alerts instantly.

---

## 🚀 Key Features

*   **Proximity-Based Ranking**: Matches and ranks donors dynamically based on geographic distance, compatibility, and safety cooldowns.
*   **Interactive Proximity Maps**: Integrates Leaflet.js maps displaying location markers and routing lines between patients and selected donors.
*   **AI Eligibility Diagnostics**: Powered by Gemini API to evaluate donor metrics (weight, age, medications) for safe-donation approval.
*   **AI Compatibility Companion**: Conversational bot answering blood groups and safety queries.
*   **Role-Based Dashboards**: Customized workflows for donors, recipients, and admins.

---

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, Leaflet.js
*   **Backend**: Node.js, Express, TypeScript, Mongoose/MongoDB
*   **AI Integration**: Google Generative AI (Gemini API)

---

## 🏃 Run the Application

### 1. Configure Environmental Variables
Rename `backend/.env.example` or create a `.env` in the `backend/` folder:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blood_bank
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no Gemini API key is supplied, the system automatically uses robust built-in local heuristic rule engines.*

### 2. Seed Mock Database Records
To populate donor coordinates and recipient campaigns in Bangalore for map testing, run:
```bash
npm run seed
```

### 3. Run Development Servers
Start both backend (port 5000) and frontend (port 5173) services:
```bash
# Start backend
npm run dev:backend

# Start frontend
npm run dev:frontend
```
