# BlogSphere — Smart Community Blog Platform

Welcome to **BlogSphere**, a modern full-stack blogging platform with real-time collaboration, AI content enrichment, curated reading lists, community hubs, gamified author leaderboards, and automated background publishing.

---

## 📖 Complete Documentation

For full details on system architecture, user roles, end-to-end interaction workflows, database models, WebSockets, AI features, and troubleshooting, please read our master guide:

👉 **[SYSTEM_OVERVIEW_AND_USER_GUIDE.md](file:///c:/Users/Dell/Desktop/Blog/SYSTEM_OVERVIEW_AND_USER_GUIDE.md)**

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend REST API & WebSockets**: `http://localhost:5000`

### 4. Default Admin Login
- **Email:** `admin@admin.com`
- **Password:** `admin123`

---

## 🛠️ Tech Stack Overview

- **Frontend:** React 19, Redux Toolkit, Tailwind CSS, Vite, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express (TypeScript), Socket.io WebSockets, JWT Authentication
- **Database:** MongoDB (Mongoose ORM)
- **AI Subsystem:** Google Gemini 3.5 Flash API with circular key rotation
- **Deployment:** Docker & Docker-Compose ready
