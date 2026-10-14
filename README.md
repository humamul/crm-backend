# 🚀 CRM Backend REST API (Enterprise Node.js Architecture)

Production-ready Backend REST API for a **Customer Relationship Management (CRM) System** designed with strict layered architecture:

$$\text{Controller} \longrightarrow \text{RequestDTO / ResponseDTO} \longrightarrow \text{Facade (Assembler Layer)} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{MySQL DB}$$

---

## 📋 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Business Logic & Acceptance Criteria](#-business-logic--acceptance-criteria)
3. [Database Schema](#-database-schema)
4. [Prerequisites & Configuration](#-prerequisites--configuration)
5. [Getting Started](#-getting-started)
6. [API Endpoints Reference & Examples](#-api-endpoints-reference--examples)
7. [Automated Test Suite](#-automated-test-suite)
8. [Folder Structure](#-folder-structure)

---

## 🏛 Architecture Overview

This project adheres strictly to **Domain-Driven Design (DDD)** and **Enterprise Layered Architecture**:

```
Client (HTTP Request)
   │
   ▼
1. Controller Layer (`src/controllers/`)
   - Receives HTTP request, extracts headers, params, body
   - Enforces validation via RequestDTO
   - Delegates orchestration to Facade Layer
   - Returns standard ApiResponse envelope
   │
   ▼
2. DTO Layer (`src/dtos/`)
   - RequestDTO: Validates incoming payloads using Joi schemas (`register.dto.js`, `create-enquiry.dto.js`, etc.)
   - ResponseDTO: Sanitizes internal entities, strips passwords, formats outputs (`user.response.dto.js`, `enquiry.response.dto.js`)
   │
   ▼
3. Facade / Assembler Layer (`src/facades/`)
   - Coordinates multi-step business operations
   - Bridges the gap between Controllers and Services
   - Translates & assembles domain models into Response DTOs
   │
   ▼
4. Service Layer (`src/services/`)
   - Pure business logic (Lead claiming concurrency, hashing passwords via bcrypt, JWT lifecycle)
   - Completely agnostic of HTTP/Express request objects
   │
   ▼
5. Repository Layer (`src/repositories/`)
   - Database persistence via `mysql2/promise` connection pool
   - Atomic SQL queries, prepared statements (SQL-injection safe)
   │
   ▼
6. MySQL Database (`crm_db`)
```

---

## 🎯 Business Logic & Acceptance Criteria

| Requirement | Implementation Details |
|---|---|
| **Employee / Counselor Accounts** | Counselor registered/logged in with email and password. Secured with JWT Bearer tokens. |
| **Public Enquiry Form** | Open endpoint (`/api/v1/public/enquiries`) accessible without any authentication. |
| **Public Unclaimed Leads** | Logged-in counselors can view all public enquiries that have status `UNCLAIMED`. Supports search & pagination. |
| **Claiming Leads** | Counselor claims an enquiry via `POST /api/v1/enquiries/:id/claim`. Atomically updates status to `CLAIMED` and assigns `claimed_by`. |
| **Lead Isolation** | Once claimed, the enquiry **immediately disappears** from the public unclaimed pool and becomes private to that counselor. |
| **Concurrency & Conflict Handling** | If two counselors attempt to claim the same enquiry simultaneously, row-level atomic logic guarantees only the first wins; the second receives a `409 Conflict` error. |
| **Counselor's Claimed Leads** | Counselors can retrieve their own claimed private leads via `GET /api/v1/enquiries/my-claimed`. |

---

## 🗄 Database Schema

The database `crm_db` and all tables with indexes and foreign keys are **automatically created on server startup**.

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'COUNSELOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. `enquiries` Table
```sql
CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  course_interest VARCHAR(100) NOT NULL,
  status ENUM('UNCLAIMED', 'CLAIMED') NOT NULL DEFAULT 'UNCLAIMED',
  claimed_by INT NULL,
  claimed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_status (status),
  INDEX idx_enquiries_claimed_by (claimed_by),
  CONSTRAINT fk_enquiries_claimed_by FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ⚙️ Prerequisites & Configuration

- **Node.js**: v16+
- **MySQL**: 8.0+ running on `localhost:3306`

### `.env` File
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=12345
DB_NAME=crm_db

# JWT Configuration
JWT_SECRET=super_secret_crm_jwt_key_2026_secure
JWT_EXPIRES_IN=24h
```

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```
   The server will connect to MySQL, auto-create `crm_db` and tables, and listen on `http://localhost:5000`.

3. **Run the automated End-to-End acceptance tests**:
   ```bash
   npm run test:api
   ```

---

## 📡 API Endpoints Reference & Examples

### 1. Public Form Submission (No Authentication)
- **Endpoint**: `POST /api/v1/public/enquiries`
- **Description**: Prospective students/clients submit their details.

#### Request:
```bash
curl -X POST http://localhost:5000/api/v1/public/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aman Gupta",
    "email": "aman.gupta@example.com",
    "phone": "+919876543210",
    "courseInterest": "Full Stack Web Development"
  }'
```

#### Response (201 Created):
```json
{
  "success": true,
  "message": "Enquiry submitted successfully",
  "data": {
    "id": 1,
    "name": "Aman Gupta",
    "email": "aman.gupta@example.com",
    "phone": "+919876543210",
    "courseInterest": "Full Stack Web Development",
    "status": "UNCLAIMED",
    "claimedBy": null,
    "claimedAt": null,
    "createdAt": "2026-10-14T09:12:00.000Z",
    "updatedAt": "2026-10-14T09:12:00.000Z"
  },
  "timestamp": "2026-10-14T09:12:00.000Z"
}
```

---

### 2. Employee Registration
- **Endpoint**: `POST /api/v1/auth/register`

#### Request:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Jenkins",
    "email": "sarah.counselor@crmcompany.com",
    "password": "Password@123"
  }'
```

#### Response (201 Created):
```json
{
  "success": true,
  "message": "Employee registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Sarah Jenkins",
      "email": "sarah.counselor@crmcompany.com",
      "role": "COUNSELOR",
      "createdAt": "2026-10-14T09:12:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "24h"
  },
  "timestamp": "2026-10-14T09:12:00.000Z"
}
```

---

### 3. Employee Login
- **Endpoint**: `POST /api/v1/auth/login`

#### Request:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.counselor@crmcompany.com",
    "password": "Password@123"
  }'
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Sarah Jenkins",
      "email": "sarah.counselor@crmcompany.com",
      "role": "COUNSELOR",
      "createdAt": "2026-10-14T09:12:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "24h"
  },
  "timestamp": "2026-10-14T09:12:00.000Z"
}
```

---

### 4. Fetch Unclaimed Public Leads (Protected)
- **Endpoint**: `GET /api/v1/enquiries/unclaimed?page=1&limit=20&search=Full`
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Unclaimed enquiries fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Aman Gupta",
      "email": "aman.gupta@example.com",
      "phone": "+919876543210",
      "courseInterest": "Full Stack Web Development",
      "status": "UNCLAIMED",
      "claimedBy": null,
      "claimedAt": null,
      "createdAt": "2026-10-14T09:12:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-10-14T09:12:05.000Z"
}
```

---

### 5. Claim a Lead (Protected)
- **Endpoint**: `POST /api/v1/enquiries/:enquiryId/claim`
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Request:
```bash
curl -X POST http://localhost:5000/api/v1/enquiries/1/claim \
  -H "Authorization: Bearer <TOKEN>"
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Enquiry claimed successfully",
  "data": {
    "id": 1,
    "name": "Aman Gupta",
    "email": "aman.gupta@example.com",
    "phone": "+919876543210",
    "courseInterest": "Full Stack Web Development",
    "status": "CLAIMED",
    "claimedBy": {
      "id": 1,
      "name": "Sarah Jenkins",
      "email": "sarah.counselor@crmcompany.com"
    },
    "claimedAt": "2026-10-14T09:12:30.000Z",
    "createdAt": "2026-10-14T09:12:00.000Z",
    "updatedAt": "2026-10-14T09:12:30.000Z"
  },
  "timestamp": "2026-10-14T09:12:30.000Z"
}
```

*Note: Once claimed, calling `GET /api/v1/enquiries/unclaimed` will no longer include this enquiry.*

---

### 6. Fetch Leads Claimed by Logged-in Counselor (Protected)
- **Endpoint**: `GET /api/v1/enquiries/my-claimed?page=1&limit=20`
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Claimed enquiries fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Aman Gupta",
      "email": "aman.gupta@example.com",
      "phone": "+919876543210",
      "courseInterest": "Full Stack Web Development",
      "status": "CLAIMED",
      "claimedBy": {
        "id": 1,
        "name": "Sarah Jenkins",
        "email": "sarah.counselor@crmcompany.com"
      },
      "claimedAt": "2026-10-14T09:12:30.000Z",
      "createdAt": "2026-10-14T09:12:00.000Z",
      "updatedAt": "2026-10-14T09:12:30.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "timestamp": "2026-10-14T09:12:40.000Z"
}
```

---

## 🧪 Automated Test Suite

An end-to-end integration test is provided in `tests/test-api.js` which verifies all 9 test scenarios:
- ✅ Service Health Check (200 OK)
- ✅ Public Enquiry Submission without token (201 Created)
- ✅ Counselor Registration with JWT issuance (201 Created)
- ✅ Counselor Login with JWT verification (200 OK)
- ✅ Fetch Unclaimed Leads: Unauthenticated rejected with 401 Unauthorized
- ✅ Claiming Enquiry: Atomic update to CLAIMED with counselor assignment
- ✅ Isolation: Claimed enquiry disappears from public unclaimed pool
- ✅ Race condition & Conflict prevention: Second counselor claiming already claimed lead receives 409 Conflict
- ✅ Private Claimed Leads: Logged-in counselor sees only their own claimed leads

Run it anytime with:
```bash
npm run test:api
```

---

## 📁 Folder Structure

```
crm-backend/
├── .env                         # Environment config (MySQL root:12345, JWT secret)
├── .env.example
├── package.json
├── server.js                    # Server startup & DB migration
├── README.md                    # Complete documentation
├── tests/
│   └── test-api.js              # Automated E2E test suite
└── src/
    ├── app.js                   # Express app configuration
    ├── config/
    │   └── database.js          # MySQL connection pool & auto-table schema
    ├── controllers/             # Controller layer (HTTP handlers)
    │   ├── auth.controller.js
    │   └── enquiry.controller.js
    ├── dtos/                    # DTO layer (Request validation & Response mapping)
    │   ├── requests/
    │   │   ├── register.dto.js
    │   │   ├── login.dto.js
    │   │   ├── create-enquiry.dto.js
    │   │   └── claim-enquiry.dto.js
    │   └── responses/
    │       ├── api.response.js
    │       ├── user.response.dto.js
    │       ├── auth.response.dto.js
    │       └── enquiry.response.dto.js
    ├── facades/                 # Facade / Assembler layer
    │   ├── auth.facade.js
    │   └── enquiry.facade.js
    ├── services/                # Business logic layer
    │   ├── auth.service.js
    │   └── enquiry.service.js
    ├── repositories/            # Data access layer (MySQL queries)
    │   ├── user.repository.js
    │   └── enquiry.repository.js
    ├── middlewares/             # Auth, error, and DTO validation middlewares
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── validate.middleware.js
    ├── routes/                  # Express routing
    │   ├── index.js
    │   ├── auth.routes.js
    │   └── enquiry.routes.js
    └── utils/
        └── errors.js            # Custom error hierarchy (400, 401, 404, 409)
```
