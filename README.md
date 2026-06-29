# 🚀 DropoutSyS: Student Dropout Prediction System

An AI-powered academic early-warning system designed to predict and prevent student attrition. DropoutSyS leverages a calibrated Random Forest machine learning model to evaluate holistic student profiles (academic, socio-demographic, and financial) and categorize students into actionable risk tiers (Safe 🟢, At-Risk 🟡, High-Risk 🔴) before they disengage.

---

## 🏗️ System Architecture

The project features a **decoupled, stateless ML microservice** architecture:


flowchart TD
    User([Educator / Admin]) -->|Interacts| FE[Next.js Frontend]
    FE -->|Auth & Database Operations| DB[(Supabase PostgreSQL)]
    FE -->|Serializes features for ML| API[Next.js API Gateway Proxy]
    API -->|HTTP POST Payload| BE[FastAPI Python Microservice]
    BE -->|Loads pickle model| ML[Random Forest Classifier]
    BE -->|Returns probability & risk tier| API
    API -->|Synchronizes prediction state| DB
    FE -->|Displays visual warnings| User

1. **Next.js Frontend:** A modern client interface built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, and Lucide React.
2. **Supabase Database & Auth:** Secure student and academic record state storage using PostgreSQL and Supabase JWT authentication.
3. **FastAPI ML Service:** A stateless Python microservice in `backend/` running a Random Forest classification model to output calibrated prediction margins.

---

## 📁 Repository Structure

```
student-dropout-prediction/
│
├── backend/                     # Python FastAPI ML Microservice
│   ├── main.py                  # API endpoints (/predict/single, /predict/bulk)
│   ├── feature_columns.pkl      # Pickled input columns metadata
│   └── random_forest_dropout_model.pkl  # Pickled Random Forest classifier
│
├── src/                         # Next.js Frontend App
│   ├── app/                     # App Router components & routes
│   │   ├── admin-login/         # Administrator portal gateway
│   │   ├── administrator/       # Administrator dashboards & metrics tabs
│   │   ├── api/                 # API Proxy Route Handlers (proxies backend)
│   │   ├── login/               # Generic / Teacher portal gateway
│   │   ├── teacher/             # Teacher attendance & grade dashboards
│   │   └── page.tsx             # Public landing page with live database statistics
│   │
│   ├── components/              # Shared layouts (collapsible Navbar & Drawer)
│   └── lib/                     # Database state layers (Supabase & AuthContext)
│
├── requirements.txt             # Python ML microservice dependencies
├── package.json                 # Next.js dependencies
└── docker-compose.yml           # Local setup orchestration config
```

---

## 🔧 Core Components

### 1. Next.js Frontend
- **Public Landing Page:** Featuring smooth-scrolling visual cards and live metrics showing actual active cohorts, alerts dispatched, and saved student rates queried directly from Supabase.
- **Teacher Dashboard:** Allows teachers to manage classes, record attendance in matrix spreadsheets, update student grades, and instantly trigger model recalculations.
- **Admin Dashboard:** Features student CRUD portals, bulk CSV file uploads, user management, and detailed risk analysis metrics.

### 2. FastAPI ML Engine
- Stateless microservice written in Python.
- Loads a pre-trained **Calibrated Random Forest (SMOTE Balanced)** classifier.
- Analyzes **30 holistic features** including Attendance Rate, GPA, Family Income, Travel Time, Assignment Delay, Scholarship, and Parent Education.
- Classifies outcomes into three risk groups:
  - 🟢 **Safe:** `< 50%` Probability
  - 🟡 **At-Risk:** `50% - 70%` Probability
  - 🔴 **High-Risk:** `> 70%` Probability

---

## ⚙️ Local Development Setup

### Prerequisite Environment
Create a copy of `.env.example` named `.env` in the root directory and supply your credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 1. Set Up Python ML Backend
From the root folder:
```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run FastAPI server (runs on http://127.0.0.1:8000)
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Set Up Next.js Frontend
From the root folder in a new terminal window:
```bash
# Install dependencies
npm install

# Run the development server (runs on http://localhost:3000)
npm run de

---

## 📊 Model Performance Metrics
- **Accuracy:** `78.5%`
- **ROC Area Under Curve (AUC):** `81.0%`
- **Trained Pipeline:** Scikit-Learn Random Forest Classifier optimized with Synthetic Minority Over-sampling Technique (SMOTE) to balance minority dropout patterns.

---

## 🤝 Project Language & Context
Mashruucan waxaa sidoo kale loogu talagalay inuu caawiyo jaamacadaha waddanka Soomaaliya si loo yareeyo ka harista ardayda jaamacadaha. 
*Koodhka wuxuu ka kooban yahay qaybo Somali iyo English ah oo loogu talagalay in ay u fududaato macallimiinta iyo maamulayaasha jaamacadda.*
