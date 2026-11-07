# SpecsUp

SpecsUp is an optical-shop management and vision-history application. Customers can browse and reserve frames, review prescription history, see prescription-based frame recommendations, and track vision trends. Shop admins manage inventory, customers, prescriptions, and reservations.

## Technology

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (local or MongoDB Atlas)
- **Authentication:** JWT with bcrypt-hashed passwords
- **Prescription PDFs:** PDFKit

## Features

### Customers

- Browse in-store eyewear and see current stock.
- Get frame recommendations based on prescription and frame measurements.
- Pre-book in-stock frames.
- View prescription history, trend analysis, and recommended checkup timing.
- Download prescription history as a PDF.
- Manage profile details and view reservations.

### Shop administrators

- Create, update, and remove frame inventory.
- View customers and their prescription histories.
- Add customer prescriptions.
- Track customer frame reservations.

## Requirements

- Node.js 20.19+ or 22.12+ and npm (required by the frontend build tooling).
- A MongoDB database: a local MongoDB server or an Atlas cluster.

## Setup

### 1. Install dependencies

Run these commands from the repository root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

The first command installs the root development tool used to run both apps together. The other commands install each app's dependencies.

### 2. Configure MongoDB

Create `backend/.env` (do not commit this file) and set your database connection and a private JWT secret:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/specsup
JWT_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGO_URI` with the connection string from **Atlas → Connect → Drivers**. Add your current public IP under **Security → Network Access** and ensure the cluster is running. URL-encode special characters in the database user's password. Never commit or share the connection string or JWT secret.

### 3. Add demo data (optional)

From the repository root:

```bash
npm run data:import --prefix backend
```

The import adds missing demo records and does not clear existing collections. It creates demo accounts, frames, prescriptions, and a sample reservation. MongoDB must be reachable before this command can complete.

### 4. Start the application

From the repository root:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend health endpoint: <http://localhost:8000/api/health>

Stop both development servers with `Ctrl+C`.

## Demo accounts

These accounts are created by the optional seed command:

| Role | Email | Password | Sample data |
| --- | --- | --- | --- |
| Admin | `admin@specsup.com` | `admin123` | Inventory, customer, and reservation management |
| Customer | `rahul@gmail.com` | `password123` | Three prescriptions showing increasing myopia |
| Customer | `ananya@gmail.com` | `password123` | Three prescriptions with stable measurements |
| Customer | `vikram@gmail.com` | `password123` | One baseline prescription |
| Customer | `neha@gmail.com` | `password123` | Three prescriptions showing a reducing minus prescription |

These are development-only credentials. Do not use them in a public deployment.

## Tests and checks

Run the backend test suite:

```bash
npm test --prefix backend
```

Build and lint the frontend:

```bash
npm run build --prefix frontend
npm run lint --prefix frontend
```

## Project layout

```text
backend/
  config/          MongoDB connection
  controllers/     API request handlers
  middleware/      Authentication, authorization, and error handling
  models/          Mongoose schemas
  routes/          Express API routes
  utils/           Prescription, recommendation, and PDF logic
  seeder.js        Idempotent demo-data import
  server.js        Express app and HTTP server
  test_backend.js  Backend tests
frontend/
  src/
    components/    Shared UI components
    context/       Authentication state
    pages/         Customer and admin screens
package.json       Root scripts for running both apps
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guidance. The frontend and Express backend are deployed separately; configure `VITE_API_BASE_URL` to point the deployed frontend at the backend.
