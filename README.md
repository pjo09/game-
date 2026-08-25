# HIDEOUT - 3D Real-Time Multiplayer Hide & Seek

HIDEOUT is an action-packed 3D real-time multiplayer Hide & Seek game built with Vite, React, Three.js, Tailwind CSS, Node.js, Express, Socket.IO, and Supabase.

![HIDEOUT Game](https://img.shields.io/badge/HIDEOUT-Multiplayer%203D-indigo?style=for-the-badge)

## 🎮 Game Features
- **2 to 7 Players Per Room**: Play with friends using simple 5-character room codes.
- **Dynamic Role Swapping**: One player starts as Seeker (with glowing red visual indicator); catching a Hider instantly swaps roles.
- **4 Custom 3D Maps**:
  - 🏫 **Abandoned School**: Classrooms, dark hallways, and desks to hide under.
  - 🏢 **Apartment Complex**: Multi-room residential layout with balconies and furniture.
  - 📦 **Warehouse**: Crates, high storage racks, forklift paths.
  - 🌳 **Campus**: Open field with trees, fountains, and gazebos.
- **Proximity Catching**: Seekers catch Hiders by moving within tag distance or clicking on them.
- **Mobile Responsive**: Virtual touch joysticks & action buttons for full mobile support.
- **Synthesized Web Audio SFX**: Dynamic footsteps, catch alerts, sirens, and match sound effects without external downloads.
- **Supabase Leaderboards**: Player stats (catches, win rates, time survived) synced to Postgres DB.

## 🚀 Quick Setup Instructions

### 1. Server Configuration
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend Setup (`client/`)
```bash
cd client
npm install
cp .env.example .env
npm run dev
```
