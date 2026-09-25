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