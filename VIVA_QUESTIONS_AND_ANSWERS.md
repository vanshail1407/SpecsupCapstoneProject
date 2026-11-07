# SpecsUp - Capstone Defense & Viva Preparation Guide

This document prepares students to answer technical, algorithmic, and architectural questions from professors and external examiners during the project defense.

---

### Q1: What is the core architecture of SpecsUp, and how does data flow between tiers?
**Answer**:
SpecsUp is architected as a decoupled 3-tier client-server application:
1. **Presentation Layer (React + Vite)**: Renders the UI and handles route protection. User actions call the Express REST API with a bearer JWT.
2. **Application & Business Logic Layer (Express.js + Node.js)**: Validates requests, authenticates users and roles, coordinates database operations, and runs trend and recommendation logic.
3. **Data Tier (MongoDB)**: Mongoose models store users, frames, reservations, and prescriptions.

---

### Q2: How did you implement JWT authentication?
**Answer**:
1. Passwords are hashed with bcrypt before storage.
2. On login, the backend verifies the password and issues a signed JWT.
  3. Every subsequent API request passes `Authorization: Bearer <token>`.
4. Express middleware verifies the token and restricts admin endpoints to users with the admin role.
5. A customer trying to execute admin endpoints receives a `403 Forbidden` response.

---

### Q3: Explain the Prescription Trend Analysis Algorithm in detail.
**Answer**:
Located in `backend/utils/prescriptionAnalysis.js`:
1. **Chronological Sorting**: Orders prescriptions ascending by `checkup_date` with JavaScript array sorting.
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
4. **Sorting**: Sorts records by date before the linear pass through consecutive checkups.
5. Overall algorithmic complexity for analyzing $N$ checkups is $O(N \log N)$ due to date sorting, which is virtually instantaneous for clinical histories ($N < 100$).

---

### Q6: How is Concurrency and Stock Safety handled during Frame Pre-booking?
**Answer**:
To prevent race conditions where two customers reserve the final unit simultaneously:
1. We **do not rely on client-side state** or separate un-isolated check and update statements.
2. In `backend/controllers/reservationController.js`, `findOneAndUpdate()` decrements stock only when the frame's quantity is greater than zero.
3. If no frame matches, the backend checks whether the frame is missing or out of stock and returns the appropriate error.
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
3. Express invokes `backend/utils/pdfGenerator.js`, powered by **PDFKit**.
4. The service creates a PDF containing:
   - Clinic header and generation timestamp.
   - Patient details (Name, Email, total examinations).
   - A structured clinical table of all checkups sorted **newest to oldest**.
   - Detailed Right (OD) and Left (OS) measurements: SPH, CYL, Axis, PD, and doctor notes.
   - Medical disclaimer footer.
5. The PDF is streamed as `application/pdf` with a `Content-Disposition: attachment` header, triggering a browser download.
