# InterviewOS AI deployment

The recommended demo deployment uses:

- Neon for managed PostgreSQL
- Render for the Spring Boot API
- Render for the Vinext frontend

This keeps the existing PostgreSQL, JPA, and Flyway implementation. Do not
replace PostgreSQL with MongoDB Atlas.

## 1. Create the Neon database

1. Sign in at <https://console.neon.tech/>.
2. Create a project named `InterviewOS AI`.
3. Choose a region near the Render services, preferably Singapore.
4. Open **Connect** and record the host, database, role, and password.
5. Do not paste the connection password into this repository.

Prepare these Render values from the Neon connection details:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<role>
SPRING_DATASOURCE_PASSWORD=<password>
```

Flyway creates the production schema and seeds all published DSA questions on
the backend's first successful startup. Local users and submissions are not
copied automatically.

## 2. Deploy the Render Blueprint

1. Sign in at <https://dashboard.render.com/> using GitHub.
2. Select **New > Blueprint**.
3. Connect `abhishek-bhat2005/InterviewOS-AI`.
4. Render detects the root `render.yaml` file.
5. Enter the three Neon values above when prompted.
6. Enter `GEMINI_API_KEY` as a Render secret when prompted.
7. Add your email provider's `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and
   verified sender address as `MAIL_FROM`. Keep port `587`, authentication, and
   STARTTLS enabled unless your provider specifies different values.
8. Apply the Blueprint and wait for both services to become live.

The Blueprint creates:

```text
Frontend: https://interviewos-ai-web-ab2005.onrender.com
Backend:  https://interviewos-ai-api-ab2005.onrender.com
Health:   https://interviewos-ai-api-ab2005.onrender.com/actuator/health/readiness
```

If Render requires different service names, update both
`NEXT_PUBLIC_API_BASE_URL` and `CORS_ALLOWED_ORIGINS` to match the assigned
URLs, then redeploy both services.

## 3. Verify production

1. Open the backend health URL and confirm the status is `UP`.
2. Open the frontend URL.
3. Register a new production account.
4. Confirm the 16 seeded questions load.
5. Submit a Java or Python solution.
6. Confirm the attempt appears in submission history.
7. Test Gemini review after the API quota is available.
8. Select **Forgot password?**, request a reset, open the email link, and choose
   a new password. The link expires after 30 minutes and works only once.

## Free-tier limitations

Render free web services sleep after inactivity and can take about a minute to
wake. Neon free compute also scales to zero when idle. These plans are suitable
for a portfolio demo, not a production SLA.

## Existing local data

The local Docker volume remains separate and unchanged. For the first demo
deployment, let Flyway create a clean production database. If local users and
submission history must be transferred later, use `pg_dump` and `pg_restore`
with a private dump file that is never committed to Git.
