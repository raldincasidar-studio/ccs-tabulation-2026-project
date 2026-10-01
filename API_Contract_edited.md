> **Edited contract — Admin Dashboard Monitoring and Judge Category Reports (2026-10-02).**
> This is a duplicate of `API_Contract_v1_0.md`; the original is unchanged.
> The additions and overrides in **Sections 9 and 10** document dashboard
> monitoring, judge assignments, scoring validation, server readiness and
> single-judge, single-category, single-group paper reports.
> These changes are implemented in `frontend/` and `backend/` only.
> Local development uses the same-origin `/api/v1` path through Vite's proxy.
> Both `/api/v1` and the legacy `/api/v1-mock` prefix in `backend/` use MongoDB;
> the legacy prefix is not an independent in-memory mock service.

# Tabulation System API Specification & Technical Documentation

**Endpoint:** **(https://ccs-tabulation-2026-project.vercel.app)**

**Base URL:** `https://ccs-tabulation-2026-project.vercel.app/api/v1` **USE THIS WHEN BACKEND IS READY**

**Base MOCK URL:** `https://ccs-tabulation-2026-project.vercel.app/api/v1-mock` **USE THIS DURING DEVELOPMENT OR WHEN BACKEND IS STILL WORKING**

**Protocol:** REST over HTTP / HTTPS

**Content-Type:** `application/json`

**Authentication Header:** `Authorization: Bearer <generatedToken>`

---

## 1. Usage & Setup Instructions

### Pre-requisites & Execution

1. **Database Setup:** Ensure MongoDB is running and Mongoose schemas are compiled with `timestamps: true`.
2. **Environment Setup:** Set your JWT secret key (`JWT_SECRET`) and MongoDB URI (`MONGODB_URI`) in your backend `.env` configuration file.

### Standard Request & Response Rules

* **Authentication:** Attach `Authorization: Bearer <token>` in headers for all endpoints except `POST /api/v1/auth/login`.
* **Standard Success Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}

```


* **Standard Error Response Format:**
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


### Default Credentials (MOCK CREDENTIALS ONLY)

Use these seed credentials built into the mock database:

| User Type | Username | Password | Full Name |
| --- | --- | --- | --- |
| **Admin** | `admin` | `adminpassword123` | Admin System |
| **Judge** | `judge_donde` | `password123` | Nay Donde |
| **Judge** | `judge_lester` | `password123` | Sir Lester |
| **Judge** | `judge_daynver` | `password123` | Sir Daynver |
| **Judge** | `judge_jhunie` | `password123` | Sir Jhunie Jumawan |
| **Judge** | `judge_noreen` | `password123` | Ma'am Noreen Lagahit |

---

---

## 2. Global Error Responses

| HTTP Status | Error Code | Scenario |
| --- | --- | --- |
| **400 Bad Request** | `VALIDATION_ERROR` | Missing required fields, invalid ObjectId format, or weight/points validation failures. |
| **401 Unauthorized** | `UNAUTHORIZED` | Token missing, invalid, or expired. |
| **403 Forbidden** | `FORBIDDEN` | Endpoint accessed by an unauthorized user role (e.g., Judge accessing Admin routes). |
| **404 Not Found** | `RESOURCE_NOT_FOUND` | Target ID does not exist in the database. |
| **409 Conflict** | `DUPLICATE_KEY` | Unique constraint violation (e.g., duplicate username). |
| **500 Server Error** | `INTERNAL_SERVER_ERROR` | Unhandled backend or database exception. |

---


## 3. Module Specifications

### 1. Authentication Module (`/auth`)

#### 1.1 `POST /api/v1/auth/login`

Authenticates Admin or Judge user.

* **Request Body:**
```json
{
  "username": "judge001",
  "password": "securepassword123"
}

```


* **Response (200 OK):**
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


* **Error Example (401 Unauthorized):**
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



#### 1.2 `POST /api/v1/auth/logout`

Invalidates active session token.

* **Request Body:** `{}`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}

```


* **Error Example (401 Unauthorized):**
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

### 2. Configurations Module (`/configuration`)

#### 2.1 `GET /api/v1/configuration`

Fetches global event configuration, mode, quick stats, and current live status.

* **Request Body:** None
* **Response (200 OK):**
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


* **Error Example (500 Internal Server Error):**
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



#### 2.2 `PUT /api/v1/configuration`

Updates global event title and description.

* **Request Body:**
```json
{
  "eventTitle": "2026 Mr & Ms CCS Grand Pageant",
  "eventDescription": "Annual Acquaintance Party Pageant Event"
}

```


* **Response (200 OK):**
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


* **Error Example (400 Bad Request):**
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



#### 2.3 `PATCH /api/v1/configuration/live-status`

Updates current active category and contestant for live scoring/projection.

* **Request Body:**
```json
{
  "categoryActive": "65f8a123b0a9c12345678910",
  "contestantActive": "65f8a123b0a9c12345678920"
}

```


* **Response (200 OK):**
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


* **Error Example (404 Not Found):**
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

### 3. Judges Management Module (`/judges`)

#### 3.1 `GET /api/v1/judges`

Retrieves registered judges.

* **Request Body:** None
* **Response (200 OK):**
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


* **Error Example (403 Forbidden):**
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



#### 3.2 `POST /api/v1/judges`

Creates new judge profile.

* **Request Body:**
```json
{
  "username": "judge001",
  "password": "password123",
  "firstName": "Mario",
  "lastName": "Kart",
  "isActive": true
}

```


* **Response (201 Created):**
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


* **Error Example (409 Conflict):**
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



#### 3.3 `PUT /api/v1/judges/:id`

Updates judge account details or credentials.

* **Request Body:**
```json
{
  "username": "judge001_updated",
  "password": "newpassword123",
  "firstName": "Mario",
  "lastName": "Kart",
  "isActive": false
}

```


* **Response (200 OK):**
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


* **Error Example (404 Not Found):**
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



#### 3.4 `DELETE /api/v1/judges/:id`

Deletes judge profile.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Judge deleted successfully"
}

```


* **Error Example (400 Bad Request):**
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

### 4. Categories & Rubrics Module (`/categories`)

#### 4.1 `GET /api/v1/categories`

Lists categories and associated rubrics.

* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f8a123b0a9c12345678910",
      "name": "Playsuit",
      "description": "Evaluates physique, poise, and presentation in swimwear.",
      "weight": 10,
      "isActive": true,
      "rubrics": [
        { "_id": "65f8a123b0a9c12345678911", "name": "Fitness & Form", "maxPoints": 40 },
        { "_id": "65f8a123b0a9c12345678912", "name": "Stage Presence", "maxPoints": 40 },
        { "_id": "65f8a123b0a9c12345678913", "name": "Poise & Bearing", "maxPoints": 20 }
      ]
    }
  ]
}

```


* **Error Example (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to fetch categories list",
    "details": []
  }
}

```



#### 4.2 `POST /api/v1/categories`

Creates a category with embedded rubrics.

* **Request Body:**
```json
{
  "name": "Playsuit",
  "description": "Evaluates physique, poise, and presentation in swimwear.",
  "weight": 10,
  "isActive": true,
  "rubrics": [
    { "name": "Fitness & Form", "maxPoints": 40 },
    { "name": "Stage Presence", "maxPoints": 40 },
    { "name": "Poise & Bearing", "maxPoints": 20 }
  ]
}

```


* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678910",
    "name": "Playsuit",
    "description": "Evaluates physique, poise, and presentation in swimwear.",
    "weight": 10,
    "isActive": true,
    "rubrics": [
      { "_id": "65f8a123b0a9c12345678911", "name": "Fitness & Form", "maxPoints": 40 },
      { "_id": "65f8a123b0a9c12345678912", "name": "Stage Presence", "maxPoints": 40 },
      { "_id": "65f8a123b0a9c12345678913", "name": "Poise & Bearing", "maxPoints": 20 }
    ]
  }
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Category weight must be between 0 and 100",
    "details": [
      { "field": "weight", "issue": "Value 105 exceeds maximum limit of 100" }
    ]
  }
}

```



#### 4.3 `PUT /api/v1/categories/:id`

Updates category parameters or rubric items.

* **Request Body:**
```json
{
  "name": "Playsuit - Revised",
  "description": "Updated swimsuit criteria description.",
  "weight": 15,
  "isActive": true,
  "rubrics": [
    { "_id": "65f8a123b0a9c12345678911", "name": "Fitness & Form", "maxPoints": 50 },
    { "_id": "65f8a123b0a9c12345678912", "name": "Stage Presence", "maxPoints": 30 },
    { "name": "Overall Impression", "maxPoints": 20 }
  ]
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678910",
    "name": "Playsuit - Revised",
    "description": "Updated swimsuit criteria description.",
    "weight": 15,
    "isActive": true,
    "rubrics": [
      { "_id": "65f8a123b0a9c12345678911", "name": "Fitness & Form", "maxPoints": 50 },
      { "_id": "65f8a123b0a9c12345678912", "name": "Stage Presence", "maxPoints": 30 },
      { "_id": "65f8a123b0a9c12345678914", "name": "Overall Impression", "maxPoints": 20 }
    ]
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Category ID '65f8a123b0a9c12345678910' not found",
    "details": []
  }
}

```



#### 4.4 `DELETE /api/v1/categories/:id`

Deletes target category.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete category linked to active contestant groups",
    "details": []
  }
}

```



---

### 5. Contestant Groups Module (`/contestant-groups`)

#### 5.1 `GET /api/v1/contestant-groups`

Lists contestant groups with linked category IDs.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f8a123b0a9c12345678930",
      "name": "Pageant Male",
      "categoriesIncluded": [
        "65f8a123b0a9c12345678910"
      ]
    }
  ]
}

```


* **Error Example (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Error loading contestant groups",
    "details": []
  }
}

```



#### 5.2 `POST /api/v1/contestant-groups`

Creates a new group and maps relevant categories.

* **Request Body:**
```json
{
  "name": "Pageant Male",
  "categoriesIncluded": [
    "65f8a123b0a9c12345678910"
  ]
}

```


* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Contestant group created successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678930",
    "name": "Pageant Male",
    "categoriesIncluded": [
      "65f8a123b0a9c12345678910"
    ]
  }
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "categoriesIncluded array must contain valid Category ObjectIds",
    "details": [
      { "field": "categoriesIncluded[0]", "issue": "Invalid ObjectId provided" }
    ]
  }
}

```



#### 5.3 `PUT /api/v1/contestant-groups/:id`

Updates category associations or group name.

* **Request Body:**
```json
{
  "name": "Pageant Male Seniors",
  "categoriesIncluded": [
    "65f8a123b0a9c12345678910",
    "65f8a123b0a9c12345678915"
  ]
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Contestant group updated successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678930",
    "name": "Pageant Male Seniors",
    "categoriesIncluded": [
      "65f8a123b0a9c12345678910",
      "65f8a123b0a9c12345678915"
    ]
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Contestant group not found",
    "details": []
  }
}

```



#### 5.4 `DELETE /api/v1/contestant-groups/:id`

Deletes contestant group.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Contestant group deleted successfully"
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete group containing registered contestants",
    "details": []
  }
}

```



---

### 6. Contestants Module (`/contestants`)

#### 6.1 `GET /api/v1/contestants`

Fetches contestants, filterable by group.

* **Query Params:** `groupId=65f8a123b0a9c12345678930`
* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f8a123b0a9c12345678920",
      "name": "Jopeta Mari",
      "label": "1st Year (1)",
      "image": "https://cdn.example.com/photos/contestant1.jpg",
      "group": {
        "_id": "65f8a123b0a9c12345678930",
        "name": "Pageant Male"
      }
    }
  ]
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid groupId query parameter",
    "details": []
  }
}

```



#### 6.2 `POST /api/v1/contestants`

Registers new contestant.

* **Request Body:**
```json
{
  "name": "Jopeta Mari",
  "label": "1st Year (1)",
  "image": "https://cdn.example.com/photos/contestant1.jpg",
  "group": "65f8a123b0a9c12345678930"
}

```


* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Contestant created successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678920",
    "name": "Jopeta Mari",
    "label": "1st Year (1)",
    "image": "https://cdn.example.com/photos/contestant1.jpg",
    "group": "65f8a123b0a9c12345678930"
  }
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": [
      { "field": "name", "issue": "Contestant name is required" },
      { "field": "group", "issue": "Target contestant group is required" }
    ]
  }
}

```



#### 6.3 `PUT /api/v1/contestants/:id`

Updates contestant information.

* **Request Body:**
```json
{
  "name": "Jopeta Mari Updated",
  "label": "2nd Year (1)",
  "image": "https://cdn.example.com/photos/contestant1_updated.jpg",
  "group": "65f8a123b0a9c12345678930"
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Contestant updated successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678920",
    "name": "Jopeta Mari Updated",
    "label": "2nd Year (1)",
    "image": "https://cdn.example.com/photos/contestant1_updated.jpg",
    "group": "65f8a123b0a9c12345678930"
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Contestant ID '65f8a123b0a9c12345678920' not found",
    "details": []
  }
}

```



#### 6.4 `DELETE /api/v1/contestants/:id`

Deletes contestant entry.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Contestant deleted successfully"
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Contestant not found",
    "details": []
  }
}

```



---

### 7. Judge Scoring & Live Portal Module (`/scores`)

#### 7.1 `GET /api/v1/scores/live-sheet`

Fetches current all category, all contestant, and any previously saved scores for the requesting judge based on token.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category": [{
      "_id": "65f8a123b0a9c12345678910",
      "name": "Playsuit",
      "description": "Evaluates physique, poise, and presentation.",
      "rubrics": [
        { "_id": "65f8a123b0a9c12345678911", "name": "Fitness & Form", "maxPoints": 40 },
        { "_id": "65f8a123b0a9c12345678912", "name": "Stage Presence", "maxPoints": 40 },
        { "_id": "65f8a123b0a9c12345678913", "name": "Poise & Bearing", "maxPoints": 20 }
      ]
    }],
    "contestant": {
      "_id": "65f8a123b0a9c12345678920",
      "name": "Jopeta Mari",
      "label": "1st Year (1)",
      "group": "Pageant Male",
      "image": "https://cdn.example.com/photos/contestant1.jpg"
    },
    "existingScores": [
      { "rubricsId": "65f8a123b0a9c12345678911", "score": 38 },
      { "rubricsId": "65f8a123b0a9c12345678912", "score": 35 },
      { "rubricsId": "65f8a123b0a9c12345678913", "score": 18 }
    ]
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "No active category or active contestant set in Live Status",
    "details": []
  }
}

```



#### 7.2 `POST /api/v1/scores/submit`

Submits or updates a judge's scores for a category and contestant.

* **Request Body:**
```json
{
  "categoryId": "65f8a123b0a9c12345678910",
  "contestantId": "65f8a123b0a9c12345678920",
  "rubricsScore": [
    { "rubricsId": "65f8a123b0a9c12345678911", "score": 38 },
    { "rubricsId": "65f8a123b0a9c12345678912", "score": 35 },
    { "rubricsId": "65f8a123b0a9c12345678913", "score": 18 }
  ]
}

```


* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Scores saved successfully",
  "data": {
    "_id": "65f8a123b0a9c12345678999",
    "judgeId": "65f8a123b0a9c12345678901",
    "categoryId": "65f8a123b0a9c12345678910",
    "rubricsScore": [
      { "rubricsId": "65f8a123b0a9c12345678911", "score": 38 },
      { "rubricsId": "65f8a123b0a9c12345678912", "score": 35 },
      { "rubricsId": "65f8a123b0a9c12345678913", "score": 18 }
    ]
  }
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "SCORE_EXCEEDS_MAX",
    "message": "Score exceeds maximum points allowed for rubric 'Fitness & Form'",
    "details": [
      { "rubricsId": "65f8a123b0a9c12345678911", "givenScore": 45, "maxPoints": 40 }
    ]
  }
}

```



---

### 8. Application-Calculated Reports & Paper Endpoints (`/reports`)

**Calculation Formulas Applied:**

1. $\text{Rubrics Total Score} = \sum (\text{rubricsScore.score})$
2. $\text{Category Weighted} = \text{Rubrics Total Score} \times \left(\frac{\text{Category Weight}}{100}\right)$
3. $\text{final\_candidate\_score} = \sum (\text{Category Weighted scores across all categories})$

---

#### 8.1 `GET /api/v1/reports/voting-progress`

Calculates completion progress percentage per judge for admin tracking.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "judgeId": "65f8a123b0a9c12345678901",
      "judgeName": "Mario Kart",
      "progressPercentage": 80.0
    }
  ]
}

```


* **Error Example (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Error calculating judge progress percentages",
    "details": []
  }
}

```



#### 8.2 `GET /api/v1/reports/final-rankings`

Calculates final scores and orders rankings for display.

* **Query Params:** `groupId=65f8a123b0a9c12345678930`
* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventTitle": "2026 Mr & Ms. CCS",
    "group": "Pageant Male",
    "rankings": [
      {
        "rank": 1,
        "contestantId": "65f8a123b0a9c12345678920",
        "name": "Jopeta Mari",
        "label": "1st Year (1)",
        "categoryScores": [
          {
            "categoryName": "Playsuit",
            "rawScore": 91.0,
            "weight": 10,
            "weightedScore": 9.1
          },
          {
            "categoryName": "Evening Gown",
            "rawScore": 90.0,
            "weight": 10,
            "weightedScore": 9.0
          }
        ],
        "final_candidate_score": 95.0
      }
    ]
  }
}

```


* **Error Example (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid groupId query parameter provided",
    "details": []
  }
}

```



#### 8.3 `GET /api/v1/reports/paper/final-ranking-sheet`

Returns calculated data formatted for printing official final ranking sheets.

* **Query Params:** `groupId=65f8a123b0a9c12345678930`
* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "header": {
      "institution": "Jose Rizal Memorial State University",
      "college": "College of Computing Studies",
      "title": "Mr. & Ms. CCS 2026 Final Ranking"
    },
    "group": "Pageant Male",
    "rows": [
      {
        "rank": 1,
        "nameAndLabel": "1st Year - Jopeta Mari",
        "group": "Pageant Male",
        "final_candidate_score": 95.0
      }
    ]
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "No scores found to calculate final ranking sheet for this group",
    "details": []
  }
}

```



#### 8.4 `GET /api/v1/reports/paper/judge-scoresheet/:judgeId`

Returns computed scores for an individual judge's printable scoresheet.

* **Request Body:** None
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "header": {
      "institution": "Jose Rizal Memorial State University",
      "college": "College of Computing Studies",
      "title": "MR & MS CCS 2026 Judge 1 Scoresheet"
    },
    "judgeName": "Mario Kart",
    "contestants": [
      {
        "rank": 1,
        "nameAndLabel": "First Year - Jopeta Mari",
        "categoryBreakdown": [
          { "categoryName": "Evening Gown (10%)", "score": 85 },
          { "categoryName": "System Uni (5%)", "score": 52 },
          { "categoryName": "Production No. (10%)", "score": 82 },
          { "categoryName": "Advocacy (10%)", "score": 89 },
          { "categoryName": "QA Closed Door (15%)", "score": 90 },
          { "categoryName": "QA Finals (30%)", "score": 85 }
        ],
        "final_candidate_score": 95.0
      }
    ]
  }
}

```


* **Error Example (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Judge ID '65f8a123b0a9c12345678901' has no submitted scores",
    "details": []
  }
}

```

---
<center>Prepared by @raldincasidar-studio | document version <b>1.0</b> | Updated Sept 25, 2026 3:35pm</center>

---

## 9. Admin Dashboard — Live Scoring Monitoring (2026-10-02 update)

This section takes precedence over earlier examples for the new monitoring
endpoints and the score-submission validation changes described below. Existing
final-ranking and printable-report endpoints are not replaced by this dashboard.

### 9.1 `GET /api/v1/dashboard/scoring`

**Access:** authenticated, active **Admin** with a valid database-backed login
session. Judges receive `403 FORBIDDEN`; missing/invalid/expired sessions receive
`401 UNAUTHORIZED` when the database is available.

**Request body / query parameters:** none.

Returns one live snapshot containing every competition category, group-specific
rankings, category summaries, each assigned judge's progress, and every required
rubric field for each eligible contestant. It does not create or mutate database
records. User passwords, session tokens, and database credentials are never returned.

**Headers:** `Cache-Control: private, no-store`.

**Response (200 OK):** the example below has one judge, one contestant, and two
required sub-criteria. A saved **zero** in one field is valid; the other field is
missing. The sheet is therefore **in progress**, not completed.

```json
{
  "success": true,
  "message": "Live scoring dashboard retrieved successfully",
  "data": {
    "generatedAt": "2026-10-02T03:00:00.000Z",
    "refreshIntervalMs": 3000,
    "event": {
      "eventTitle": "2026 Mr & Ms CCS",
      "isConfigurationMode": false,
      "activeCategoryId": "65f8a123b0a9c12345678910"
    },
    "stats": {
      "totalJudges": 1,
      "totalContestants": 1,
      "totalCategories": 1,
      "completedCategories": 0,
      "requiredSheets": 1,
      "completedSheets": 0,
      "pendingEvaluations": 1,
      "scoredFields": 1,
      "requiredFields": 2,
      "progressPercentage": 50
    },
    "judges": [
      {
        "judgeId": "65f8a123b0a9c12345678901",
        "judgeName": "Judge One",
        "username": "judge001"
      }
    ],
    "categories": [
      {
        "categoryId": "65f8a123b0a9c12345678910",
        "name": "Playsuit",
        "description": "Category description",
        "weight": 10,
        "isActive": true,
        "assignedJudges": null,
        "assignmentMode": "all_active",
        "maxPoints": 100,
        "rubrics": [
          { "rubricsId": "65f8a123b0a9c12345678911", "name": "Stage Presence", "maxPoints": 40 },
          { "rubricsId": "65f8a123b0a9c12345678912", "name": "Poise & Bearing", "maxPoints": 60 }
        ],
        "resultStatus": "provisional",
        "lastUpdatedAt": "2026-10-02T02:59:55.000Z",
        "summary": {
          "totalContestants": 1,
          "totalAssignedJudges": 1,
          "requiredSheets": 1,
          "completedSheets": 0,
          "inProgressSheets": 1,
          "notStartedSheets": 0,
          "pendingEvaluations": 1,
          "scoredFields": 1,
          "requiredFields": 2,
          "progressPercentage": 50,
          "completedJudges": 0,
          "inProgressJudges": 1,
          "notStartedJudges": 0,
          "status": "in_progress"
        },
        "groups": [
          {
            "groupId": "65f8a123b0a9c12345678930",
            "name": "Pageant Male",
            "rankings": [
              {
                "contestantId": "65f8a123b0a9c12345678920",
                "name": "Candidate One",
                "label": "First Year (1)",
                "image": "",
                "rank": 1,
                "accumulatedScore": 0,
                "averageScore": 0,
                "weightedScore": 0,
                "submittedSheets": 1,
                "completedSheets": 0,
                "assignedJudges": 1,
                "scoredFields": 1,
                "requiredFields": 2,
                "progressPercentage": 50,
                "status": "in_progress",
                "lastUpdatedAt": "2026-10-02T02:59:55.000Z"
              }
            ]
          }
        ],
        "judges": [
          {
            "judgeId": "65f8a123b0a9c12345678901",
            "judgeName": "Judge One",
            "username": "judge001",
            "status": "in_progress",
            "totalContestants": 1,
            "requiredSheets": 1,
            "completedSheets": 0,
            "inProgressSheets": 1,
            "notStartedSheets": 0,
            "pendingEvaluations": 1,
            "scoredFields": 1,
            "requiredFields": 2,
            "progressPercentage": 50,
            "lastUpdatedAt": "2026-10-02T02:59:55.000Z",
            "contestants": [
              {
                "contestantId": "65f8a123b0a9c12345678920",
                "name": "Candidate One",
                "label": "First Year (1)",
                "groupId": "65f8a123b0a9c12345678930",
                "groupName": "Pageant Male",
                "status": "in_progress",
                "scoredFields": 1,
                "requiredFields": 2,
                "missingFields": 1,
                "invalidFields": 0,
                "progressPercentage": 50,
                "totalScore": 0,
                "lastUpdatedAt": "2026-10-02T02:59:55.000Z",
                "fields": [
                  { "rubricsId": "65f8a123b0a9c12345678911", "name": "Stage Presence", "maxPoints": 40, "score": 0, "status": "scored" },
                  { "rubricsId": "65f8a123b0a9c12345678912", "name": "Poise & Bearing", "maxPoints": 60, "score": null, "status": "missing" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Eligibility and assignments

- A contestant is eligible for a category only if the contestant is active and
  their group's `categoriesIncluded` contains that category's ID. Unrelated or
  deleted groups/contestants and their historical scores do not inflate progress.
- Only active users with `userType: "Judge"` can contribute to this dashboard.
  Admin accounts and inactive/deleted judges do not contribute to rankings.
- `Category.assignedJudges` is an additive nullable array of `User` ObjectIds.
  `null` or an absent field means **all active judges**, preserving existing
  category behavior without a database migration. An explicit array selects only
  its active Judge members. An explicit `[]` assigns no judges.
- Inactive assigned judges are excluded from effective assignments. The editor
  only offers active judges. Setting assignments back to `null` also includes
  active judges added later.
- Categories are all returned, including inactive categories, so administrators
  can inspect saved progress. An inactive category is not an official finalization.
- The global contestant statistic counts active registered contestants; each
  category counts only its eligible contestants. Global required/completed/pending
  sheet and field totals are the sums of category summaries.

#### Completion and progress rules

A **score sheet** is one `(judgeId, categoryId, contestantId)` tuple, not an
individual score document counted blindly as a completed evaluation.

| Status | Meaning |
| --- | --- |
| `not_started` | No saved sheet / no valid saved field yet, with no saved sheet document. |
| `in_progress` | At least one required field is scored, or an incomplete/invalid saved sheet exists. |
| `complete` | Every current required rubric has exactly one finite numeric saved score in `[0, maxPoints]`. |
| `not_required` | There are no applicable required fields (e.g. a category has no rubrics or a judge has no eligible contestants). |
| `not_configured` | Category summary has no required evaluations because rubrics, eligible contestants, or active assigned judges are missing. |

Each field has `status: "scored" | "missing" | "invalid"` and a numeric score or
`null`. Explicit numeric `0` is scored. Null/blank/missing, duplicate, non-numeric,
non-finite or out-of-range legacy values do not count as scored. Unknown/removed
rubric IDs are ignored; requirements always use the current rubric definition.

```text
requiredSheets      = eligibleContestants × effectiveAssignedJudges
requiredFields      = requiredSheets × currentRubrics
pendingEvaluations  = requiredSheets − completedSheets
progressPercentage  = scoredFields / requiredFields × 100
```

A category without rubrics has zero required sheets/fields and is `not_configured`,
not 100% complete. All zero denominators return 0% (never NaN/Infinity). A judge
is `complete` only when all of that judge's required contestant sheets in the
category are complete. Completion percentages are rounded to one decimal place.
Adding/changing rubrics, assignments or eligible contestants recalculates progress;
a previously complete judge can correctly become incomplete again.

#### Live score and provisional ranking rules

```text
savedSheetTotal  = sum of valid saved scores for current rubrics
accumulatedScore = sum of savedSheetTotal across eligible assigned judges
submittedSheets  = count of eligible sheets with at least one valid saved field
averageScore     = accumulatedScore / submittedSheets
weightedScore    = averageScore × category.weight / 100
```

- Partial valid sheets contribute to live scores but **not** to completed sheet
  counts. Missing/invalid fields never fabricate completion. The dashboard makes
  the provisional nature of these partial averages explicit.
- No submitted score fields means `rank`, `averageScore` and `weightedScore` are
  `null`; `accumulatedScore` is 0 and `submittedSheets` is 0. A valid saved zero
  receives a score/rank and is distinguished from no submission.
- Rankings are calculated on the backend, independently **within each contestant
  group and category**, using descending unrounded averages. Equal averages
  (floating-point tolerance `1e-9`) share competition ranks, e.g. `1, 1, 3`.
  Labels/names/IDs provide stable display order, not an official tie-break winner.
- Returned score values are rounded to four decimal places only after ranking;
  the UI displays up to two decimal places. Points are **not** mislabeled as votes
  or percentages, and the rubric maximum need not total 100.
- Category weights use the existing rubric-total × weight/100 calculation. This
  endpoint is not a replacement for the separate cross-category final report.
- `lastUpdatedAt` is the latest eligible sheet timestamp, or `null` when none is
  saved. `generatedAt` is the snapshot retrieval time, not a finalization time.

**Finalization:** There is no persisted finalization/locking state or finalization
endpoint in the existing system. This update does **not** invent one. All
monitoring results return `resultStatus: "provisional"`, including fully scored
categories. “Completed” means all required fields are saved, not officially
finalized. Existing score editing/upsert behavior remains available for active,
assigned judges and eligible active contestants/categories.

#### Automatic updates and failure behavior

The frontend requests this authenticated endpoint every **3 seconds after the
previous request finishes**. This is near-real-time polling, not a WebSocket or
an SSE stream. It works across backend instances without process-local events.

- Saved submissions and modifications appear on the next successful refresh.
  Unsaved browser/local-storage drafts are not counted as submissions.
- Requests never overlap. Monitoring timers stop on unmount and pause while the
  tab is hidden; the pending request is canceled on unmount. Returning to the tab
  or reconnecting the browser triggers a refresh.
- A “Refresh now” button allows an immediate request. Category, group, judge and
  sheet-status selections are kept through normal updates.
- On failure, retain the last successful snapshot and explicitly show that live
  updates are interrupted; do not replace scores/progress with misleading zeros.
  Automatically retry with a delay capped at 15 seconds. If the initial request
  fails, show a retryable error rather than fake dashboard data.
- A saved assignment change triggers a new snapshot begun after the write.
- The dashboard displays the persisted configuration/live mode as read-only;
  it no longer uses a local-only mode toggle that falsely implies a saved change.

**Additional endpoint error responses:** `500 INTERNAL_SERVER_ERROR` if dashboard
retrieval fails; `503 DATABASE_UNAVAILABLE` if the database is disconnected.

### 9.2 `PATCH /api/v1/dashboard/categories/:categoryId/judges`

**Access:** Admin only; valid authenticated session required.

**Path parameter:** a 24-character hexadecimal Category ObjectId.

**Request body:** `assignedJudges` is required. Send `null` for all active judges,
an array of distinct active Judge IDs for explicit assignments, or `[]` to assign
none. IDs are normalized to lowercase; duplicates (including mixed-case IDs),
malformed/nonexistent/inactive IDs and Admin IDs are rejected.

```json
{
  "assignedJudges": ["65f8a123b0a9c12345678901"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Category judge assignments updated successfully",
  "data": {
    "categoryId": "65f8a123b0a9c12345678910",
    "assignedJudges": ["65f8a123b0a9c12345678901"],
    "assignmentMode": "specific"
  }
}
```

For `null`, the returned `assignedJudges` is `null` and `assignmentMode` is
`"all_active"`. For `[]`, mode is `"specific"` and no judges are required.

Changing assignments **retains all historical scores** but changes which judges'
scores are included in live dashboard calculations. The dashboard editor warns
about this before saving. The nullable field is also returned by existing category
read responses; category creation defaults to all active judges. Use this
Admin-only endpoint to change assignments; existing category title/rubric update
payloads do not modify assignments.

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid category ID, missing/invalid `assignedJudges`, duplicate IDs, or IDs not belonging to active Judges. |
| 401 | `UNAUTHORIZED` | Invalid/missing/expired/revoked session. |
| 403 | `FORBIDDEN` | Authenticated user is not an Admin. |
| 404 | `RESOURCE_NOT_FOUND` | Category does not exist. |
| 500 | `INTERNAL_SERVER_ERROR` | Assignment persistence failed. |
| 503 | `DATABASE_UNAVAILABLE` | Database connection unavailable. |

### 9.3 Score-submission validation update (`POST /api/v1/scores/submit`)

The standard request/response envelope in Section 7.2 is retained. These rules
apply to both the real and legacy-prefixed backend routes:

1. Only an active authenticated **Judge** may submit scores. Admins monitor scores
   but cannot submit scores under an Admin identity (`403 FORBIDDEN`).
2. The category must be assigned to the requesting judge; `assignedJudges: null`
   retains the all-active-judges default. Unassigned judges receive `403 FORBIDDEN`.
3. The contestant's group must include the requested category (`400 VALIDATION_ERROR`).
4. Category and contestant must be active, and the category must have rubrics
   (`409 SCORING_UNAVAILABLE` otherwise). This is availability, not finalization.
5. `rubricsScore` must be a nonempty array. Partial submissions remain allowed.
   Every entry must reference a current rubric **once**, with a finite numeric
   `score`. Missing values, null, strings, blank fields, booleans and duplicate or
   unknown rubric IDs return `400 VALIDATION_ERROR` rather than being coerced to 0.
6. Negative or greater-than-maximum scores return `400 SCORE_EXCEEDS_MAX` with
   `{ rubricsId, givenScore, maxPoints }` details. Numeric `0` remains valid.
7. A successful submission replaces the existing rubric array for the unique
   `(judgeId, categoryId, contestantId)` tuple. It does not append duplicate
   sheets; modifying a score recomputes live monitoring on the next refresh.
8. Mongoose validates score writes. `JudgeScore.rubricsScore[].score` is required
   and no longer defaults an omitted score to 0. Concurrent first inserts that
   collide with the unique index retry as an update to the existing sheet.

The response still contains the saved `JudgeScore`, including its `updatedAt`.
Completion is derived from saved values and current category rubrics, not a
client-supplied “completed” flag.

### 9.4 Server startup and readiness

**Local backend:** `http://localhost:5000` (HTTP clients on the development
machine only). Browser-facing frontend code uses relative `/api/v1` URLs;
Vite forwards `/api` to the configured internal backend target. Both servers
bind `0.0.0.0` so the proxied live preview can reach them. The dev server accepts
`.e2b.app` preview hosts.

`backend/.env` supplies `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and
`JWT_EXPIRES_IN`. It is Git-ignored. Do not copy actual secrets into this contract.
Environment configuration is loaded before route imports; JWT signing and
verification use the configured secret at request time (no hardcoded fallback).
Missing `JWT_SECRET` prevents startup. Login `expiresAt` is derived from the
signed token's actual expiration.

The HTTP server stays available while MongoDB is connecting/unreachable. Initial
failed connections retry after a 15-second delay; no mock data is substituted.
Database-dependent `/api` requests return **503 `DATABASE_UNAVAILABLE`** and
`Retry-After: 15` until MongoDB is connected, rather than buffering requests or
pretending that empty/zero results are live scores.

#### Public readiness: `GET /api/v1/health`

Also available at `/health` and `/api/v1-mock/health`. No auth/body required.
`Cache-Control: no-store`.

**Connected (200 OK):**

```json
{
  "success": true,
  "message": "API and database are ready",
  "data": { "status": "ok", "database": "connected" }
}
```

**Disconnected/connecting (503 Service Unavailable):**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "API is running, but MongoDB is not connected",
    "details": []
  }
}
```

The root `GET /` remains a server-liveness check (`200`, `API is running`).
A liveness response does not prove that MongoDB is ready. No health endpoint
reveals database credentials, connection URIs, user passwords or tokens.
Malformed JSON request bodies return `400 VALIDATION_ERROR`.

#### Local server verification (no frontend test suite)

```bash
# Terminal 1
cd backend
npm ci
npm start

# Terminal 2
cd frontend
npm ci
npm run dev

# Server liveness / database readiness
curl -i http://localhost:5000/
curl -i http://localhost:5000/api/v1/health

# Verify the frontend proxy reaches the same readiness endpoint
curl -i http://localhost:5173/api/v1/health
```

When readiness is 200, sign in using an existing Admin account, open `/dashboard`,
and inspect categories/individual judges. Saved judge submissions will be picked
up by the monitor automatically. Atlas must permit this server's network access;
if TLS connections reset or the IP is not allowed, readiness is 503 and live-data
verification is blocked. Do not disable TLS or broadly open network access as a
workaround.

---

**Edited contract update:** 2026-10-02 — admin live scoring monitoring, explicit
judge assignments, submission integrity, same-origin development access and
server readiness. The original v1.0 contract is preserved above and unchanged
in its original file.


---

## 10. Reports — One Judge, One Category, One Group (2026-10-02 update)

**This section overrides Sections 8.3 and 8.4 of the original contract.**
Sections 8.1 and 8.2 remain available as progress/standings analytics, not as
individual judge score records. The dashboard changes in Section 9 are preserved.

### Report rule and purpose

**1 Report = 1 Judge = 1 Category.** Every paper/PDF also has exactly **one
contestant group** so Male/Female candidates and different pageants never mix.
For example, Judge One / Playsuit / Pageant Male and Judge One / Playsuit /
Pageant Female are separate reports. Another category or another judge always
requires a separately generated report.

The record shows **that judge's own saved values for each criterion and each
candidate**. It is not a ranking, an all-judge average, a multi-category weighted
total or a judge-progress printout. Only the selected judge has a signature line.
Separation is based on the registered `ContestantGroup` ID, not a gender inferred
from candidate names; registration must keep Male/Female in their proper groups.

### 10.1 `GET /api/v1/reports/paper/judge-scoresheet/:judgeId`

**Access:** authenticated Admins may retrieve any Judge's record. An active
session belonging to a Judge may retrieve only that Judge's own record. A Judge
requesting another judge's ID receives `403 FORBIDDEN`.

**Path parameter:** `judgeId` — one 24-character hexadecimal User ObjectId whose
`userType` is `Judge`.

**Required query parameters:**

| Parameter | Type | Meaning |
| --- | --- | --- |
| `categoryId` | ObjectId string | Exactly one competition category. |
| `groupId` | ObjectId string | Exactly one pageant/contestant group (e.g. Pageant Male). |

There is no default category, no implicit group and no `all`/list value.
Missing/malformed IDs or arrays/object-valued query parameters return
`400 VALIDATION_ERROR`. Valid IDs are resolved independently; nonexistent judge,
category or group IDs return `404 RESOURCE_NOT_FOUND`.

Example:

```http
GET /api/v1/reports/paper/judge-scoresheet/65f8a123b0a9c12345678901?categoryId=65f8a123b0a9c12345678910&groupId=65f8a123b0a9c12345678930
Authorization: Bearer <admin-or-own-judge-token>
```

**Headers:** `Cache-Control: private, no-store`.

**Response (200 OK):** the example has a valid entered zero for one criterion
and an unscored second criterion. It must not appear complete or fabricate a
zero for the missing field.

```json
{
  "success": true,
  "message": "Judge category score report retrieved successfully",
  "data": {
    "scope": {
      "judgeId": "65f8a123b0a9c12345678901",
      "categoryId": "65f8a123b0a9c12345678910",
      "groupId": "65f8a123b0a9c12345678930"
    },
    "header": {
      "country": "Republic of the Philippines",
      "institution": "Jose Rizal Memorial State University",
      "college": "College of Computing Studies",
      "eventTitle": "2026 Mr & Ms CCS",
      "title": "Judge Category Score Report"
    },
    "judge": {
      "judgeId": "65f8a123b0a9c12345678901",
      "name": "Judge One",
      "username": "judge001",
      "isActive": true
    },
    "category": {
      "categoryId": "65f8a123b0a9c12345678910",
      "name": "Playsuit",
      "weight": 10,
      "maxPoints": 100,
      "isActive": true
    },
    "group": {
      "groupId": "65f8a123b0a9c12345678930",
      "name": "Pageant Male",
      "isCurrentlyLinked": true
    },
    "criteria": [
      {
        "rubricsId": "65f8a123b0a9c12345678911",
        "name": "Stage Presence",
        "maxPoints": 40,
        "isCurrent": true
      },
      {
        "rubricsId": "65f8a123b0a9c12345678912",
        "name": "Poise & Bearing",
        "maxPoints": 60,
        "isCurrent": true
      }
    ],
    "rows": [
      {
        "rowNumber": 1,
        "contestantId": "65f8a123b0a9c12345678920",
        "name": "Candidate One",
        "label": "First Year (1)",
        "isActive": true,
        "scoreSheetId": "65f8a123b0a9c12345678991",
        "lastSavedAt": "2026-10-02T02:59:55.000Z",
        "status": "in_progress",
        "scoredFields": 1,
        "requiredFields": 2,
        "missingFields": 1,
        "reviewFields": 0,
        "duplicateScoreSheets": 0,
        "totalScore": "0",
        "fields": [
          {
            "rubricsId": "65f8a123b0a9c12345678911",
            "score": 0,
            "recordedValues": [
              0
            ],
            "status": "scored",
            "issue": null
          },
          {
            "rubricsId": "65f8a123b0a9c12345678912",
            "score": null,
            "recordedValues": [],
            "status": "missing",
            "issue": null
          }
        ]
      }
    ],
    "summary": {
      "totalContestants": 1,
      "totalCriteria": 2,
      "completedContestants": 0,
      "inProgressContestants": 1,
      "unscoredContestants": 0,
      "reviewContestants": 0,
      "scoredFields": 1,
      "requiredFields": 2,
      "missingFields": 1,
      "reviewFields": 0,
      "legacyCriteria": 0,
      "recordedEntries": 1,
      "isComplete": false
    },
    "status": "incomplete",
    "canPrint": true,
    "lastSavedAt": "2026-10-02T02:59:55.000Z",
    "reference": "JCS-CA9B6EC6FEA83822",
    "snapshotHash": "ca9b6ec6fea8382288f9f5a876fe152e069051900eb0fbcc268246fc65e129e2",
    "generatedAt": "2026-10-02T03:00:00.000Z"
  }
}
```

#### Backend isolation and historical records

- The query selects scores using **both `judgeId` and `categoryId`**, and limits
  `contestantId` to members of the selected group. The report builder rechecks
  all three scopes defensively. No combined response is filtered only in the UI.
- Include all currently registered candidates in the selected group, including
  inactive registrations, and allow an Admin to select an inactive judge or
  category. Changing activity/assignments must not erase a stored score record.
- A currently linked category/group scope can be previewed with no saved scores:
  response status is `no_scores`, all fields are missing, totals are `null`,
  and `canPrint` is false. At least one recorded entry is required for printing.
- If the category is no longer linked to the selected group, a historical report
  is still allowed when saved scores exist for that exact judge/category/group.
  It is flagged with `group.isCurrentlyLinked: false`. Without historical scores,
  an unrelated group/category combination returns `400 VALIDATION_ERROR`.
- Current category assignments do not restrict reading historical records;
  they continue to restrict new score submissions as documented in Section 9.
- The existing score model stores the latest upserted sheet per
  `(judgeId, categoryId, contestantId)`. This report is a read-only snapshot of
  those latest stored values, **not** a newly introduced full revision audit log.
  Deleted candidates/categories/groups cannot be reconstructed from this model.

#### Criterion values and totals

- `criteria` lists the selected category's current rubrics, followed by any
  unrecognized/removed rubric IDs present in that scoped judge's latest sheets.
  Unknown original rubric names cannot be recovered from the existing schema;
  the report labels them with their IDs and requires review rather than guessing
  a name or silently omitting an entered value.
- Each row contains the candidate identity, sequential `rowNumber` (not rank),
  activity flag, saved sheet ID/time, current-field completion, raw saved field
  values, row status and `totalScore`. There is no `categoryBreakdown` or
  cross-category `final_candidate_score` in this response.
- Each field has `rubricsId`, `score`, `recordedValues`, `status` and `issue`.
  `status` is `scored`, `missing` or `review`. A valid zero has `score: 0` and
  `recordedValues: [0]`; a missing field has `score: null` and an empty array.
- Invalid/out-of-range numeric values are retained exactly as stored and marked
  for review. Duplicate criterion values are all included in `recordedValues`,
  not added together or overwritten. Invalid nonnumeric values are preserved as
  displayable raw values; non-finite numbers are represented textually.
- If duplicate legacy sheet documents exist for the same scope/candidate, the
  latest timestamp/ID selects the current displayed sheet and
  `duplicateScoreSheets` is flagged. The report requires review; it never sums
  multiple sheet documents into an inflated contestant total.
- **`totalScore` is a decimal string or `null`.** It sums that candidate's unique,
  finite numeric saved values from this judge/category only, without weighting,
  averaging or display rounding. Decimal addition avoids artifacts such as
  `0.1 + 0.2` appearing as `0.30000000000000004`. Example: `"0"`, `"91"`, `"0.3"`.
- A raw total includes unique numeric legacy/out-of-range entries so it still
  records what was saved, but the paper clearly requires review. An ambiguous
  duplicate/nonnumeric total is `null`, not a guessed number. No entered values
  also means `null`, not zero. Partial totals remain explicitly labeled.

#### Completion and snapshot metadata

Row statuses are `complete`, `in_progress`, `not_started` or `needs_review`.
Report statuses are `complete`, `incomplete`, `no_scores` or `needs_review`.
Completion requires valid saved values for all current required criteria, with
no review issues. A complete report requires at least one candidate and every
candidate complete. A category without configured criteria requires review.

`summary` contains candidate/criterion counts, complete/partial/unscored/review
candidate counts, valid/missing/review field counts, legacy criterion counts and
the number of recorded entries. Review values are never counted as valid
completed fields. A saved document is not automatically considered complete.

`generatedAt` identifies preparation time and `lastSavedAt` identifies the latest
included score change. `snapshotHash` is a SHA-256 content fingerprint excluding
preparation time; `reference` is its human-readable abbreviated reference. These
are **not** persisted report IDs, digital signatures, or an immutable audit store.
The full `scope` and selected judge/category/group metadata are authoritative.

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Missing/malformed scope or unrelated category/group without historical scores. |
| 401 | `UNAUTHORIZED` | Missing, expired, invalid or revoked session. |
| 403 | `FORBIDDEN` | Judge requesting another judge's report or unsupported role. |
| 404 | `RESOURCE_NOT_FOUND` | Judge, category or group does not exist. |
| 500 | `INTERNAL_SERVER_ERROR` | Report retrieval/calculation failed. |
| 503 | `DATABASE_UNAVAILABLE` | MongoDB connection is unavailable. |

The same rules apply to the legacy `/api/v1-mock` alias implemented in `backend/`.

### 10.2 Combined paper export retired

`GET /api/v1/reports/paper/final-ranking-sheet` now returns
**410 Gone / `REPORT_REPLACED`** rather than an official-looking record combining
judges and categories. Its replacement is the scoped endpoint in Section 10.1.

```json
{
  "success": false,
  "error": {
    "code": "REPORT_REPLACED",
    "message": "Combined paper reports are no longer available. Select one judge, one category and one contestant group for a judge score report",
    "details": [
      {
        "replacement": "/reports/paper/judge-scoresheet/:judgeId",
        "requiredQuery": ["categoryId", "groupId"]
      }
    ]
  }
}
```

`GET /reports/final-rankings` and `GET /reports/voting-progress` remain analytics
APIs for compatibility. They are no longer rendered/printed as individual judge
score reports by the Reports page. Live standings/progress are available in the
admin dashboard.

### 10.3 Reports page and paper behavior

- Preserve the current admin design system: navy constellation header, shared
  sidebar, Croparo headings, Poppins interface typography and existing controls.
- Require explicit Judge, Category and Pageant/Group selections. No "All groups",
  "All categories", all-judge or combined-category print mode exists.
- Reuse existing paper-template styling and logos: institutional header, blue
  border, criterion/candidate table, certification paragraph and exactly one
  signature line labeled with the selected judge's name. No other judge or
  administrator is included in the signature section.
- Show every criterion separately, its maximum points, the judge's exact saved
  entry, raw candidate totals and scoring status. Missing fields print as `—`;
  zero prints as `0`. No fake zeros, vote percentages or combined weighted totals.
- Incomplete/review records are allowed to print with their warnings and missing
  values visible; a record with no saved entries cannot print. "Complete" means
  scoring complete, not electronic event finalization or an automatically signed
  document. Signing is manual and does not silently lock later score editing.
- A4 portrait is used for up to four criterion columns; wider records use A4
  landscape. Paper content flows normally across pages, with repeating table
  headers identifying the same judge/category/group. Candidate rows and the
  single signature block avoid page splitting where possible. There is no
  fixed-position page that clips/repeats the entire document.
- The paper displays preparation time in Philippine time (PHT), the record
  reference and selected scope. The print dialog can save an individual PDF.
- Preview is a stable saved-data snapshot, **not** a live-updating table. Refresh
  explicitly to include later score edits. Printing captures the exact preview
  before opening the dialog and does not silently fetch different scores.
- Changing scope clears/cancels the old report; canceled/unmounted/late requests
  cannot replace a newer scope. The client also verifies returned scope IDs before
  allowing printing. Failed initial/refresh requests never enable stale printouts.
- Ordinary browser printing without a prepared printable report shows a clear
  selection instruction, not the admin UI or a combined report. Signature/date
  lines are blank for the selected judge to complete manually.

### Manual server verification (no frontend test suite)

1. Start the backend/frontend servers and check `/api/v1/health` through the
   frontend proxy. A 503 readiness result blocks authenticated live-data
   verification; do not substitute mock scores as official records.
2. When MongoDB is available, sign in as an Admin and open `/reports`.
3. Generate Judge One / Playsuit / Pageant Male. Verify individual raw criterion
   values, exact decimals, valid zeros, missing fields and the single signature.
4. Switch to Pageant Female, another category, then another judge. Each change
   must clear the previous report and require a new scoped request.
5. Print/save PDF. Verify no other judge/category/group appears, the existing
   institutional paper design is retained, and multi-page rows are not clipped.
6. Confirm omitted `categoryId`/`groupId` requests fail with 400, a Judge requesting
   another Judge's record fails with 403, and the former combined paper export
   returns 410. Inactive/legacy stored entries remain visible and require review
   when appropriate.

**Reports update:** 2026-10-02. The original `API_Contract_v1_0.md` remains
unchanged; all report additions and breaking print-contract changes are recorded
in this edited duplicate.
