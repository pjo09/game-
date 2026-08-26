# HIDEOUT - 3D Real-Time Multiplayer Hide & Seek

HIDEOUT is an action-packed 3D real-time multiplayer Hide & Seek game built with Vite, React 18, Three.js, Tailwind CSS, Node.js, Express, Socket.IO, and Supabase.

![HIDEOUT Game](https://img.shields.io/badge/HIDEOUT-Multiplayer%203D-indigo?style=for-the-badge)

---

## 🎮 Game Features
- **2 to 7 Players Per Room**: Play with friends using 5-character room codes.
- **Dynamic Role Swapping**: 1 Seeker (glowing red halo); tagging a Hider swaps roles immediately.
- **4 Custom 3D Maps**: School 🏫, Apartment 🏢, Warehouse 📦, Campus 🌳.
- **Proximity Tagging**: Server-validated tag distance (< 3.2 units).
- **Mobile Responsive**: Virtual touch joysticks & action buttons.
- **Spatial Audio**: Programmatically synthesized footsteps, sirens, catch sounds, and timer alerts.
- **Supabase Leaderboards**: Global player stats (catches, win rates, score) synced via Postgres RLS.

---

## 🛠️ Step-by-Step Production Deployment Guide

### STEP 1: Set Up Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** tab.
3. Paste the contents of `supabase/schema.sql` into the editor and click **Run**.
4. Navigate to **Project Settings -> API** to retrieve:
   - **Project URL** (`https://<project-id>.supabase.co`)
   - **Public Anon Key** (`anon` / `publishable`)
   - **Secret Service Key** (`service_role` / `secret`) ⚠️ **SECRET - RENDER BACKEND ONLY!**

---

### STEP 2: Deploy Backend to Render
1. Connect your GitHub repository (`pjo09/game-`) to [Render](https://render.com).
2. Create a new **Web Service**:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Health Check Path**: `/health`
3. Configure the following Environment Variables in Render:

| Variable | Description | Example / Value |
|---|---|---|
| `PORT` | Auto-assigned by Render | `10000` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Allowed Frontend URL | `https://game-frontend.vercel.app` (or temporary `*` until Vercel is deployed) |
| `SUPABASE_URL` | Supabase Project URL | `https://<your-project-id>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | **SECRET** Service Role Key | `sb_secret_xxxxxxxx` |

4. Copy your deployed Render Backend URL (e.g. `https://hideout-server.onrender.com`).

---

### STEP 3: Deploy Frontend to Vercel
1. Import your GitHub repository (`pjo09/game-`) into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Framework Preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
4. Configure Environment Variables in Vercel:

| Variable | Description | Example / Value |
|---|---|---|
| `VITE_GAME_SERVER_URL` | Deployed Render Backend URL | `https://hideout-server.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://<your-project-id>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **PUBLIC** Anon Key | `sb_publishable_xxxxxxxx` |

> ⚠️ **CRITICAL SECURITY NOTE**: Never add `SUPABASE_SERVICE_KEY` to Vercel! Frontend code only requires public anon credentials.

---

### STEP 4: Update CORS Settings & Verify
1. Once Vercel finishes building, copy your live frontend URL (e.g., `https://game-frontend.vercel.app`).
2. Go back to **Render Dashboard -> Environment** for `hideout-server`.
3. Update `CORS_ORIGIN` to your exact Vercel frontend URL: `https://game-frontend.vercel.app`.
4. Render will automatically redeploy the backend with production CORS enforcement.

---

### STEP 5: Test Multiplayer & Production WebSockets
1. Open your live Vercel URL in two separate browser windows (or on mobile & desktop).
2. Create a room on Window 1, enter the 5-character code on Window 2.
3. Verify lobby state synchronization, match countdown, 3D controls, and proximity tagging.

---

## 💻 Local Development Setup

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with local values
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
cp .env.example .env
# Edit .env with local values
npm run dev
```
