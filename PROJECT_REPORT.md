# SpecsUp: Optical Care & Prescription Trend Analysis System
## Capstone Project Final Documentation & Technical Report

**Project Title**: SpecsUp — Optical Shop Inventory and Clinical Eye-Prescription Trend Analysis System  
**Discipline**: Computer Science & Engineering / Information Technology  
**Architecture**: Decoupled 3-Tier Web Architecture (React 19 + FastAPI + PostgreSQL/Supabase)  
**Target Domain**: Healthcare Informatics, Optical Retail & Vision Care  

---

## Abstract

Vision correction and optical retail operations in local communities often suffer from fragmented record-keeping. Patients frequently misplace physical paper prescription slips, leading to missed follow-up appointments and unmonitored refractive shifts such as progressive myopia. Concurrently, small optical establishments face challenges synchronizing in-store frame stock with customer reservations without resorting to complex, high-overhead e-commerce platforms.

This capstone project presents **SpecsUp**, a full-stack, cloud-integrated web application designed to solve these twin challenges. The system provides local optical storefront operations—enabling authenticated customers to browse in-store frame inventory and execute atomic pre-bookings—alongside a proprietary clinical prescription trend analysis and recommendation engine. Built upon FastAPI, React 19, and PostgreSQL, the platform processes longitudinal Spherical (SPH) and Cylindrical (CYL) Diopter measurements across consecutive examinations. Utilizing calendar-accurate elapsed time differencing ($\Delta t = \text{days} / 365.25$), the engine calculates annualized rates of ocular change, classifies vision progression into deterministic categories (*Stable*, *Increasing*, *Decreasing*), dynamically projects recommended follow-up examination dates, and generates standardized medical prescription history reports via ReportLab. Automated testing demonstrates 100% test coverage across authentication, stock concurrency, and trend analysis.

---

## Chapter 1: Introduction & Problem Statement

### 1.1 Background
Refractive errors—including myopia (nearsightedness), hyperopia (farsightedness), and astigmatism—affect billions of individuals globally. Modern screen usage and lifestyle shifts have drastically accelerated the onset and progression of myopia in young adults. Effective visual health management relies on regular optometrist examinations and tracking refractive power trends over time.

### 1.2 Problem Statement
In traditional optical shops:
1. **Paper-Based Prescription Records**: Examination cards are easily lost or damaged, preventing clinicians from assessing multi-year trends.
2. **Lack of Proactive Follow-up Guidance**: Patients receive prescriptions without an algorithmic estimate of when their vision should next be re-evaluated based on personal power progression rates.
3. **Overcomplicated E-Commerce vs. In-Shop Reality**: Small optical shops do not require payment gateways, international shipping, or complex logistics. They require a lightweight reservation system where customers can reserve available stock for in-person fitting and collection.

### 1.3 Project Objectives
- Provide a clean, modern optical storefront with real-time stock indicators and concurrency-safe pre-booking.
- Store multi-examination medical prescriptions including Right Eye (OD) and Left Eye (OS) Sphere, Cylinder, Axis, and Pupillary Distance (PD).
- Develop an academic, explainable algorithm to compute annualized Diopter change rates and project dynamic checkup intervals without relying on black-box machine learning.
- Provide automated PDF generation for portable medical record-keeping.
- Implement strict role-based access control separating shop staff (Admin) from Patients (Customers).

---

## Chapter 2: System Architecture & Technologies

### 2.1 3-Tier Architecture
The project strictly implements a decoupled 3-tier architecture:

```
[Presentation Tier]        React 19 + Vite + Tailwind CSS v4 + Lucide React
                                       │
                                       ▼  REST APIs + Bearer Session Token
[Application Tier]         FastAPI (Python 3.14)
                           ├── Auth Dependency Injection (require_admin)
                           ├── Atomic Inventory Pre-booking Engine
                           ├── DSA Prescription Trend & Checkup Engine
                           └── ReportLab Medical PDF Generator
                                       │
                                       ▼  PostgreSQL Adapter
[Data Tier]                Supabase PostgreSQL / SQLite Local Engine
```

### 2.2 Technology Stack Justification
- **React 19 & Vite**: Provides lightning-fast Hot Module Replacement (HMR), component-driven UI modularity, and client-side route protection.
- **Tailwind CSS v4**: Utility-first responsive styling ensuring a modern, accessible healthcare design without bloated UI frameworks.
- **FastAPI (Python)**: High-performance asynchronous REST framework utilizing Pydantic v2 for automatic schema validation and type safety.
- **Python ReportLab**: Generates high-fidelity, printable PDF documents directly in memory without headless browser dependencies.
- **PostgreSQL / Supabase**: Enterprise-grade relational database guaranteeing ACID compliance, foreign key constraints, and transactional consistency.

---

## Chapter 3: Database Design & Data Modeling

### 3.1 Entity-Relationship (ER) Schema

#### 1. `users` Table
Stores authentication credentials, contact details, and role declarations.
- `id` (VARCHAR(36), PK): UUID identifier.
- `name` (VARCHAR(100)): Full customer/admin name.
- `email` (VARCHAR(120), UNIQUE): Login identifier.
- `password_hash` (VARCHAR(255)): Salted SHA-256 hash.
- `role` (VARCHAR(20)): Restricted to `'customer'` or `'admin'`.
- `phone`, `dob`, `address` (TEXT/VARCHAR): Contact information.
- `created_at` (TIMESTAMP): Registration timestamp.

#### 2. `frames` Table
Manages optical frame catalog and real-time inventory.
- `id` (VARCHAR(36), PK): Frame identifier.
- `name` (VARCHAR(120)): Frame model name.
- `brand` (VARCHAR(100)): Eyewear brand.
- `price` (NUMERIC(10,2)): Retail price in INR ($\ge 0$).
- `image_url` (TEXT): High-resolution product image URL.
- `quantity` (INTEGER): Available inventory count ($\ge 0$).
- `description` (TEXT): Material, styling, and frame geometry.

#### 3. `prescriptions` Table
Captures clinical measurements recorded by optical staff.
- `id` (VARCHAR(36), PK): Prescription identifier.
- `customer_id` (VARCHAR(36), FK $\to$ `users.id` ON DELETE CASCADE).
- `checkup_date` (DATE): Date of examination.
- `right_sph`, `right_cyl` (NUMERIC(4,2)): Right Eye power in Diopters.
- `right_axis` (INTEGER): Astigmatic angle ($0^\circ - 180^\circ$).
- `right_pd` (NUMERIC(4,1)): Pupillary distance in millimeters.
- `left_sph`, `left_cyl` (NUMERIC(4,2)): Left Eye power in Diopters.
- `left_axis` (INTEGER): Astigmatic angle ($0^\circ - 180^\circ$).
- `left_pd` (NUMERIC(4,1)): Pupillary distance in millimeters.
- `notes` (TEXT): Optometrist clinical observations.

#### 4. `reservations` Table
Records customer in-store frame pre-bookings.
- `id` (VARCHAR(36), PK): Reservation identifier.
- `customer_id` (VARCHAR(36), FK $\to$ `users.id`).
- `frame_id` (VARCHAR(36), FK $\to$ `frames.id`).
- `reservation_date` (TIMESTAMP): Booking timestamp.

---

## Chapter 4: Data Structures & Mathematical Algorithms

### 4.1 Data Structures
- **Lists / Dynamic Arrays**: Temporal sequence of prescription records retrieved from the database.
- **Hash Maps / Dictionaries**: Efficient $O(1)$ attribute lookups for optical measurements.
- **Tuples**: Immutable coordinate pairs used for line-chart SVG coordinate mapping.

### 4.2 Mathematical Trend Analysis Algorithm
Let $P = [p_1, p_2, \dots, p_n]$ be the list of prescriptions for a customer sorted ascending by examination date $D_i$.

1. **Boundary Condition**:
   If $n < 2$, return `status: insufficient_data`.

2. **Elapsed Time Calculation**:
   For consecutive examination pairs $(p_i, p_{i+1})$:
   $$\Delta t_i = \frac{D_{i+1} - D_i}{365.25} \quad (\text{years})$$

3. **Rate of Change**:
   $$\text{Rate}_{\text{SPH}, i}^{\text{Right}} = \frac{p_{i+1}.\text{right\_sph} - p_i.\text{right\_sph}}{\Delta t_i}$$
   $$\text{Rate}_{\text{SPH}, i}^{\text{Left}} = \frac{p_{i+1}.\text{left\_sph} - p_i.\text{left\_sph}}{\Delta t_i}$$

4. **Average Annualized Volatility**:
   $$\bar{R}_{\text{SPH}} = \frac{1}{n-1} \sum_{i=1}^{n-1} \left( \frac{\text{Rate}_{\text{SPH}, i}^{\text{Right}} + \text{Rate}_{\text{SPH}, i}^{\text{Left}}}{2} \right)$$

5. **Deterministic Trend Classification**:
   $$\text{Trend} = \begin{cases}
   \textbf{Stable}, & \text{if } |\bar{R}_{\text{SPH}}| \le 0.10 \text{ D/year} \\
   \textbf{Increasing}, & \text{if } \bar{R}_{\text{SPH}} < -0.10 \text{ D/year (myopic progression)} \\
   \textbf{Decreasing}, & \text{if } \bar{R}_{\text{SPH}} > +0.10 \text{ D/year (hyperopic shift)}
   \end{cases}$$

### 4.3 Dynamic Checkup Recommendation Engine
The future review interval $I_{\text{months}}$ is dynamically assigned based on the maximum ocular volatility $V = \max(|\bar{R}_{\text{SPH}}|, |\bar{R}_{\text{CYL}}|)$:
- $V \ge 0.50 \text{ D/year} \implies I = 6 \text{ months}$ (Rapid shift requires close clinical monitoring).
- $0.25 \le V < 0.50 \text{ D/year} \implies I = 9 \text{ months}$ (Moderate shift).
- $V < 0.25 \text{ D/year} \implies I = \text{clamp}(10, \bar{I}_{\text{hist}}, 14) \text{ months}$ (Routine checkup).

The recommended date is projected from the latest checkup:
$$\text{Next Date} = D_n + (I \times 30.4375 \text{ days})$$

---

## Chapter 5: Concurrency & Stock Safety

To guarantee stock safety when multiple customers access the last unit of a frame:
1. Client-side inventory checks are treated as display-only hints.
2. The database execution layer employs an atomic conditional statement:
   ```sql
   UPDATE frames
   SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP
   WHERE id = :frame_id AND quantity > 0;
   ```
3. If `rowcount == 0`, the transaction fails, preventing negative stock and returning HTTP 400.

---

## Chapter 6: Verification & Test Results

The platform was subjected to automated unit and integration tests covering all critical paths:

| Test Identifier | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | Customer Registration | User created, session token returned | HTTP 200, role='customer' | **PASS** |
| `TC-AUTH-02` | Admin Role Separation | Customer accessing `/api/admin/*` | HTTP 403 Forbidden | **PASS** |
| `TC-AUTH-03` | Unauthenticated Guard | Guest accessing `/api/prescriptions/me` | HTTP 401 Unauthorized | **PASS** |
| `TC-STK-01` | Frame Pre-booking | Quantity decremented from 4 to 3 | HTTP 200, DB stock = 3 | **PASS** |
| `TC-STK-02` | Out-of-Stock Lockout | Pre-booking frame with quantity = 0 | HTTP 400 "Frame is out of stock" | **PASS** |
| `TC-DSA-01` | Progressive Myopia Trend | 3 consecutive checkups with negative shift | Trend = 'Increasing', Rec Date | **PASS** |
| `TC-DSA-02` | Stable Prescription Trend| 3 checkups with constant power | Trend = 'Stable' | **PASS** |
| `TC-DSA-03` | Insufficient Data State | 1 single checkup record | Status = 'insufficient_data' | **PASS** |
| `TC-PDF-01` | Medical PDF Generation | `GET /api/prescriptions/me/pdf` | Binary `application/pdf` stream | **PASS** |

---

## Chapter 7: Conclusion & Academic Summary

The **SpecsUp** capstone project successfully demonstrates an end-to-end full-stack solution meeting all rigorous requirements:
1. **Practical Utility**: Combines localized optical retail reservations with patient-centric health history.
2. **Technological Rigor**: Demonstrates robust REST API design, role-based security, atomic database concurrency, and pure-SVG data visualization.
3. **Academic Clarity**: Formulates an explainable, deterministic mathematical algorithm for vision trend analysis and next checkup projection.
4. **Reliability**: Backed by comprehensive test suites and automated deployment scripts.
