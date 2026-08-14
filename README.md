# InterviewOS AI

An AI-assisted technical interview preparation platform combining DSA practice,
code review, mock interviews, resume analysis, progress tracking, and streaks.

This workspace contains the working React/Tailwind application, a Spring Boot
API, and Dockerized PostgreSQL. The frontend uses real JWT authentication,
problem data, starter code, and persistent submission history from the API.

## What is included

- React 19 and TypeScript
- Tailwind CSS 4
- Vinext/Vite development runtime
- Responsive dashboard and navigation
- Coding workspace with interactive test and AI-review states
- Mock interview conversation
- Resume analyzer flow
- Progress analytics and study recommendations
- PostgreSQL 16 through Docker Compose
- Initial relational schema for all planned product modules
- Spring Boot 3 and Java 21 backend under `backend/`
- JWT access tokens with rotating refresh tokens
- Flyway migrations and 16 seeded high-frequency DSA problems
- Problem browsing and authenticated submission-history APIs
- Frontend registration/login with automatic access-token refresh
- Secure email password recovery with expiring, single-use reset links
- Concept-first practice selection with ranked interview questions
- Gemini-powered structured code assessment

## Requirements

- Node.js 22.13 or newer
- npm
- Docker Desktop
- VS Code

## Open and run in VS Code

1. Extract `InterviewOS-AI.zip`.
2. Open VS Code.
3. Select **File → Open Folder** and choose `InterviewOS-AI`.
4. Open the integrated terminal.
5. Install dependencies:

   ```bash
   npm install
   ```

6. Start PostgreSQL and the backend:

   ```bash
   docker compose up -d postgres backend
   ```

7. Start the frontend:

   ```bash
   npm run dev
   ```

8. Open the local URL printed in the terminal, normally
   `http://localhost:5173`.

## Database

Docker Compose creates:

- Database: `interviewos`
- Development user: `interviewos`
- Development password: `interviewos_dev`
- Port: `5432`

The schema at `database/schema.sql` is automatically applied the first time the
PostgreSQL volume is created. Flyway baselines an existing initialized database
without replacing it, then applies additive backend migrations.

Open a PostgreSQL console:

```bash
docker compose exec postgres psql -U interviewos -d interviewos
```

List tables:

```sql
\dt
```

Stop the database without deleting its data:

```bash
docker compose down
```

To deliberately delete and recreate the local development database:

```bash
docker compose down -v
docker compose up -d postgres
```

## Environment configuration

Copy `.env.example` to `.env` for local development. Never commit real API keys
or production passwords.

## Deployment

Use the Neon PostgreSQL and Render deployment guide in `DEPLOYMENT.md`. The
included `render.yaml` creates the frontend and backend services while keeping
all database credentials and API keys in the hosting dashboard.

## Backend API

Run locally with Maven when PostgreSQL is already available:

```bash
cd backend
mvn spring-boot:run
```

Key endpoints:

- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/auth/refresh`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/problems`, `GET /api/problems/{slug}`
- `POST /api/problems/{problemId}/submissions`
- `POST /api/problems/{problemId}/review`
- `POST /api/interviews/start`, `POST /api/interviews/respond`
- `GET /api/submissions`, `GET /api/submissions/{submissionId}`
- `GET /actuator/health`

Problem reads are public. User/profile and submission endpoints require an
`Authorization: Bearer <access-token>` header. The frontend API base URL is
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api`.

Gemini powers code assessment and adaptive mock-interview replies. Judge0
execution and resume parsing remain future integrations; new submissions are
persisted with `QUEUED` status for a future judge worker.
