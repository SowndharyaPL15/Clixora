# Deployment Guide

Follow these steps to deploy QuickCut to production.

---

## 1. Database Setup (Neon PostgreSQL)

1. Sign up/Login to [Neon Console](https://neon.tech/).
2. Click **Create Project**, name it `quickcut`, and select the preferred region.
3. In the Neon Dashboard, copy the connection string from the **Connection Details** section. It will look like:
   `postgresql://alex:password@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Connect to your database using a client (like pgAdmin or DBeaver) or paste the SQL in the Neon **SQL Editor** tab.
5. Copy and execute the contents of the `schema.sql` file located in the `backend/` directory to construct the database schema.

---

## 2. Backend Deployment (Render)

1. Sign up/Login to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub/GitLab repository.
4. Set the following details:
   * **Name:** `quickcut-backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install` (inside the `backend` subdirectory, or set the **Root Directory** setting to `backend` and use `npm install`)
   * **Start Command:** `npm start`
5. Go to the **Environment** tab and click **Add Environment Variable**. Add the following:
   * `PORT`: `5000`
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: *(Your Neon connection string)*
   * `JWT_SECRET`: *(A long secure random string)*
   * `JWT_EXPIRES_IN`: `7d`
   * `FRONTEND_URL`: *(Your Vercel URL, e.g. `https://quickcut.vercel.app`)*
   * `BACKEND_URL`: *(Your Render service URL, e.g. `https://quickcut-backend.onrender.com`)*
6. Click **Deploy Web Service**.

---

## 3. Frontend Deployment (Vercel)

1. Sign up/Login to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Set the following details:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Expand the **Environment Variables** section and add the following:
   * `VITE_API_URL`: *(Your Render Backend API URL, e.g. `https://quickcut-backend.onrender.com/api`)*
   * `VITE_BACKEND_URL`: *(Your Render Backend Root URL, e.g. `https://quickcut-backend.onrender.com`)*
6. Click **Deploy**.
7. Once deployed, note down your production Vercel URL and make sure it is updated in your Render backend `FRONTEND_URL` variable.
