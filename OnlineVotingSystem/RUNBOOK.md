# OVS — Local run + deployment runbook

One page. Two modes. No surprises.

## Mode A — Hybrid local (recommended for day-to-day dev)

You run **infra in Docker** and **Spring Boot + Vite natively** so hot-reload is instant.

```powershell
# 1. Infra only (Postgres, Keycloak, Prometheus, Loki, Tempo, Alloy, Grafana).
#    The 'app' and 'frontend' services are commented-out / profiled out here.
cd E:\Intellij Java\First Project\online-voting-system
docker compose -f monitoring\docker-compose.yml up -d

# 2. Backend (system Maven; do NOT use mvnw on Windows — rename-tmpdir bug)
cd OnlineVotingSystem\Backend\demo
$env:SPRING_PROFILES_ACTIVE="dev"
mvn spring-boot:run

# 3. Frontend (new PowerShell window)
cd E:\Intellij Java\First Project\online-voting-system\OnlineVotingSystem\Frontend\my-react-app
npm run dev
```

Open:

| What           | URL                                      |
| -------------- | ---------------------------------------- |
| App (Vite dev) | http://localhost:5173                    |
| Backend API    | http://localhost:8080                    |
| Keycloak       | http://localhost:8081                    |
| Grafana        | http://localhost:3000  (admin / admin)   |
| Prometheus     | http://localhost:9090                    |
| Loki           | http://localhost:3100                    |
| Tempo          | http://localhost:3200                    |
| Alloy          | http://localhost:12345                   |
| Postgres       | localhost:5433 (ovsApp / change-this-app-db-password) |

If `8080` is occupied by a stale container, free it:

```powershell
Get-NetTCPConnection -LocalPort 8080 |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Mode B — Full Docker (closer to prod)

```powershell
cd E:\Intellij Java\First Project\online-voting-system
docker compose -f monitoring\docker-compose.yml --profile full up -d --build
```

The frontend is served on `http://localhost` (port 80 via nginx).

## JWT iss — sanity check

Backend must log this at startup:

```
JWT decoder config :: expected issuer = http://localhost:8081/realms/OVS-System
JWT decoder config :: JWKS url       = http://keycloak:8080/realms/OVS-System/protocol/openid-connect/certs (explicit)
```

If you see `The iss claim is not valid`:

1. Paste the token into jwt.io and look at `iss`.
2. It must match `spring.security.oauth2.resourceserver.jwt.issuer-uri` in `application-dev.properties`.
3. In Docker the browser and the app see Keycloak at different hostnames — that's why we split `issuer-uri` (browser view) from `jwk-set-uri` (in-Docker view).

**Prod gotcha:** the prod Keycloak runs with `--http-relative-path=/auth`, so its issuer string is `https://auth.trustvote.live/auth/realms/OVS-System` — note the `/auth` segment. Both `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` and `KEYCLOAK_BASE_URL` in the droplet's `.env` MUST include `/auth`, otherwise every authenticated `/user/me`, `/admin/*`, `/voter/*` request 401s. Local dev does NOT use `/auth` because Keycloak there runs at the root path.

## Email delivery

**OTP (ballot verification):** wired. `OtpMailService` sends a 6-digit code via Gmail SMTP whenever `VerificationService` issues a token. The send is fire-and-forget — if SMTP is misconfigured the verification still completes and the dev `devOtp` field echoes the code in the response so demos keep working.

**Password reset / org-request:** still stubbed. Endpoints log only.

### Step 1 — Generate a Gmail App Password

The Gmail account that will send the OTPs (e.g. `islamshahedul537@gmail.com`) needs:

1. **2-step verification turned on** — Google Account → Security → 2-Step Verification.
2. **App password** — Google Account → Security → 2-Step Verification → App passwords. Pick "Mail" + "Other (TrustVote)" and copy the 16-character code (e.g. `abcd efgh ijkl mnop`).

### Step 2 — Set the env vars before starting Spring Boot

PowerShell, in the same window you'll run `mvn spring-boot:run` from:

```powershell
$env:SMTP_USERNAME = "islamshahedul537@gmail.com"
$env:SMTP_PASSWORD = "abcdefghijklmnop"           # the 16 chars, no spaces
$env:OVS_MAIL_FROM = "islamshahedul537@gmail.com"
# optional once mail is confirmed working:
# $env:OVS_DEV_RETURN_OTP = "false"               # stop echoing OTP in API body
mvn spring-boot:run
```

To make it permanent: Windows Settings → Environment Variables → User variables.

### Step 3 — Confirm it works

Cast a test ballot. In the backend logs you should see:

```
INFO  c.e.demo.Service.OtpMailService - OTP mail sent (recipient redacted, election=...)
```

If you instead see:

```
WARN  c.e.demo.Service.OtpMailService - OTP mail skipped: spring.mail.host not configured.
```

→ the env vars weren't loaded by the JVM. Restart Spring Boot from the same PowerShell session that set them.

```
WARN  c.e.demo.Service.OtpMailService - OTP mail send failed: AuthenticationFailedException ...
```

→ Gmail rejected the credentials. Re-check the app password (no spaces), confirm 2-step is on, and try generating a new app password. Note: regular Gmail passwords will not work — Google requires app passwords for SMTP.

### Optional — Keycloak's own emails

Keycloak handles its own "verify email" / "forgot password" flows. To enable them:

* Admin console → Realm settings → Email → fill in the same SMTP host / port / username / app password.
* Use `PUT /{realm}/users/{id}/execute-actions-email` body `["UPDATE_PASSWORD"]` to trigger a reset link.

This is independent of OVS's `OtpMailService` — both can coexist.

## Observability — what goes where

| Signal      | Source                           | Landing in Grafana |
| ----------- | -------------------------------- | ------------------ |
| HTTP p95    | Spring Actuator → Prometheus     | Service-health dashboard |
| Log stream  | Alloy tails container stdout → Loki | Explore → Loki |
| Traces      | OTel java-agent → OTLP :4318 → Tempo | Explore → Tempo |
| Request ID  | `RequestTimingFilter` → MDC → all three | Forensic widget on SuperHealth (`/superadmin/health`) |

## Error shape

Every error response follows `ApiError`:

```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "…",
  "path": "/admin/election/create",
  "requestId": "req_…",
  "details": [{ "field": "title", "issue": "NotBlank", "message": "must not be blank" }]
}
```

The frontend `ErrorBanner` renders all fields above, including per-field `details`. An uncaught render crash falls back to `ErrorBoundary` (wrap-around in `src/App.jsx`).

## Routes cheat-sheet

```
/                   landing
/signin /signup     auth
/forgot-password    request reset link   (202)
/reset-password     set new password     (expects ?token=…)
/request-org        contact form for new orgs
/verify-receipt     anon merkle verify

/voter/*            protected, role=voter
/admin/*            protected, role=admin
/superadmin/*       protected, role=superadmin
/superadmin/health  observability hub (Grafana + raw data sources)
```
