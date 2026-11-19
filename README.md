# SecureBank – Online Banking System (Academic Demo)

> **ACADEMIC DEMONSTRATION ONLY.** All money is **simulated**. This project is **not connected to any real bank,
> payment network or financial institution**. Do not enter real personal or financial data.

## Structure
```
online-banking-system/
├── backend/    Spring Boot 3.2 (Java 17), Spring Security + JWT, Spring Data JPA, MySQL 8   <-- done
├── database/   schema.sql                                                                   <-- Phase 1 (done)
├── frontend/   React + Vite + React Router + Axios + Chart.js                               <-- done
└── README.md
```

## Run the backend
Prerequisites: JDK 17+, Maven 3.9+, MySQL 8.

1. Create the schema:  `mysql -u root -p < database/schema.sql`
2. Set credentials (or edit `backend/src/main/resources/application.properties`):
   ```
   export DB_USERNAME=root
   export DB_PASSWORD=your_mysql_password
   export JWT_SECRET="a-long-random-string-of-at-least-32-characters"   # optional for local dev
   ```
3. Start: `cd backend && mvn spring-boot:run`  → API on http://localhost:8080

## Run the frontend
Prerequisites: Node.js 18+ and the backend running on port 8080.
```
cd frontend
npm install
npm run dev        # http://localhost:5173  (requests to /api are proxied to http://localhost:8080)
npm run build      # production build in frontend/dist
```
If the API lives elsewhere, copy `.env.example` to `.env` and set `VITE_API_URL`, and add the frontend origin to `CORS_ORIGINS` on the backend.

## Demo logins (LOCAL DEVELOPMENT ONLY – created by `DataSeeder`; disable with `SEED_DEMO_DATA=false`)
| Role     | Email                    | Password       | Simulated balance |
|----------|--------------------------|----------------|-------------------|
| Admin    | admin@securebank.local   | Admin@12345    | –                 |
| Customer | alice@example.com        | Password@123   | 25,000.00         |
| Customer | bob@example.com          | Password@123   | 10,000.00         |

## REST API
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Register; generates a unique 12-digit account number |
| POST | /api/auth/login | public | Customer login → JWT |
| POST | /api/auth/admin/login | public | Admin login → JWT |
| POST | /api/auth/forgot-password | public | Demo stub (no email is sent) |
| GET | /api/dashboard | customer | Balance, totals, recent transactions, 6-month chart data |
| GET | /api/account | customer | Account details |
| GET | /api/account/lookup/{acctNo} | customer | Validate beneficiary (masked name only) |
| POST | /api/transactions/deposit · /withdraw · /transfer | customer | Money operations (atomic) |
| GET | /api/transactions?type&from&to&q&page&size | customer | Search/filter history |
| GET | /api/transactions/export | customer | CSV download (PDF is generated in the frontend) |
| GET/PUT | /api/profile | customer | View / update name, mobile, address |
| PUT | /api/profile/password | customer | Change password |
| GET/POST/DELETE | /api/beneficiaries | customer | Saved beneficiaries |
| GET | /api/admin/summary | admin | Totals, recent activity, bank-wide chart |
| GET | /api/admin/customers?q | admin | List/search customers |
| PATCH | /api/admin/customers/{id}/status | admin | Activate / deactivate `{ "active": true }` |
| GET | /api/admin/transactions | admin | All transaction records |

Errors return `{ timestamp, status, message, fieldErrors }` with proper HTTP codes (400, 401, 403, 404, 409, 422).

## Security design
- **BCrypt (strength 12)** password hashing; plain-text passwords are never stored or logged.
- **JWT (HS256)**, 60-minute expiry, stateless sessions; user state is re-checked per request, so deactivated customers are locked out immediately.
- Role-based routes: `/api/admin/**` → ADMIN only; other `/api/**` → USER only; admin and customer have separate login endpoints.
- **Atomic transfers:** one DB transaction, `SELECT … FOR UPDATE` row locks taken in ascending id order (no deadlocks), balance checked *after* locking.
- **No negative balances:** service-level check **and** DB `CHECK (balance >= 0)`.
- **Duplicate prevention:** optional `idempotencyKey` per request, enforced by a unique `(account_id, idempotency_key)` index.
- Bean Validation on every request body; generic error messages; no stack traces to clients; CORS limited to the frontend origin.
- CSV export guards against spreadsheet formula injection.

## Known limits (intentional for a demo)
No email/SMS (forgot-password is a stub), no login rate limiting, no MFA, no refresh tokens. A production system would need all of these plus audit logging and regulatory controls.

## Status
- **Frontend:** `npm install && npm run build` succeeds (verified).
- **Backend:** Lombok was removed (it failed on newer JDKs); entities now use plain getters/setters. It builds with JDK 17 or newer. If `mvn clean install` still reports errors, send them and they will be fixed.
- Not yet tested end to end (browser to API to MySQL). Suggested first checks: register, log in as alice, transfer to bob, then deactivate bob as admin and confirm bob is locked out.
