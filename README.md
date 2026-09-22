# CivicSense AI

> An intelligent civic grievance management platform that empowers citizens to report, track, and resolve local civic issues through AI-powered classification, deduplication, and analytics.

---

## Overview

CivicSense AI transforms how citizens interact with local governance by creating a transparent, responsive, and data-driven pipeline for civic issue resolution. Citizens report problems through an intuitive interface, and the platform intelligently classifies, routes, prioritizes, and tracks each complaint through to resolution.

---

## Core Features

### For Citizens
- **Easy Complaint Submission** — Report issues with photos, location, and descriptions via web or mobile
- **Real-Time Tracking** — Follow your complaint from submission through investigation to resolution
- **AI-Powered Routing** — Complaints automatically classified and sent to the right department
- **Duplicate Detection** — Existing similar complaints are surfaced, reducing redundancy
- **Status Notifications** — Updates at every stage of the complaint lifecycle
- **Community Dashboard** — See what issues are being reported in your area

### For Government Officials
- **Role-Based Dashboard** — Department-specific views with relevant assigned complaints
- **Complaint Management** — Accept, assign, update status, and mark resolution with proof
- **Priority Scoring** — AI-assigned urgency scores help focus on critical issues first
- **Analytics & Insights** — Heatmaps, trend analysis, and department performance metrics
- **Bulk Operations** — Manage multiple complaints efficiently

### For Administrators
- **System Overview** — Organization-wide complaint metrics and health indicators
- **Department Management** — Configure departments, officials, and routing rules
- **User Management** — Manage citizen accounts, official accounts, and permissions
- **Audit Trail** — Complete activity log for accountability and compliance

### AI & Intelligence Layer
- **Complaint Classification** — NLP-based categorization into types (pothole, garbage, water leakage, etc.)
- **Department Routing** — Automatic assignment to responsible government departments
- **Similarity Detection** — Identifies and groups duplicate/near-duplicate complaints
- **Priority Scoring** — Multi-factor urgency assessment based on text, location history, and severity keywords
- **Sentiment Analysis** — Gauges citizen frustration to help prioritize escalated issues
- **Area Analytics** — Identifies problem-prone zones and recurring issue patterns

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, custom CSS design system |
| Backend | Node.js, Express.js, **MySQL + Sequelize ORM** |
| AI Service | Python 3.11, FastAPI, scikit-learn (optional) |
| Authentication | JWT, bcrypt, role-based access control |
| File Storage | Local (expandable to S3/Cloudinary) |
| Deployment | Docker Compose, Nginx |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+ (only if you want the live AI service)
- MySQL 8+ (or Docker for the containerized MySQL)
- Docker & Docker Compose (optional)

### Quick Start with Docker
```bash
git clone https://github.com/your-org/civicsense-ai.git
cd civicsense-ai
docker-compose up -d
```
This starts MySQL, the backend, the AI service, and the frontend automatically.

### Manual Setup

**Create the database** (once):
```sql
-- in MySQL, run once
CREATE DATABASE IF NOT EXISTS civicsense;
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MySQL username/password
npm run seed    # Optional: populate with sample data (creates tables automatically)
npm run dev
```

**AI Service:**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## License

MIT

# CivicSense-AI