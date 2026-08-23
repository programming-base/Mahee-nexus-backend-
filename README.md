# Mahee Nexus — Backend API

REST API for the Mahee Nexus managed staffing platform. Built with Node.js, Express, and PostgreSQL (Supabase).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express 5 |
| Database | PostgreSQL via Supabase |
| ORM | None — raw parameterized SQL (`pg`) |
| Auth | JWT in HTTP-only cookies |
| File Storage | Supabase Storage |
| Validation | Joi |
| Process Manager | PM2 |

---

## Project Structure

```
backend/
├── app.js                  # Express app setup, middleware, route mounting
├── server.js               # HTTP server entry point
├── pm2.config.js           # PM2 process manager config
│
├── config/
│   ├── db.js               # PostgreSQL pool (pg)
│   ├── supabase.js         # Supabase Storage client (lazy init)
│   └── env.js              # Environment variable validation
│
├── middleware/
│   ├── authenticate.js     # JWT verification → req.user
│   ├── authorize.js        # Role guard factory
│   ├── validate.js         # Joi schema validation
│   ├── upload.js           # Multer: resume (PDF/250KB) + logo (img/300KB)
│   ├── rateLimiter.js      # Auth rate limiting (10 req/15min)
│   └── errorHandler.js     # Centralized error handler
│
├── routes/
│   ├── auth.routes.js
│   ├── jobs.routes.js
│   ├── jobseekers.routes.js
│   ├── employers.routes.js
│   └── admin.routes.js
│
├── controllers/            # HTTP layer — parse request, call service, send response
│   ├── auth.controller.js
│   ├── jobs.controller.js
│   ├── jobseeker.controller.js
│   ├── employer.controller.js
│   └── admin.controller.js
│
├── services/               # Business logic — transactions, calculations, rules
│   ├── auth.service.js
│   ├── job.service.js
│   ├── application.service.js
│   ├── assignment.service.js
│   ├── attendance.service.js
│   ├── invoice.service.js
│   ├── payroll.service.js
│   ├── messaging.service.js
│   ├── storage.service.js
│   └── audit.service.js
│
├── repositories/           # Raw SQL queries — no business logic
│   ├── user.repository.js
│   ├── profile.repository.js
│   ├── job.repository.js
│   ├── application.repository.js
│   ├── assignment.repository.js
│   ├── attendance.repository.js
│   ├── invoice.repository.js
│   ├── payroll.repository.js
│   ├── message.repository.js
│   └── audit.repository.js
│
├── validators/             # Joi schemas
│   ├── auth.validator.js
│   ├── job.validator.js
│   ├── profile.validator.js
│   ├── attendance.validator.js
│   ├── admin.validator.js
│   └── message.validator.js
│
├── utils/
│   ├── jwt.js              # signToken / verifyToken
│   ├── password.js         # hashPassword / comparePassword
│   ├── pagination.js       # parsePagination / buildPaginationMeta
│   ├── response.js         # success / successList / error helpers
│   └── constants.js        # Status enums, audit actions, business defaults
│
├── database/
│   └── schema.sql          # Full PostgreSQL schema — run in Supabase SQL Editor
│
├── tests/
│   └── db.test.js          # Database connectivity tests
│
├── logs/                   # PM2 log output (git-ignored)
├── .env                    # Local environment variables (git-ignored)
├── .env.example            # Environment variable template
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A [Supabase](https://supabase.com) project with:
  - PostgreSQL database
  - Two storage buckets: `resumes` and `logos` (set to public)

### 1. Clone and install

```bash
git clone https://github.com/programming-base/Mahee-nexus-backend-.git
cd backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>

CLIENT_URL=http://localhost:3000
```

### 3. Run the database schema

Open [Supabase SQL Editor](https://supabase.com/dashboard), paste the contents of `database/schema.sql`, and click **Run**.

This creates all 15 tables with indexes, foreign keys, and the unique constraints required by the business rules.

### 4. Create Supabase Storage buckets

In Supabase Dashboard → Storage, create two **public** buckets:
- `resumes`
- `logos`

### 5. Start the server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

### 6. Verify the database connection

```bash
npm test
```

Expected output:
```
Mahee Nexus — Database Tests

  [ RUN ] Basic connection (SELECT 1) ... PASS
  [ RUN ] Users table exists and is queryable ... PASS

  Results: 2 passed, 0 failed
```

---

## API Overview

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register (job_seeker / employer) |
| POST | `/auth/login` | Login — returns JWT cookie |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Current user info |
| POST | `/auth/role` | Select active role (dual-role users) |

### Public Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobs` | List approved jobs (keyword, location, pagination) |
| GET | `/jobs/:jobId` | Job details |
| POST | `/jobs/:jobId/applications` | Apply (job_seeker) |
| POST | `/jobs/:jobId/save` | Save job (job_seeker) |
| DELETE | `/jobs/:jobId/save` | Unsave job (job_seeker) |

### Job Seeker

All routes require `activeRole = job_seeker`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobseeker/dashboard` | Dashboard summary |
| GET/PUT | `/jobseeker/profile` | View / update profile |
| POST | `/jobseeker/profile/resume` | Upload resume (PDF, max 250KB) |
| GET | `/jobseeker/applications` | My applications |
| GET | `/jobseeker/assignments` | My assignments |
| GET/POST | `/jobseeker/attendance` | View / log attendance |
| GET | `/jobseeker/payroll` | Payroll records |
| GET/POST | `/jobseeker/messages` | Support messages |

### Employer

All routes require `activeRole = employer`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/employer/dashboard` | Dashboard summary |
| GET/PUT | `/employer/profile` | View / update profile + company |
| POST | `/employer/profile/logo` | Upload company logo (max 300KB) |
| GET/POST | `/employer/jobs` | List / create jobs |
| GET/PUT | `/employer/jobs/:jobId` | View / update job |
| GET | `/employer/assignments` | Assigned employees |
| GET | `/employer/invoices` | Invoice list |
| POST | `/employer/invoices/:invoiceId/pay` | Mark invoice paid |
| GET/POST | `/employer/messages` | Support messages |

### Admin

All routes require `activeRole = super_admin`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Stats + recent audit log |
| GET | `/admin/employers` | Employer profiles |
| PATCH | `/admin/employers/:profileId/status` | Verify / reject employer |
| GET | `/admin/jobseekers` | Job seeker profiles |
| PATCH | `/admin/jobseekers/:profileId/status` | Verify / reject job seeker |
| GET | `/admin/jobs` | Jobs pending approval |
| PATCH | `/admin/jobs/:jobId/status` | Approve / reject job |
| GET | `/admin/applications` | All applications |
| PATCH | `/admin/applications/:applicationId/review` | Shortlist / reject |
| POST | `/admin/applications/:applicationId/assign` | Assign candidate |
| GET | `/admin/assignments` | All assignments |
| POST | `/admin/assignments/:assignmentId/invoice` | Generate invoice |
| POST | `/admin/assignments/:assignmentId/payroll` | Process payroll |
| GET | `/admin/messages/conversations` | Support inbox |
| GET/POST | `/admin/messages/:userId` | View / reply to conversation |

---

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

**List with pagination:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "A valid email address is required" }
  ]
}
```

---

## Key Business Rules

1. An employer must have a company profile before posting a job.
2. Every new job starts with `approval_status = pending_approval` — the client cannot override this.
3. Only `status = open` AND `approval_status = approved` jobs appear in the public list.
4. A job seeker must upload a resume before applying.
5. Duplicate applications are blocked at both the API and database level.
6. The assign-candidate operation runs in a single DB transaction (update application + insert assignment + insert audit log).
7. Invoice amount = `monthly_salary × 1.25`. Fallback salary = 3500 when not set.
8. Payroll amount = `monthly_salary`. Pay period = today − 30 days → today.
9. Duplicate attendance entries are blocked at both the API and database level.
10. Every admin state-change writes an `audit_logs` row.

---

## Production Deployment

```bash
# Install production dependencies only
npm install --omit=dev

# Start with PM2
pm2 start pm2.config.js --env production

# Persist across server reboots
pm2 save
pm2 startup
```

### Environment checklist before going live

- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (64+ random bytes)
- [ ] `DATABASE_URL` points to production database
- [ ] `CLIENT_URL` set to your production frontend domain
- [ ] Supabase RLS policies reviewed
- [ ] `resumes` and `logos` storage buckets created

---

## Health Check

```
GET /health
```

Returns `200 OK` if the server is running:

```json
{ "status": "ok", "message": "Mahee Nexus API is running" }
```
