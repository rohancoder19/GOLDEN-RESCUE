# GOLDEN RESCUE — Futuristic AI Emergency Response Platform

> **"Every Second Matters. Every Decision Saves Time."**

An enterprise-grade, intelligent emergency operations command center connecting real-time incident detection, clinical AI severity assessment (Google Gemini 2.5 Flash), GPS fleet telemetry, hospital network coordination, traffic-aware routing, and responder monitoring through one unified command interface.

---

## 🚀 Key System Features

### 1. Futuristic Command Center Dashboard
- **Real-Time Calculated Metrics:** Derived directly from stored MongoDB records:
  - Active Emergency Incidents
  - Critical Incidents Awaiting Dispatch
  - Available Ambulances (with ALS / BLS / Mobile ICU capability specs)
  - Receiving Regional Hospitals (verified ICU beds & diversion status)
  - Empirical Average Dispatch Time (`dispatchedAt - reportedAt`)
  - Empirical Average Arrival Time (`arrivedAt - dispatchedAt`)
- **Live Incident Queue:** Instant filtering by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), status (`REPORTED`, `DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `RESOLVED`), and real-time global search.
- **Audio HUD Feedback:** Web Audio API synthesized telemetry chirp and two-tone critical siren cues (with mute toggle).

### 2. Interactive Emergency Cartography
- **Leaflet & CartoDB Dark Matter Engine:** High-contrast tactical night mode.
- **Dynamic Glowing Markers:**
  - Severity-pulsing incident pins
  - Live GPS ambulance tracking with heading vectors and speed readouts
  - Regional hospital pins showing open ICU bed counts
  - Probabilistic accident hotspot polygons
  - Dynamic rescue route polylines with animated dash offset

### 3. Modular 7-Stage Emergency AI Response Engine
The platform implements a decoupled, testable multi-agent decision pipeline:
1. **Agent 1: Incident Detection Agent** — Telemetry normalization, source authenticity verification, payload sanitization.
2. **Agent 2: Severity Assessment Agent** — Clinical heuristic urgency scoring (1–100) paired with **Google Gemini 2.5 Flash** for physician-grade triage justification.
3. **Agent 3: Location Intelligence Agent** — Haversine spatial distance matrix calculation to all regional units and hospitals.
4. **Agent 4: Dispatch Optimization Agent** — Conflict-free fleet allocation, ranking available units by vehicle capability (ALS, Mobile ICU, Rapid Response) and ETA.
5. **Agent 5: Hospital Matching Agent** — Matches trauma ratings (Level 1–3), checks open ICU beds, and automatically bypasses diverting hospitals.
6. **Agent 6: Route Optimization Agent** — Generates turn-by-turn waypoints and computes transit times with urban traffic delay multipliers.
7. **Agent 7: Coordination Agent** — Generates transparent operational rationale (*WHY* unit X was chosen over Y), records immutable audit events, and broadcasts WebSocket alerts.

### 4. Distinctive Innovation Features
- **Voice-Based Emergency Reporting:** Live browser microphone transcription (Web Speech API) combined with Gemini AI JSON extraction.
- **Predictive Accident Hotspots:** Spatial Bayesian collision corridors modeling road curvature, speed limits, and weather coefficients with recommended unit pre-positioning.
- **What-If Simulation Sandbox:** Safe operator environment to model mass-casualty pileups and evaluate regional fleet resilience without affecting active operations.
- **Incident Replay Engine:** Interactive time scrubber to reconstruct past or simulated emergency lifecycles step by step.
- **Tamper-Evident Audit Logs:** Immutable logs tracking every operator override, dispatch confirmation, and status transition.

---

## 🛠️ Architecture & Tech Stack

- **Backend:** Node.js (v22), Express, Mongoose, Socket.IO, `@google/generative-ai` (Gemini 2.5 Flash), Node Test Runner.
- **Database:** MongoDB Atlas (Cluster `golden_guardian`).
- **Frontend:** React 19, Vite, Leaflet & React-Leaflet, Lucide Icons, Custom Futuristic Vanilla CSS Design System.
- **Real-Time Communications:** Bidirectional WebSockets (Socket.IO).

---

## 📦 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `server/.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.3qs3psd.mongodb.net/golden_guardian?retryWrites=true&w=majority&appName=Cluster0
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database
Populate the database with realistic regional hospitals, ambulances, and incidents:
```bash
npm run seed
```

### 4. Run Unit Tests
Verify severity rules, distance matrices, and conflict-free dispatch constraints:
```bash
npm test
```

### 5. Launch Development Servers
Run both backend and frontend concurrently:
```bash
# From workspace root:
npm run server  # Terminal 1: http://localhost:5000
npm run client  # Terminal 2: http://localhost:5173
```
Or build the client for production:
```bash
npm run build
```

---

## 🔒 Data Integrity & Transparency
Golden Rescue adheres to strict data integrity standards:
- **LIVE_EXTERNAL:** Verified real-world API data.
- **USER_SUBMITTED:** Incoming real dispatcher alerts.
- **STORED_DATABASE:** Stored historical records in MongoDB.
- **SIMULATED_DEMO:** Prominently tagged simulation drill mode with amber HUD indicators to prevent confusion with active real-world emergency services.
