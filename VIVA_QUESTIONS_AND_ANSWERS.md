# SpecsUp - Capstone Defense & Viva Preparation Guide

This document prepares students to answer technical, algorithmic, and architectural questions from professors and external examiners during the project defense.

---

### Q1: What is the core architecture of SpecsUp, and how does data flow between tiers?
**Answer**:
SpecsUp is architected as a decoupled 3-tier client-server application:
1. **Presentation Layer (React + Vite + Tailwind CSS)**: Renders the responsive UI and handles route protection. User actions trigger asynchronous fetch calls to FastAPI via REST endpoints with a bearer session token.
2. **Application & Business Logic Layer (FastAPI + Python)**: Validates incoming payloads with Pydantic, validates user identity and role (`admin` vs `customer`), coordinates database operations, and executes the core algorithmic trend and recommendation logic.
3. **Data Tier (PostgreSQL / Supabase)**: Relational schema comprising `users`, `frames`, `reservations`, and `prescriptions` with strict foreign key constraints and transactional integrity.

---

### Q2: How did you implement authentication, and why avoid JWT or OAuth?
**Answer**:
In accordance with capstone specifications prioritizing clarity, demonstrable code, and academic understandability:
- We avoided bloated third-party authentication infrastructure (OAuth, Refresh Tokens, Redis session stores) that obscure core application logic.
- We implemented a secure, lightweight session token system:
  1. Passwords are salted and hashed using standard library SHA-256 (`hashlib`).
  2. Upon login, the backend verifies the hash, checks the user role, generates a unique UUID session token, and records it in the database.
  3. Every subsequent API request passes `Authorization: Bearer <token>`.
  4. FastAPI dependency injection (`require_admin` / `get_current_user`) resolves the user and strictly enforces role permissions on the backend.
  5. A customer trying to execute admin endpoints receives an immediate `403 Forbidden` response.

---

### Q3: Explain the Prescription Trend Analysis Algorithm in detail.
**Answer**:
Located in `backend/app/algorithms/prescription_analysis.py`:
1. **Chronological Sorting**: Retrieves all historical prescriptions for the user and sorts them ascending by `checkup_date` using Python’s **TimSort** ($O(N \log N)$).
2. **Boundary Condition**: If records $< 2$, returns `insufficient_data` status immediately (academic integrity: never interpolate or fabricate fake trends).
3. **True Elapsed Time**: Does not assume checkups are exactly 1 year apart. Calculates actual calendar differences:
   $$\Delta t = \frac{\text{Days}(Date_{i+1} - Date_i)}{365.25}$$
4. **Consecutive Power Deltas**: Computes change in Spherical (SPH) and Cylindrical (CYL) Diopters:
   $$\Delta \text{SPH} = \text{SPH}_{i+1} - \text{SPH}_i, \quad \Delta \text{CYL} = \text{CYL}_{i+1} - \text{CYL}_i$$
5. **Annualized Change Rates**:
   $$\text{Rate}_{\text{SPH}} = \frac{\Delta \text{SPH}}{\Delta t}, \quad \text{Rate}_{\text{CYL}} = \frac{\Delta \text{CYL}}{\Delta t} \quad (\text{Diopters / year})$$
6. **Rule-Based Trend Classification**:
   - $|\text{Avg Rate}| \le 0.10 \text{ D/yr} \implies \textbf{Stable}$
   - $\text{Avg Rate} < -0.10 \text{ D/yr} \implies \textbf{Increasing}$ *(Myopic progression / increasing minus power)*
   - $\text{Avg Rate} > +0.10 \text{ D/yr} \implies \textbf{Decreasing}$ *(Hyperopic shift / reduced minus)*

---

### Q4: How is the Next Checkup Date calculated dynamically?
**Answer**:
The next examination date is **never hard-coded**. It is computed dynamically via `calculate_checkup_recommendation()`:
1. Examines the patient’s historical inter-checkup interval:
   $$\text{Avg Interval} = \frac{\sum \text{Days}(Date_{k+1} - Date_k)}{N - 1}$$
2. Evaluates the magnitude of power change (volatility):
   - Rapid progression ($\ge 0.50 \text{ D/year}$) $\implies$ Recommends early review in **6 months**.
   - Moderate change ($0.25 - 0.50 \text{ D/year}$) $\implies$ Recommends review in **9 months**.
   - Stable vision ($< 0.25 \text{ D/year}$) $\implies$ Recommends routine review in **12 months** (bounded between 10–14 months based on past cadence).
3. Adds the calculated interval to the latest checkup date:
   $$\text{Target Date} = \text{Latest Checkup Date} + (\text{Suggested Months} \times 30.4375 \text{ days})$$
4. Output is formatted as month and year (e.g. `January 2027`) and accompanied by a mandatory clinical disclaimer.

---

### Q5: What Data Structures are utilized, and what are their time complexities?
**Answer**:
1. **Dynamic Arrays / Lists**: Stores prescription and frame records in memory ($O(1)$ amortized append).
2. **Hash Tables / Dictionaries**: Stores structured optical measurements ($O(1)$ average lookup by key).
3. **Two-Pointer Iteration (Sliding Window)**: Traverses consecutive checkups $(i, i+1)$ in $O(N)$ linear time.
4. **Sorting (TimSort)**: Guarantees strict temporal order in $O(N \log N)$ time and $O(N)$ space.
5. Overall algorithmic complexity for analyzing $N$ checkups is $O(N \log N)$ due to date sorting, which is virtually instantaneous for clinical histories ($N < 100$).

---

### Q6: How is Concurrency and Stock Safety handled during Frame Pre-booking?
**Answer**:
To prevent race conditions where two customers reserve the final unit simultaneously:
1. We **do not rely on client-side state** or separate un-isolated check and update statements.
2. In `backend/app/database/connection.py`, the `atomic_prebook()` routine uses an atomic conditional SQL update:
   ```sql
   UPDATE frames
   SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP
   WHERE id = :frame_id AND quantity > 0;
   ```
3. If `cursor.rowcount == 0`, the frame is out of stock. The database rejects the update, rolls back, and returns `400 Bad Request ("Frame is out of stock")`.
4. Only if the decrement succeeds does the system create the row in `reservations`.

---

### Q7: Why does the system not use Machine Learning or AI models?
**Answer**:
1. **Academic Honesty & Determinism**: For a patient with 2 to 5 checkup visits, machine learning models (e.g., neural networks or regression models) would severely overfit and generate clinically reckless, non-reproducible predictions.
2. **Explainability**: Optometrists and patients require clear, explainable reasons for why a checkup interval is recommended. A rule-based algorithm with explicit Diopter thresholds ($0.10, 0.25, 0.50 \text{ D/yr}$) is verifiable, deterministic, and safe.
3. **Medical Disclaimer**: The application clearly displays: *"This is a trend-based estimate and should not be treated as a medical diagnosis."*

---

### Q8: How is the Medical Prescription PDF generated?
**Answer**:
1. The customer clicks **Download Prescription History PDF**.
2. React triggers `GET /api/prescriptions/me/pdf` with the bearer token.
3. FastAPI invokes `backend/app/services/pdf_service.py` powered by **Python ReportLab**.
4. The service constructs a `SimpleDocTemplate` containing:
   - Clinic header and generation timestamp.
   - Patient details (Name, Email, total examinations).
   - A structured clinical table of all checkups sorted **newest to oldest**.
   - Detailed Right (OD) and Left (OS) measurements: SPH, CYL, Axis, PD, and doctor notes.
   - Medical disclaimer footer.
5. The PDF is compiled into an in-memory `io.BytesIO` binary stream and returned as `application/pdf` with a `Content-Disposition: attachment` header, triggering an instant browser file download.
