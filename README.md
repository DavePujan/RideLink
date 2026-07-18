# 🚗 RideSathi

**RideSathi** is a modern, fully featured, and highly polished full-stack carpooling and ride-sharing platform. It allows users to offer rides, claim seating, chat in ride-specific groups, view real-time notifications, rate other passengers/drivers, and manage their carpool schedule seamlessly.

This application is built as a robust, production-ready full-stack application using **React (with Vite)**, **Express**, **Drizzle ORM**, **PostgreSQL**, and **Firebase Authentication**.

---

## 🚀 Vercel Deployment Guide

Deploying this full-stack Express + React/Vite app on Vercel is extremely straightforward. Since we have configured the app with a custom `vercel.json` and a serverless entry point at `/api/index.ts`, Vercel will automatically split your deployment into:
1. **Frontend**: Static React assets served from Vercel's global Edge CDN for lightning-fast speeds.
2. **Backend Serverless Function**: Express API endpoints executed instantly on-demand.

### Step 1: Push Code to GitHub
Ensure all your project files are pushed to a public or private GitHub repository.

### Step 2: Import Project to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Connect your GitHub account and import your `RideSathi` repository.

### Step 3: Configure Build Settings
Vercel will auto-detect **Vite** as the framework. Keep the default settings:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` (or `vite build`)
- **Output Directory**: `dist`

### Step 4: Configure Environment Variables
You must add the following environment variables in your Vercel Project Settings (under the **Environment Variables** tab) before deploying:

#### 1. Relational Database (PostgreSQL)
Ensure you have a PostgreSQL database instance active (e.g., Supabase, Neon, or Vercel Postgres).
- `SQL_HOST` — PostgreSQL database host address
- `SQL_USER` — PostgreSQL database username
- `SQL_PASSWORD` — PostgreSQL database password
- `SQL_DB_NAME` — PostgreSQL database name

#### 2. Firebase Configuration (Client-side & Admin)
These values are used to authenticate users via Firebase. You can find these in your Firebase Project Console.
- `VITE_FIREBASE_PROJECT_ID` — Firebase Project ID
- `VITE_FIREBASE_APP_ID` — Firebase Web App ID
- `VITE_FIREBASE_API_KEY` — Firebase Web API Key
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase Auth domain
- `VITE_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase cloud messaging sender ID
- `FIREBASE_PROJECT_ID` — Firebase project ID for server-side verification (defaults to `VITE_FIREBASE_PROJECT_ID`)

#### 3. AI Capabilities & App Host
- `GEMINI_API_KEY` — Google Gemini API key (for smart matching, review parsing, and AI features)
- `APP_URL` — Your deployed Vercel application URL (e.g., `https://your-app.vercel.app`)

### Step 5: Click Deploy!
Click the **Deploy** button. Vercel will build your static assets, provision the serverless Express endpoints, and launch your live application with SSL configured automatically.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Framer Motion for premium micro-animations.
- **Backend API**: Express server, serving serverless endpoints.
- **Database Layer**: PostgreSQL database powered by Drizzle ORM (type-safe queries, connection pool retries, automatic scale-to-zero cold-start handling).
- **Authentication**: Firebase Auth (with Google Sign-In) synced dynamically to PostgreSQL user records on sign-in.
- **Vite Integration**: Middleware-based asset serving during local development, decoupled CDN hosting in production.

---

## ⚙️ Local Development Setup

To run this application locally, follow these simple steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY="your-gemini-key"
APP_URL="http://localhost:3000"

# PostgreSQL Connection Credentials
SQL_HOST="localhost"
SQL_USER="postgres"
SQL_PASSWORD="password"
SQL_DB_NAME="ridesathi"
```

*Note: Your client-side Firebase credentials will fall back to default development keys automatically, but you can override them in `.env` or in your environment settings using `VITE_FIREBASE_*` variables.*

### 3. Start Development Server
```bash
npm run dev
```
The server will boot and run on [http://localhost:3000](http://localhost:3000) with full Hot Module Replacement (HMR) and dynamic API proxying enabled.

### 4. Build & Start in Production Mode Locally
To test the compiled production bundles:
```bash
npm run build
```

---

## ✨ Features Highlight

- **Saved Frequent Routes (New)**: Save your common pickup and destination routes on the Account Management page, and toggle them on the Search Rides page to instantly pre-fill and trigger searches in one click.
- **Interactive Routing Map (New)**: Displays pickup and drop-off coordinates visually using an interactive Leaflet map component inside the Ride Details page, featuring customized colored location markers and route lines.
- **Interactive Search & Filter**: Find rides based on departure, destination, date, or price (fully localized to Indian Rupees - ₹).
- **Seamless Seating Claims**: Request seat reservations, and monitor pending approvals or active bookings.
- **Driver Management Panels**: Create carpools, set custom per-seat fares, and accept or decline incoming passenger requests.
- **Real-Time Passenger Log**: Tracks confirmed, pending, and rejected carpoolers.
- **Ride Group Chat**: Private message board for active carpool participants to coordinate pickup details.
- **System-Wide Notifications**: Keeps users informed about booking statuses, review updates, and ride changes.
- **Administrator Console**: Dedicated portal for monitoring platform statistics, active rides, user lists, and promoting admins.
