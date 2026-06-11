# QuickCut - API Documentation

The QuickCut backend exposes a REST API for authentication, URL management, and analytics lookup.

## Base URL
* Local development: `http://localhost:5000`
* Production: `https://your-backend-render-url.onrender.com`

---

## Authentication Endpoints

### 1. Register User
Register a new user account.
* **Route:** `POST /api/auth/register`
* **Access:** Public
* **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-06-11T14:00:00.000Z"
  }
}
```

### 2. Login User
Authenticate an existing user.
* **Route:** `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-06-11T14:00:00.000Z"
  }
}
```

---

## URL Management Endpoints
*All requests require a `Authorization: Bearer <JWT_TOKEN>` header.*

### 1. Create Short URL
* **Route:** `POST /api/urls`
* **Access:** Private
* **Request Body:**
```json
{
  "original_url": "https://google.com/search?q=very-long-url-parameters",
  "custom_alias": "googlesearch", // Optional
  "expiry_date": "2026-12-31" // Optional (YYYY-MM-DD)
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "original_url": "https://google.com/search?q=very-long-url-parameters",
    "short_code": "googlesearch",
    "custom_alias": "googlesearch",
    "click_count": 0,
    "qr_code": "data:image/png;base64,iVBORw0KG...",
    "expiry_date": "2026-12-31T00:00:00.000Z",
    "created_at": "2026-06-11T14:05:00.000Z"
  }
}
```

### 2. Get User URLs
Fetch all URLs created by the logged-in user.
* **Route:** `GET /api/urls`
* **Access:** Private
* **Success Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "original_url": "https://google.com/search?q=very-long-url-parameters",
      "short_code": "googlesearch",
      "custom_alias": "googlesearch",
      "click_count": 5,
      "qr_code": "data:image/png;base64,iVBORw0KG...",
      "expiry_date": "2026-12-31T00:00:00.000Z",
      "created_at": "2026-06-11T14:05:00.000Z"
    }
  ]
}
```

### 3. Update Destination URL / Expiry
Modify destination link or expiry date.
* **Route:** `PUT /api/urls/:id`
* **Access:** Private
* **Request Body:**
```json
{
  "original_url": "https://newdestination.com",
  "expiry_date": "2027-01-01"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "original_url": "https://newdestination.com",
    "short_code": "googlesearch",
    "custom_alias": "googlesearch",
    "click_count": 5,
    "qr_code": "data:image/png;base64...",
    "expiry_date": "2027-01-01T00:00:00.000Z",
    "created_at": "2026-06-11T14:05:00.000Z"
  }
}
```

### 4. Delete URL
* **Route:** `DELETE /api/urls/:id`
* **Access:** Private
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

---

## Redirect & Analytics Endpoints

### 1. Redirect Short URL
Redirects a short code to its original URL. Captures visit IP, browser, and device.
* **Route:** `GET /r/:shortCode`
* **Access:** Public (Redirects with 302 Status Code to original URL)
* **Response (on failure/expiry):** HTML page with 404 / 410 error code.

### 2. Get URL Analytics
Get click trends, browser/device breakdown, and recent visits.
* **Route:** `GET /api/analytics/:shortCode`
* **Access:** Public
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "url": {
      "id": 1,
      "original_url": "https://newdestination.com",
      "short_code": "googlesearch",
      "custom_alias": "googlesearch",
      "click_count": 5,
      "qr_code": "data:image/png;base64...",
      "expiry_date": "2027-01-01T00:00:00.000Z",
      "created_at": "2026-06-11T14:05:00.000Z"
    },
    "trends": [
      {
        "visit_date": "2026-06-11T00:00:00.000Z",
        "clicks": "5"
      }
    ],
    "devices": [
      {
        "device": "Mobile",
        "count": "3"
      },
      {
        "device": "Desktop",
        "count": "2"
      }
    ],
    "browsers": [
      {
        "browser": "Chrome",
        "count": "4"
      },
      {
        "browser": "Safari",
        "count": "1"
      }
    ],
    "recentVisits": [
      {
        "visited_at": "2026-06-11T14:10:00.000Z",
        "ip_address": "127.0.0.1",
        "device": "Mobile",
        "browser": "Chrome"
      }
    ]
  }
}
```
