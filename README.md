# QuickCut ✂️

A production-quality full-stack **URL Shortener** application with comprehensive **Real-Time Link Analytics**. QuickCut features user authentication, custom aliases, automatic QR code generation, link expiry, bulk URL shortening via CSV files, and detailed tracking of device, browser, and click history.

---

## 🏗️ Architecture & Diagram

```mermaid
graph TD
    Client[React Frontend - Vite + Tailwind] -->|REST API| API[Express.js Backend]
    API -->|Query/Insert| DB[(PostgreSQL Database)]
    API -->|JWT Validate| Auth[Auth Middleware]
    API -->|Log visits| Visits[Visits Table]
```

### Folder Structure
```text
/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # MVC Controller classes
│   │   ├── middlewares/     # Auth, validation, error, and rate limiter middlewares
│   │   ├── routes/          # Express route bindings
│   │   └── app.js           # App initialization
│   ├── package.json
│   ├── schema.sql           # Database tables definition
│   └── server.js            # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, PrivateRoute, PublicRoute
│   │   ├── context/         # AuthContext session provider
│   │   ├── pages/           # Login, Register, Dashboard, Analytics
│   │   ├── services/        # Axios API configurations
│   │   ├── App.jsx          # App routing definitions
│   │   ├── index.css        # Global CSS stylesheet (Tailwind)
│   │   └── main.jsx         # App mounting point
│   ├── tailwind.config.js
│   └── vite.config.js
├── README.md
├── api_documentation.md     # Full REST API Reference
└── deployment_guide.md      # Production deployment guidelines
```

---

## ⚡ Tech Stack

* **Frontend:** React (Vite), React Router, Axios, Tailwind CSS, Lucide Icons, Recharts
* **Backend:** Node.js, Express.js, JWT, bcryptjs, express-rate-limit, express-useragent, qrcode
* **Database:** PostgreSQL (Neon)

---

## 🚀 Key Features

* **Secure Authentication:** User registration and login utilizing JWT tokens and password hashing via `bcrypt`.
* **Dynamic URL Shortener:** Generate random unique short codes or request custom aliases. Checks for existing aliases and duplicate values before generation.
* **Bulk URL Shortening:** Upload CSV files to create multiple shortened URLs simultaneously (includes error identification for failed custom aliases).
* **Server-Side Redirects:** Instantly redirects shortened paths (`/r/:shortCode`) to destination URLs.
* **Granular Analytics:** Tracks daily visit frequencies, IP logging, device distributions, and browser distributions.
* **QR Codes:** Base64 QR code generator attached to each shortened link.
* **Link Expiration:** Supports optional link expiry dates that deactivate links automatically once the expiry window is crossed.
* **Public Stats Page:** Unique URL metrics dashboard sharable with anybody without logging in.

---

## 📝 Assumptions Made

1. **User Scope:** Each user can only view, edit, copy, and delete their own URLs, ensuring complete privacy. Redirection and sharing stats pages are public.
2. **Browser/Device Parsing:** Computed on redirect access via the Express server using the `express-useragent` parser from the request header.
3. **Database Availability:** Standard PostgreSQL environment. Connections fallback to local instances in development and configure SSL automatically in production.

---

## 🤖 AI Planning Process
We followed a clean, state-of-the-art AI-assisted application building workflow:
1. **Goal Alignment**: Designed a lightweight, modular schema.sql prioritizing indexes for lookup speed on redirections.
2. **Backend Scaffolding**: Structured the controllers and routes separately to enforce separation of concerns.
3. **Frontend Implementation**: Leveraged React Context for auth states, protected private pages, and implemented custom glassmorphism components with Recharts visualizations.
4. **Bulk Integration**: Enabled client-side CSV text parsing to keep requests light, sending structural payloads directly to the database in bulk.

---

## 🎥 Explanatory Video
Please find the demo and walkthrough video here:
* **Demo Video Link:** [Loom / YouTube Demo Video](https://youtube.com) *(Insert your recorded Loom/YouTube URL here)*

---

## 📊 Sample Output & DB Entries

### Sample Database Rows
#### `users` Table
| id | name | email | password_hash | created_at |
|----|------|-------|---------------|------------|
| 1 | Jane Doe | jane@example.com | \$2a\$10\$XptH... | 2026-06-11 19:30:00 |

#### `urls` Table
| id | user_id | original_url | short_code | custom_alias | click_count | qr_code | expiry_date |
|----|---------|--------------|------------|--------------|-------------|---------|-------------|
| 1 | 1 | https://google.com | googlesearch | googlesearch | 12 | data:image/png;base64... | 2026-12-31 |

#### `visits` Table
| id | url_id | visited_at | ip_address | device | browser |
|----|--------|------------|------------|--------|---------|
| 1 | 1 | 2026-06-11 19:35:00 | 127.0.0.1 | Mobile | Chrome |

---

## 🛠️ Local Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed locally.
* [PostgreSQL](https://www.postgresql.org/) database running.

### 1. Database Initialization
Execute the SQL statements inside `backend/schema.sql` on your PostgreSQL database instance to create the tables and indexes.

### 2. Backend Configuration
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and set your credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/url_shortener
   JWT_SECRET=your_jwt_secret_token
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Navigate to the `frontend/` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_BACKEND_URL=http://localhost:5000
   ```
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---
This project is a part of a hackathon run by https://katomaran.com
