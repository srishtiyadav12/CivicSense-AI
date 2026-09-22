# CivicSense AI — Technical Architecture

## System Overview

CivicSense AI follows a **modular microservice architecture** with three main components:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │    Backend      │      │   AI Service    │
│   (React SPA)   │─────▶│  (Node.js API)  │─────▶│   (FastAPI)     │
│                 │      │                 │      │                 │
│  User interface │      │  Auth, CRUD,    │      │  Classification │
│  Dashboards     │      │  Routing, Logs  │      │  Deduplication  │
└────────┬────────┘      └────────┬────────┘      │  Sentiment      │
         │                       │                └─────────────────┘
         │                       │
         │                 ┌─────▼─────┐
         │                 │   MySQL   │
         │                 │(Data Store)│
         │                 └───────────┘
         │
         ▼
   (Static assets served via Nginx)
```

## Component Breakdown

### 1. Frontend — React SPA
- **Routing:** React Router v6 with protected routes and role-based access
- **State Management:** React Context (AuthContext for session, local state for UI)
- **Data Fetching:** Axios with JWT interceptor and centralized API client
- **Charts & Visualization:** Recharts (charts), custom SVG heatmap visualization
- **Styling:** Custom CSS design system with CSS variables

Pages:
- Landing (marketing/promo)
- Login / Register
- Dashboard (role-aware)
- Complaints (list + filters)
- SubmitComplaint
- ComplaintDetail (with timeline + status updates)
- Analytics (trends, types, department performance, heatmap)
- User Management (admin)

### 2. Backend — Node.js / Express
- **Auth:** JWT-based with bcrypt password hashing, role-based middleware
- **ORM:** Sequelize over MySQL (models: users, complaints, departments, activity_logs)
- **Complaint lifecycle:** submitted → under_review → assigned → in_progress → resolved
- **AI integration:** HTTP calls to AI service with graceful fallback to heuristic analysis
- **Security:** helmet, CORS, rate limiting, xss-clean
- **Search:** SQL `LIKE` across complaint title/description

### 3. AI Service — Python / FastAPI
- **Classification:** Keyword-based heuristics + optional scikit-learn TF-IDF + Naive Bayes
- **Priority scoring:** Severity-keyword heuristics (Critical/High/Medium/Low)
- **Sentiment analysis:** Rule-based (negative/mild/positive + intensifiers)
- **Similarity detection:** rapidfuzz fuzzy matching + Jaccard token similarity
- **Fallback strategy:** If AI service is down, backend uses built-in heuristics

## Data Model (MySQL / Sequelize)

### `users`
```
id PK, name, email UNIQUE, password(hash), role[citizen|official|admin|super_admin],
department?, ward?, phone?, avatar?, isActive, lastLogin?, createdAt, updatedAt
```

### `complaints`
```
id PK, title, description, type, priority(1-4), priorityLabel, status, department,
locLat DECIMAL, locLng DECIMAL, locAddress, locWard, locCity, locState,   -- flattened location
reportedById FK→users, assignedToId FK→users NULL, duplicateOfId FK→complaints NULL,
images JSON(TEXT), statusHistory JSON(TEXT), similarComplaints JSON(TEXT),
resolutionProof JSON(TEXT), aiAnalysis JSON(TEXT), isDeleted, createdAt, updatedAt
```
Nested/array data (images, status history, similar complaints, resolution proof, AI
analysis) is stored as JSON TEXT columns; the model serializes them back into the
nested object shape the frontend expects. Location is flattened into lat/lng columns
to support spatial (Haversine) queries.

### `departments`
```
id PK, name UNIQUE, description, headOfDepartmentId FK→users NULL,
contactEmail, contactPhone, assignedWards JSON(TEXT), isActive, createdAt, updatedAt
```

### `activity_logs`
```
id PK, userId FK→users, action, targetModel, targetId, details JSON(TEXT), ipAddress, createdAt
```

## API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Citizen registration |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | JWT | Current user |
| PUT | /api/auth/profile | JWT | Update profile |
| POST | /api/complaints | JWT | Create complaint |
| GET | /api/complaints | JWT | List complaints (role-filtered) |
| GET | /api/complaints/:id | JWT | Get complaint detail |
| PATCH | /api/complaints/:id/status | Official/Admin | Update status |
| PATCH | /api/complaints/:id/resolve | Official/Admin | Resolution proof |
| POST | /api/complaints/merge | Admin | Merge duplicates |
| GET | /api/dashboard/stats | JWT | Role-aware stats |
| GET | /api/dashboard/trends | JWT | Temporal trends |
| GET | /api/dashboard/heatmap | JWT | Geographic density |
| GET | /api/users | Admin | List users |
| GET | /api/departments | JWT | List departments |
| POST | /api/ai/analyze | JWT | Direct AI classification |
| GET | /api/ai/health | JWT | AI service health |

## AI Analysis Pipeline

1. **Submission** — Citizen submits title + description (+ location)
2. **Preprocessing** — Lowercase, strip punctuation, normalize
3. **Classification** — Match against category keyword lexicons → complaint type
4. **Routing** — Map complaint type → responsible department
5. **Priority** — Score severity based on critical/high/medium keyword matching
6. **Sentiment** — Detect negative language and intensifiers → sentiment score
7. **Deduplication** — Compute similarity against existing complaints (fuzzy + text + category)
8. **Persist** — Store AI analysis with the complaint for governance/audit

## Deployment

- **Docker Compose** orchestrates all 4 services (MySQL, Backend, AI, Frontend)
- **Nginx** serves the React build and proxies /api to the backend
- Environment-based configuration via .env files
- `DB_SYNC=true` auto-creates/updates SQL tables on backend startup

## Recommended Enhancements (Roadmap)

- Email/SMS notifications for status updates
- Photo upload to cloud storage (S3/Cloudinary)
- WhatsApp/mobile integration
- Voice-based complaint submission
- Real geolocation-based heatmaps (Leaflet)
- Trained ML model with real-world complaint datasets
- Multi-city support and localization
- Public API for third-party integrations
- Push notifications via WebSockets