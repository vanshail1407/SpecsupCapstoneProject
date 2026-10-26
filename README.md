# SpecsUp - Optical Care & Prescription Trend Analysis System
### Complete Full-Stack College Capstone Project

SpecsUp is a full-stack optical shop web application and clinical eye-prescription trend analysis system. It connects local optical shop operations with longitudinal vision health tracking for patients.

---

## 1. System Architecture

```
React (Vite + Tailwind CSS + Lucide React)
               │
               ▼  REST APIs + Bearer Session Token
FastAPI (Python 3.14)
               │
               ├─► DSA Prescription Trend & Recommendation Engine
               ├─► ReportLab Medical PDF Generator
               ▼
Supabase PostgreSQL / Local Fallback Database
   ├── users (Customers & Staff Admins)
   ├── frames (In-shop Eyewear Inventory)
   ├── prescriptions (Right & Left Eye SPH/CYL/Axis/PD)
   └── reservations (Atomic Stock Pre-bookings)
```

---

## 2. Key Features

### For Customers:
- **Optical Shop Storefront**: Browse available optical frames with real-time stock counts.
- **Stock-Safe Pre-booking**: Reserve in-shop frames with immediate atomic inventory decrement.
- **Prescription Analysis (Core Innovation)**:
  - **Section 1 — Next Checkup Recommendation**: Mathematically estimated examination date based on past visit intervals and power volatility. Includes clinical disclaimer.
  - **Section 2 — Ocular Trend Analysis**: Interactive historical SPH progression graph, annualized change rates (D/year), and rule-based trend classification (*Stable*, *Increasing*, *Decreasing*).
  - **Section 3 — Latest Prescription Summary**: Clear clinical table of Right Eye (OD) and Left Eye (OS) measurements.
- **Medical PDF Download**: Generates and downloads an official multi-checkup prescription history PDF via Python ReportLab.
- **Prescription History**: Complete reverse-chronological examination records.
- **Profile Management**: Update contact information and view pre-booked frame reservations.

### For Admin / Optical Shop Staff:
- **Frame Inventory Management (CRUD)**: Create, view, update, and delete optical frames with stock safeguards.
- **Customer Directory**: View registered customers and examination timelines.
- **Record Examinations**: Add new prescription records (Right/Left SPH, CYL, Axis, PD, checkup date, clinical notes).
- **Reservation Tracking**: Real-time overview of customer in-store frame pre-bookings.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Lucide React (Zero external UI heavy frameworks).
- **Backend**: Python, FastAPI, Uvicorn, Pydantic v2, ReportLab (PDF), Python-Dotenv.
- **Database**: Supabase PostgreSQL schema (`backend/app/database/schema.sql`) with automatic local fallback for offline evaluation.

---

## 4. Quick Start & Execution

### Option A: Automatic Launch (Windows)
Double click `start_all.bat` or run:
```cmd
start_all.bat
```
This starts both the FastAPI backend (`http://localhost:8000`) and the React frontend (`http://localhost:5173`) in dedicated command windows.

### Option B: Manual Launch

1. **Backend**:
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```
- Application URL: `http://localhost:5173`

---

## 5. Pre-seeded Demo Accounts

| Role | Email | Password | Test Scenario |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@specsup.com` | `admin123` | Staff access, Frame CRUD, Record Checkups |
| **Customer** | `rahul@gmail.com` | `password123` | **Increasing Myopia**: Progressive minus power change |
| **Customer** | `ananya@gmail.com` | `password123` | **Stable Prescription**: 3 annual checkups with 0 power change |
| **Customer** | `vikram@gmail.com` | `password123` | **Insufficient Data**: 1 checkup (tests empty state handling) |
| **Customer** | `neha@gmail.com` | `password123` | **Decreasing Power**: Hyperopic/relaxation shift |

*(Note: Clickable shortcuts to fill demo credentials are built directly into the Login screen for viva demonstration).*

---

## 6. Academic Viva Guide: Data Structures & Algorithms (DSA)

Located in `backend/app/algorithms/prescription_analysis.py`:

### A. Data Structures
1. **Lists / Dynamic Arrays**: Temporal sequence of prescription objects retrieved from database.
2. **Hash Maps / Dictionaries**: Fast $O(1)$ attribute lookups for optical measurements.
3. **Sliding Windows (Two-Pointer)**: Iterates across consecutive pairs $(i, i+1)$ to measure temporal and optical deltas.

### B. Algorithm Workflow
1. **Chronological Sorting**: TimSort ($O(N \log N)$) ensures checkup dates are monotonically ordered from oldest to newest.
2. **Boundary Validation**: If records $< 2$, early exit with `insufficient_data` status (avoids false interpolation).
3. **Elapsed Time Calculation**: Uses true calendar differences:
   $$\Delta t = \frac{\text{Days}(Date_{i+1} - Date_i)}{365.25}$$
4. **Annualized Change Rate**:
   $$\text{Rate}_{\text{SPH}} = \frac{\text{SPH}_{i+1} - \text{SPH}_i}{\Delta t} \quad (\text{Diopters / year})$$
5. **Rule-Based Trend Classification**:
   - $|\text{Avg Rate}| \le 0.10 \text{ D/yr} \implies \textbf{Stable}$
   - $\text{Avg Rate} < -0.10 \text{ D/yr} \implies \textbf{Increasing}$ *(myopic shift / more minus power)*
   - $\text{Avg Rate} > +0.10 \text{ D/yr} \implies \textbf{Decreasing}$ *(hyperopic shift / reduced minus)*
6. **Dynamic Checkup Projection**:
   Combines historical checkup interval with power volatility:
   - High change rate ($\ge 0.50 \text{ D/yr}$) $\implies$ 6-month follow-up.
   - Moderate change rate ($0.25 - 0.50 \text{ D/yr}$) $\implies$ 9-month follow-up.
   - Stable ($\le 0.25 \text{ D/yr}$) $\implies$ 12-month routine follow-up.
   - Formula: $\text{Next Checkup Date} = \text{Latest Date} + \text{Recommended Interval}$.

---

## 7. Automated Test Suite

A complete integration test suite verifies all customer and admin flows:
```bash
cd backend
python test_backend.py
```
**Tests Covered:**
- Health & public endpoints.
- Role-based route authorization (403 on admin routes for customers, 401 for guests).
- Atomic inventory pre-booking and zero-stock prevention.
- Prescriptions sorting and retrieval.
- Trend analysis accuracy across increasing, stable, and single-checkup profiles.
- PDF generation and binary stream validation.
- Admin frame CRUD and prescription creation.
