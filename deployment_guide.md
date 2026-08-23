# Deployment Guide

Follow these steps to deploy Clixora to production.

---

## Option A: One-Click Deploy via Render Blueprint (Recommended)

Render Blueprints allow you to deploy the frontend, backend, and PostgreSQL database simultaneously using the preconfigured [render.yaml](file:///d:/project/Clixora/render.yaml) file.

1. Sign up/Login to [Render](https://render.com/).
2. Go to the **Blueprints** tab and click **New Blueprint Instance** (or **New** -> **Blueprint**).
3. Connect your GitHub/GitLab repository.
4. Render will detect the `render.yaml` blueprint. Provide a name for the group (e.g. `clixora-group`).
5. The blueprint will configure:
   - A PostgreSQL database (`clixora-db`)
   - The backend service (`clixora-backend`)
   - The frontend static site (`clixora-frontend`)
6. Review the settings. If you want to use a free Neon PostgreSQL database instead of Render's database (which is free for 90 days), edit the `DATABASE_URL` parameter to point to your Neon database connection string.
7. Click **Deploy**. Render will automatically orchestrate and build your services in order.
8. *(Optional)* If you are using Google OAuth, once the frontend service is active, go to the `clixora-frontend` service in the Render dashboard, navigate to **Environment**, add the `VITE_GOOGLE_CLIENT_ID` environment variable, and redeploy.

---

## Option B: Manual Service Deployment

If you prefer to set up the services individually, follow the steps below.

### 1. Database Setup (Neon PostgreSQL or Render Postgres)

1. Sign up/Login to [Neon Console](https://neon.tech/) or create a Postgres DB in Render.
2. If using Neon, click **Create Project**, name it `clixora`, and select your region.
3. Copy the database connection string. It will look like:
   `postgresql://alex:password@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Connect to your database using a client (like pgAdmin or DBeaver) or paste the SQL in the Neon **SQL Editor** tab.
5. Copy and execute the contents of the `schema.sql` file located in the `backend/` directory to construct the database schema.

### 2. Backend Deployment (Render)

1. In Render, click **New** -> **Web Service**.
2. Connect your GitHub/GitLab repository.
3. Set the following details:
   * **Name:** `clixora-backend`
   * **Runtime:** `Node`
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Under the **Environment** tab, click **Add Environment Variable** and add:
   * `PORT`: `5000`
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: *(Your PostgreSQL connection string)*
   * `JWT_SECRET`: *(A long secure random string)*
   * `JWT_EXPIRES_IN`: `7d`
   * `FRONTEND_URL`: *(Your frontend URL, e.g. `https://clixora.onrender.com`)*
   * `BACKEND_URL`: *(Your Render backend service URL, e.g. `https://clixora-backend.onrender.com`)*
5. Set the **Health Check Path** to `/health`.
6. Click **Deploy Web Service**.

### 3. Frontend Deployment (Render Static Site or Vercel)

#### Deploying on Render (Static Site)
1. In Render, click **New** -> **Static Site**.
2. Connect your repository.
3. Set the following details:
   * **Name:** `clixora-frontend`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm install && npm run build`
   * **Publish Directory:** `dist`
4. Add a rewrite rule for React Router SPA navigation under the **Redirects/Rewrites** tab:
   * **Source:** `/*`
   * **Destination:** `/index.html`
   * **Action:** `Rewrite`
5. In the **Environment** tab, add:
   * `VITE_BACKEND_URL`: *(Your Render backend URL, e.g. `https://clixora-backend.onrender.com`)*
6. Click **Create Static Site**.

#### Deploying on Vercel
1. Sign up/Login to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project** and import your repository.
3. Set the following details:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   * `VITE_BACKEND_URL`: *(Your Render backend URL)*
5. Click **Deploy**.

