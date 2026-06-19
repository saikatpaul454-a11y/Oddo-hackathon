# Employee Management System Implementation Plan

This document outlines the step-by-step plan for building the comprehensive **Employee Management System** (EMS) with multi-role dashboards (Employee, HR, Admin), QR Attendance, Face Recognition Attendance, Payroll PDF Generation, and Email Notifications.

## User Review Required

> [!IMPORTANT]
> **Database Configuration**: The project assumes a local MongoDB Compass instance (`mongodb://localhost:27017/employee-management`) or a MongoDB Atlas URI. We will create a `.env` file in the backend to store these secrets.
> 
> **Email Notifications**: For email notifications, we plan to use **Nodemailer** with a mock SMTP service (like Mailtrap) or standard Gmail SMTP. You will need to fill in credentials in `.env` for production use.
> 
> **Face Recognition & QR Attendance Implementation**: 
> - For **Face Recognition**, we will build a high-fidelity scanning interface in the browser using the webcam, showing canvas scan lines and facial markers. We will simulate/implement the verification process to ensure it runs reliably in local browsers without requiring heavy AI model downloads (which often fail due to CORS or slow connections).
> - For **QR Attendance**, the system will generate a dynamic QR code containing a secure token on the HR/Admin dashboard, and the Employee can scan it using their camera (using `html5-qrcode`) to instantly log their check-in/check-out.

## Open Questions

> [!NOTE]
> 1. Do you have a running MongoDB database local connection string we should use? (Default: `mongodb://localhost:27017/ems`)
> 2. For the face recognition, would you prefer an actual model load (like `face-api.js` which requires ~5-10MB of model assets to be served) or a simulated high-fidelity scanner that captures the frame, simulates the neural-net processing animation, and registers/marks attendance? (We recommend a high-fidelity simulation first to avoid model load issues, but can upgrade to face-api.js if needed).
> 3. Should we auto-generate default accounts for testing? (e.g., `admin@ems.com`, `hr@ems.com`, `employee@ems.com` with password `password123`)

---

## Proposed Changes

We will construct the project in the workspace directory: `c:\Users\rauld\OneDrive\Desktop\employemanagement system`.

```
employee-management-system/  (Workspace root)
 ├── backend/
 │    ├── config/
 │    │    └── db.js
 │    ├── controllers/
 │    │    ├── authController.js
 │    │    ├── employeeController.js
 │    │    ├── attendanceController.js
 │    │    ├── leaveController.js
 │    │    └── payrollController.js
 │    ├── models/
 │    │    ├── Employee.js
 │    │    ├── Attendance.js
 │    │    ├── Leave.js
 │    │    └── ActivityLog.js
 │    ├── middleware/
 │    │    ├── authMiddleware.js
 │    │    └── roleMiddleware.js
 │    ├── routes/
 │    │    ├── authRoutes.js
 │    │    ├── employeeRoutes.js
 │    │    ├── attendanceRoutes.js
 │    │    ├── leaveRoutes.js
 │    │    └── payrollRoutes.js
 │    ├── utils/
 │    │    ├── email.js
 │    │    └── pdfGenerator.js
 │    ├── .env
 │    └── server.js
 └── frontend/
      ├── public/
      ├── src/
      │    ├── components/
      │    │    ├── Sidebar.jsx
      │    │    ├── Navbar.jsx
      │    │    ├── StatCard.jsx
      │    │    ├── CalendarView.jsx
      │    │    └── FaceScanner.jsx
      │    ├── pages/
      │    │    ├── Login.jsx
      │    │    ├── ForgotPassword.jsx
      │    │    ├── ResetPassword.jsx
      │    │    ├── Dashboard.jsx
      │    │    ├── EmployeeDashboard.jsx
      │    │    ├── HRDashboard.jsx
      │    │    ├── AdminDashboard.jsx
      │    │    ├── Profile.jsx
      │    │    ├── LeaveManagement.jsx
      │    │    └── AttendanceTracker.jsx
      │    ├── services/
      │    │    ├── api.js
      │    │    ├── authService.js
      │    │    └── dataService.js
      │    ├── context/
      │    │    └── AuthContext.jsx
      │    ├── index.css
      │    ├── App.jsx
      │    └── main.jsx
      ├── tailwind.config.js
      ├── vite.config.js
      └── package.json
```

---

### [Component 1] Backend Setup

#### [NEW] [server.js](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/server.js)
Entry point for the Express backend. Connects to database, configures middleware (CORS, body parser, logging), and registers route handlers.

#### [NEW] [db.js](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/config/db.js)
Database connection setup using Mongoose.

#### [NEW] [Models](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/models/)
- `Employee.js`: Stores user accounts (name, email, password, department, designation, salary, role: admin/hr/employee, facialData, qrToken).
- `Attendance.js`: Logs clock-in, clock-out times, date, and status (Present, Absent, Late, Half-Day).
- `Leave.js`: Tracks leave requests, types (Sick, Casual, Annual), dates, and approval status.
- `ActivityLog.js`: Tracks actions done by users (e.g. HR adding employee, Admin changing settings) for System Auditing.

#### [NEW] [Controllers & Routes](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/controllers/)
- `authController.js`: Registration, Login, Forgot/Reset password flows.
- `employeeController.js`: Profile updates, HR actions (add/update employees), Admin accounts.
- `attendanceController.js`: Clock-in/out, QR-code generator/verifier, Face check-in.
- `leaveController.js`: Apply leaves, retrieve statuses, HR approve/reject.
- `payrollController.js`: Calculate monthly payroll, generate PDF, trigger email receipt.

#### [NEW] [Middleware](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/middleware/)
- `authMiddleware.js`: Verifies the JWT token in HTTP Authorization header.
- `roleMiddleware.js`: Restricts routes to specific roles (e.g. `['hr', 'admin']`).

#### [NEW] [Utilities](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/backend/utils/)
- `email.js`: Integrates Nodemailer for automated triggers.
- `pdfGenerator.js`: Uses `pdfkit` to draw and compile clean, stylized, professional salary slips.

---

### [Component 2] Frontend Setup (Vite + React + Tailwind CSS)

#### [NEW] [Vite Configuration](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/frontend/vite.config.js)
Initialize Vite with React plugin and proxy settings to route `/api` to our backend.

#### [NEW] [Tailwind Configurations](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/frontend/tailwind.config.js)
Setup Tailwind CSS with a modern design palette (deep slate, vibrant indigos, emeralds, and warm amber) and dark mode capabilities.

#### [NEW] [AuthContext.jsx](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/frontend/src/context/AuthContext.jsx)
State provider for holding authenticated user info, token management in `localStorage`, and wrapping navigation route-guards.

#### [NEW] [Dashboard Views](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/frontend/src/pages/)
- **EmployeeDashboard**: Quick check-in/out button, face recognition toggle, QR scanner view, leave status grid, salary slip downloads.
- **HRDashboard**: Employee directory view, leave request pending lists, bulk salary slip generator trigger, manual attendance overrides.
- **AdminDashboard**: Global dashboard showing system metrics, department statistics with Chart.js charts, HR account administration, audit logs.

#### [NEW] [Interactive Modules](file:///c:/Users/rauld/OneDrive/Desktop/employemanagement%20system/frontend/src/components/)
- **FaceScanner.jsx**: Hooks into user webcam, displays custom face grid overlays, visualizes face verification, and invokes attendance check-in.
- **QRScanner.jsx**: Standard camera QR scanner for clock-ins using `html5-qrcode`.
- **PayrollGenerator**: Form to generate salary slips and trigger download.

---

## Verification Plan

### Automated Tests
- Since this is a greenfield project, we will focus on manual and visual validation of all screens first.
- We will add automated unit/integration tests for critical business logic (e.g. JWT auth, Leave status validations) once the baseline code is in place.

### Manual Verification
1. **Database Seed validation**: Run a utility script `node seed.js` to seed accounts of different roles.
2. **Login flow**: Attempt logging in as Admin, HR, and Employee. Verify access tokens and appropriate dashboard routing.
3. **Attendance check**: Use webcam simulation to check-in/out and confirm database records.
4. **Leave Flow**: Apply as employee, check HR panel for request, approve, and check employee panel for updated status.
5. **PDF generation**: Click generate salary slip, check if PDF downloads and contains valid details.
6. **Responsive Layouts**: Validate desktop and mobile displays using Chrome DevTools.
