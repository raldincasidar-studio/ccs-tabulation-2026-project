# CCS Tabulation System API Documentation

## Overview

This document defines the REST API contract for the CCS Tabulation System. It includes authentication endpoints, request/response conventions, error handling, and mock credentials for local development.

## Base URLs

- Live backend: `https://ccs-tabulation-2026-project.vercel.app/api/v1`
- Mock backend (during development): `https://ccs-tabulation-2026-project.vercel.app/api/v1-mock`

> Use the mock base URL while the backend is still under active development or while the live API is not yet fully available.

## Protocol and Content Type

- Protocol: REST over HTTP/HTTPS
- Content-Type: `application/json`
- Authentication header: `Authorization: Bearer <generatedToken>`

---

## 1. Usage & Setup Instructions

### 1.1 Prerequisites

1. MongoDB must be running locally or in a managed environment.
2. Mongoose schemas should be created with `timestamps: true` to ensure created/updated timestamps are tracked.
3. Add the following values to your backend `.env` file:
   - `JWT_SECRET`
   - `MONGODB_URI`

### 1.2 Standard Request & Response Rules

#### Authentication

Attach the following header to every authenticated request except `POST /api/v1/auth/login`:

```http
Authorization: Bearer <token>
```

#### Standard Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

#### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": []
  }
}
```

### 1.3 Default Credentials (Mock Credentials Only)

Use these seed credentials built into the mock database:

| User Type | Username | Password | Full Name |
| --- | --- | --- | --- |
| Admin | `admin` | `adminpassword123` | Admin System |
| Judge | `judge_donde` | `password123` | Nay Donde |
| Judge | `judge_lester` | `password123` | Sir Lester |
| Judge | `judge_daynver` | `password123` | Sir Daynver |
| Judge | `judge_jhunie` | `password123` | Sir Jhunie Jumawan |
| Judge | `judge_noreen` | `password123` | Ma'am Noreen Lagahit |

---

## 2. Global Error Responses

| HTTP Status | Error Code | Scenario |
| --- | --- | --- |
| 400 Bad Request | `VALIDATION_ERROR` | Missing required fields, invalid ObjectId format, or weight/points validation failures. |
| 401 Unauthorized | `UNAUTHORIZED` | Token missing, invalid, or expired. |
| 403 Forbidden | `FORBIDDEN` | Endpoint accessed by an unauthorized user role (e.g., Judge accessing Admin routes). |
| 404 Not Found | `RESOURCE_NOT_FOUND` | Target ID does not exist in the database. |
| 409 Conflict | `DUPLICATE_KEY` | Unique constraint violation (e.g., duplicate username). |
| 500 Server Error | `INTERNAL_SERVER_ERROR` | Unhandled backend or database exception. |

---

## 3. Module Specifications

### 3.1 Authentication Module (`/auth`)

#### 3.1.1 `POST /api/v1/auth/login`

Authenticates an Admin or Judge user.

##### Request Body

```json
{
  "username": "judge001",
  "password": "securepassword123"
}
```

##### Success Response: `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "65f8a123b0a9c12345678901",
      "username": "judge001",
      "userType": "Judge",
      "firstName": "Mario",
      "lastName": "Kart"
    },
    "expiresAt": "2026-09-26T03:00:00.000Z"
  }
}
```

##### Error Response: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "details": []
  }
}
```

#### 3.1.2 `POST /api/v1/auth/logout`

Invalidates an active session token.

##### Request Body

```json
{}
```

##### Success Response: `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

##### Error Response: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token missing or invalid",
    "details": []
  }
}
```

---

### 3.2 Configuration Module (`/configuration`)

#### 3.2.1 `GET /api/v1/configuration`

Fetches global event configuration, mode, quick stats, and current live status.

##### Request Body

None

##### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "65f8a123b0a9c12345678900",
    "eventTitle": "2026 Mr & Ms CCS",
    "eventDescription": "The MR and MS CCS of Acquaintance Party",
    "isConfigurationMode": true,
    "stats": {
      "totalJudges": 5,
      "totalContestants": 8
    },
    "liveStatus": {
      "categoryActive": {
        "_id": "65f8a123b0a9c12345678910",
        "name": "Playsuit"
      },
      "contestantActive": {
        "_id": "65f8a123b0a9c12345678920",
        "name": "Jopeta Mari",
        "image": "https://cdn.example.com/photos/contestant1.jpg",
        "label": "1st Year (1)",
        "group": "Pageant Male"
      }
    }
  }
}
```

##### Error Response: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to retrieve configuration settings",
    "details": []
  }
}
```

#### 3.2.2 `PUT /api/v1/configuration`

Updates global event title and description.

##### Request Body

```json
{
  "eventTitle": "2026 Mr & Ms CCS Grand Pageant",
  "eventDescription": "Annual Acquaintance Party Pageant Event"
}
```

##### Response: `200 OK`

```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678900",
    "eventTitle": "2026 Mr & Ms CCS Grand Pageant",
    "eventDescription": "Annual Acquaintance Party Pageant Event"
  }
}
```

##### Error Response: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "eventTitle is required and cannot be empty",
    "details": [
      { "field": "eventTitle", "issue": "Must be a non-empty string" }
    ]
  }
}
```

#### 3.2.3 `PATCH /api/v1/configuration/live-status`

Updates current active category and contestant for live scoring/projection.

##### Request Body

```json
{
  "categoryActive": "65f8a123b0a9c12345678910",
  "contestantActive": "65f8a123b0a9c12345678920"
}
```

##### Response: `200 OK`

```json
{
  "success": true,
  "message": "Live status updated successfully",
  "data": {
    "categoryActive": "65f8a123b0a9c12345678910",
    "contestantActive": "65f8a123b0a9c12345678920"
  }
}
```

##### Error Response: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Specified active category or contestant does not exist",
    "details": [
      { "field": "categoryActive", "issue": "Category ID not found" }
    ]
  }
}
```

---

### 3.3 Judges Management Module (`/judges`)

#### 3.3.1 `GET /api/v1/judges`

Retrieves registered judges.

##### Request Body

None

##### Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f8a123b0a9c12345678901",
      "username": "judge001",
      "firstName": "Mario",
      "lastName": "Kart",
      "userType": "Judge",
      "isActive": true
    }
  ]
}
```

##### Error Response: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Only Admins can view judges list",
    "details": []
  }
}
```

#### 3.3.2 `POST /api/v1/judges`

Creates new judge profile.

##### Request Body

```json
{
  "username": "judge001",
  "password": "password123",
  "firstName": "Mario",
  "lastName": "Kart",
  "isActive": true
}
```

##### Response: `201 Created`

```json
{
  "success": true,
  "message": "Judge created successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678901",
    "username": "judge001",
    "firstName": "Mario",
    "lastName": "Kart",
    "userType": "Judge",
    "isActive": true
  }
}
```

##### Error Response: `409 Conflict`

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_KEY",
    "message": "Username 'judge001' already exists",
    "details": []
  }
}
```

#### 3.3.3 `PUT /api/v1/judges/:id`

Updates judge account details or credentials.

##### Request Body

```json
{
  "username": "judge001_updated",
  "password": "newpassword123",
  "firstName": "Mario",
  "lastName": "Kart",
  "isActive": false
}
```

##### Response: `200 OK`

```json
{
  "success": true,
  "message": "Judge updated successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678901",
    "username": "judge001_updated",
    "firstName": "Mario",
    "lastName": "Kart",
    "userType": "Judge",
    "isActive": false
  }
}
```

##### Error Response: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Judge ID '65f8a123b0a9c12345678901' not found",
    "details": []
  }
}
```

#### 3.3.4 `DELETE /api/v1/judges/:id`

Deletes judge profile.

##### Request Body

None

##### Response: `200 OK`

```json
{
  "success": true,
  "message": "Judge deleted successfully"
}
```

##### Error Response: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Provided judge ID is not a valid ObjectId",
    "details": []
  }
}
```

---

## 4. Backend Development Notes

- The frontend and backend should both use the same response schema.
- Passwords should never be returned in API responses.
- All authenticated routes must validate JWTs before processing requests.
- Protected endpoints should check user role authorization before exposing admin-only actions.

## 5. Example Curl Commands

### Login

```bash
curl -X POST "https://ccs-tabulation-2026-project.vercel.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "judge_donde",
    "password": "password123"
  }'
```

### Logout

```bash
curl -X POST "https://ccs-tabulation-2026-project.vercel.app/api/v1/auth/logout" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Get Configuration

```bash
curl -X GET "https://ccs-tabulation-2026-project.vercel.app/api/v1/configuration" \
  -H "Authorization: Bearer <token>"
```

### Get Judges

```bash
curl -X GET "https://ccs-tabulation-2026-project.vercel.app/api/v1/judges" \
  -H "Authorization: Bearer <token>"
```

---

This specification serves as the initial contract for the CCS Tabulation System backend and can be expanded as additional modules are added.
