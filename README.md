# 🩸 LifeFlow AI — Real-Time Emergency Blood Matchmaker

**LifeFlow AI** is an intelligent, full-stack emergency matchmaking platform that connects patients with nearby compatible blood donors in real-time. By utilizing geographical coordinate indexing, proximity ranking algorithms, and Gemini AI health auditing, the system eliminates static database delays, matching patients with active, eligible donors and dispatching alerts within seconds.

---

## 📄 Documentation Reference

For in-depth architectural overviews, database designs, API specifications, and math details, see:
*   👉 **[Detailed Architecture & API Manual](DOCUMENTATION.md)**

---

## 🚀 Core Capabilities

*   **📍 Proximity-Based Matching**: Computes coordinate distances using the **Haversine formula** and ranks compatible donors with a weighted scoring matrix (Availability, Proximity, and Cooldown interval checks).
*   **🗺️ Interactive Geolocation Maps**: Integrates Leaflet.js mapping layers, displaying hospital locations, donor coordinates, and route lines in real-time.
*   **🤖 AI Eligibility Auditing**: Powered by Gemini API (`gemini-1.5-flash`) to diagnose age, weight, and medication constraints, backed by a robust **local rules-based fallback engine**.
*   **💬 AI Compatibility Companion**: Conversational chat bot handling blood group pairings, safety cooldowns, and general guidelines.
*   **📊 Administrative Command Center**: Built-in analytics dashboard rendering volume trends and blood group proportions with `recharts`, donor profiling verifications, inventory adjustments, and CSV reporting.

---

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet.js, Recharts
*   **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose ODM
*   **AI Models**: Google Generative AI (Gemini API SDK)

---

## 🏃 Run the Application

### 1. Configure Environment Variables
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blood_bank
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no Gemini API Key is supplied, the backend automatically uses robust built-in local heuristic rule engines.*

### 2. Seed Mock Database Records
To clear historical databases and generate mock accounts (admin, recipients, available and resting donors in Bangalore), run:
```bash
npm run seed
```

### 3. Start Development Servers
```bash
# Start backend (Port 5000)
npm run dev:backend

# Start frontend client (Port 5173 / Vite default)
npm run dev:frontend
```

---

## 🔐 Testing Credentials

Once the seed script finishes, log in with these profiles:
*   **Recipient Workspace**: `karan@gmail.com` / `password123`
*   **Admin Dashboard**: `admin@gmail.com` / `adminpassword`
*   **Available Donor (O+, 1.1 km range)**: `rahul@gmail.com` / `password123`
*   **Resting Donor (AB+, 20 days cooldown)**: `priya@gmail.com` / `password123`
*   **Unavailable Donor (A+, available toggled off)**: `neha@gmail.com` / `password123`
