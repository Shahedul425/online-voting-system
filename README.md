# TrustVote — verifiable online voting for organisations

![CI](https://github.com/Shahedul425/online-voting-system/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/Shahedul425/online-voting-system/branch/main/graph/badge.svg)](https://codecov.io/gh/Shahedul425/online-voting-system)
![Tests](https://img.shields.io/badge/tests-79%20passing-brightgreen)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)](#)
[![Java](https://img.shields.io/badge/Java-21-007396?logo=java&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](#)
[![Keycloak](https://img.shields.io/badge/Keycloak-24-4D4D4D?logo=keycloak&logoColor=white)](#)
[![Grafana](https://img.shields.io/badge/Grafana-LGTM-F46800?logo=grafana&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](#)

> **A final-year capstone building an end-to-end-verifiable, multi-tenant online voting platform.**
> Anonymous ballots. Atomic commits. Per-election Merkle proofs. Three-pillar observability. Real OTP email delivery.

---

## Try it in 60 seconds

| Role            | Email                          | Password   | Lands on                     |
| --------------- | ------------------------------ | ---------- | ---------------------------- |
| **Super admin** | `islamshahedul537@gmail.com`   | `12345678` | `/superadmin/dashboard`      |
| **Org admin**   | `example123@lsbu.ac.uk`        | `12345678` | `/admin/dashboard`           |
| **Voter**       | `abid11@lsbu.ac.uk`            | `12345678` | `/voter/dashboard`           |

The interactive walkthrough lives at **`/demo`** (linked from the public nav). Sandbox accounts only — no real personal data.

---

## What it is

TrustVote is an **end-to-end verifiable** voting system. Every ballot cast is hashed into a per-election Merkle tree; voters receive a receipt token by email after submitting and can publicly verify their ballot was counted at any time, **without revealing how they voted**. Identity and ballot live in different tables joined by nothing — re-identification is structurally impossible, not policy-impossible.

The project doubles as a portfolio piece: it includes JWT authentication via Keycloak, Spring Batch CSV imports, the full LGTM observability stack (Loki + Grafana + Tempo + Prometheus), a multi-tenant org model, and a custom React 18 / Tailwind UI.

## Architecture

```
                 ┌──────────────────────────────────────────────┐
                 │              Frontend (Vite + React)         │
                 │   /            /how-it-works    /features    │
                 │   /signup      /signin          /demo        │
                 │   /verify-receipt                            │
                 │   /voter/*  /admin/*  /superadmin/*          │
                 └───────────┬──────────────────┬───────────────┘
                             │ JSON over HTTPS  │
                             │   Bearer JWT     │
                             ▼                  ▼
              ┌──────────────────────┐    ┌──────────────────┐
              │  Spring Boot 3.5     │    │   Keycloak 24    │
              │  REST API + JPA      │◄───┤  OIDC / JWT      │
              │  Spring Batch CSV    │    │  Realm:OVS-System│
              │  OtpMailService SMTP │    └──────────────────┘
              │  Merkle tree publish │
              └────────┬─────────────┘
                       │
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
    ┌─────────┐  ┌──────────┐  ┌────────────────┐
    │Postgres │  │   SMTP   │  │  Observability │
    │ ovsApp  │  │ Gmail    │  │  Loki / Tempo  │
    │ schema  │  │ App PWD  │  │  Prometheus    │
    └─────────┘  └──────────┘  │  Grafana via   │
                               │  Alloy         │
                               └────────────────┘
```

## Feature highlights

| | |
|---|---|
| **Anonymous ballots** | Voter row and ballot row share no foreign key. The audit log proves every transition without ever joining identity to vote. |
| **Atomic commit** | One database transaction: consume token → insert anonymised vote → write audit row. If anything fails the whole thing rolls back. |
| **Per-election Merkle tree** | Ballots are hashed into a leaf-indexed Merkle tree at publish time. The root is anchored on the election row; voters verify inclusion against a public endpoint. |
| **Real OTP email** | Spring Boot wired to Gmail SMTP via `OtpMailService`. 6-digit code, 10-minute expiry, single-use. Receipts also delivered by email after voting. |
| **Multi-tenant** | Each organisation gets isolated voter rolls + elections. Super admins onboard tenants by allowed email domains; admins can only act inside their own org. |
| **Spring Batch CSV import** | Voter and candidate lists ingested row-by-row with per-row validation and an importable error file. |
| **Three-pillar observability** | Every HTTP request has a `requestId` propagated through MDC → Loki → Tempo → Prometheus. Forensic widget on `/superadmin/health` traces a single request across all three. |
| **Public verifier** | `/verify-receipt` is unauthenticated. Paste any receipt token; the Merkle proof renders client-side. |
| **In-app confirmations** | Custom `ConfirmModal` and `ErrorBanner` primitives — no native `window.confirm` anywhere. |
| **Dark / light theme** | CSS-variable token system with persisted preference. |

## Tech stack

| Layer            | Technology                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Frontend         | React 18 · Vite · React Router · Tailwind · Lucide · Recharts                            |
| Backend          | Spring Boot 3.5 · Java 21 · Spring Security (JWT resource server) · Spring Data JPA · Spring Batch · Spring Mail |
| Auth             | Keycloak 24 (OIDC, realm-roles)                                                           |
| Data             | PostgreSQL 16 · Hibernate · Merkle leaf-index repo                                        |
| Observability    | Prometheus · Loki · Tempo · Grafana · Grafana Alloy                                       |
| Infra            | Docker Compose · GitHub Actions · DigitalOcean droplet                                    |
| Tests            | JUnit 5 · Mockito · Testcontainers · Spring Boot Test · JaCoCo                            |

## Repository layout

```
online-voting-system/
├── README.md                            ← you are here
├── docker-compose.prod.yml              ← prod stack (postgres + keycloak + app + nginx)
├── monitoring/                          ← Loki / Tempo / Prometheus / Grafana / Alloy configs
└── OnlineVotingSystem/
    ├── RUNBOOK.md                       ← run commands, JWT debug, email setup
    ├── Backend/demo/                    ← Spring Boot app
    │   ├── pom.xml
    │   └── src/main/java/com/example/demo/
    │       ├── authcontroller/          ← /public/auth/*
    │       ├── RestController/          ← /admin/*, /voter/*, /superadmin/*
    │       ├── Service/                 ← business logic, mail, merkle, audit
    │       ├── Models/                  ← JPA entities
    │       ├── DAO/                     ← request DTOs
    │       └── DTO/                     ← response DTOs
    └── Frontend/my-react-app/           ← React app
        └── src/
            ├── pages/{public,voter,admin,super}/
            ├── ui/                      ← AppShell, PublicShell, Primitives, Icon
            ├── Service/Api/             ← endpoints.js + apiUnwrap
            └── styles/                  ← tokens.css (design system)
```

## Local development (hybrid mode — recommended)

You run **infra in Docker** and **Spring Boot + Vite natively** so hot-reload is instant.

```powershell
# 1. Infra only — Postgres, Keycloak, Loki, Tempo, Prometheus, Grafana
cd online-voting-system
docker compose -f monitoring\docker-compose.yml up -d

# 2. Backend
cd OnlineVotingSystem\Backend\demo
$env:SPRING_PROFILES_ACTIVE = "dev"
$env:SMTP_USERNAME = "islamshahedul537@gmail.com"
$env:SMTP_PASSWORD = "<gmail-app-password-no-spaces>"   # see RUNBOOK.md
$env:OVS_MAIL_FROM = "islamshahedul537@gmail.com"
mvn spring-boot:run

# 3. Frontend (separate terminal)
cd OnlineVotingSystem\Frontend\my-react-app
npm install
npm run dev
```

| Service        | URL                                |
| -------------- | ---------------------------------- |
| App (Vite)     | <http://localhost:5173>            |
| Backend API    | <http://localhost:8080>            |
| Keycloak       | <http://localhost:8081>            |
| Grafana        | <http://localhost:3000> (admin/admin) |
| Prometheus     | <http://localhost:9090>            |
| Loki           | <http://localhost:3100>            |
| Tempo          | <http://localhost:3200>            |

Setup notes — Gmail App Password walkthrough, JWT issuer-mismatch debugging, SMTP troubleshooting, Keycloak realm import — live in [`OnlineVotingSystem/RUNBOOK.md`](./OnlineVotingSystem/RUNBOOK.md).

## Production / deployment

`docker-compose.prod.yml` at the repo root brings up the whole stack on a single host:

- `app_db` — Postgres for the OVS schema
- `keycloak_db` — Postgres for Keycloak's own state
- `keycloak` — auth provider, exposed at `https://auth.trustvote.live/auth`
- `app` — Spring Boot backend
- `frontend` — nginx serving the built Vite bundle
- Monitoring stack is opt-in via the `monitoring/` profile.

```bash
cp .env.example .env             # fill in DB passwords + Gmail App Password
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Continuous deployment

A GitHub Actions workflow at `.github/workflows/main.yml` builds and pushes images on every push to `main`, then SSHes into the DigitalOcean droplet to roll the stack.

```
build-backend  ─┐
                ├─► push to registry ─► ssh deploy ─► docker compose up -d ─► healthcheck /actuator/health
build-frontend ─┘
```

Required repo secrets:

| Secret name                | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `REGISTRY_USERNAME`        | container registry username                    |
| `REGISTRY_PASSWORD`        | container registry password / token            |
| `DROPLET_HOST`             | DigitalOcean droplet IP / DNS                  |
| `DROPLET_USER`             | ssh user (typically `root` or `deploy`)        |
| `DROPLET_SSH_KEY`          | private SSH key for deploy                     |
| `POSTGRES_PASSWORD`        | OVS DB password                                |
| `KEYCLOAK_DB_PASSWORD`     | Keycloak DB password                           |
| `KEYCLOAK_ADMIN_PASSWORD`  | Keycloak admin user password                   |
| `RECEIPT_TOKEN_SECRET`     | HMAC secret for receipt tokens                 |
| `SMTP_USERNAME`            | Gmail address sending OTPs                     |
| `SMTP_PASSWORD`            | Gmail App Password (16 chars, no spaces)       |

## Screens (for the impatient reviewer)

- **Demo page** at `/demo` — credentials + 5-step walkthrough.
- **Org admin workspace** at `/admin/elections/:id` — step-by-step lifecycle panel: upload voters → upload candidates → start → close → publish.
- **Voter ballot** at `/voter/ballot/:id` — anonymous selection grid, OTP modal, in-app confirm dialogs.
- **Public verifier** at `/verify-receipt` — paste a receipt token, see the Merkle proof + leaf hash + canonical root.
- **Super admin** at `/superadmin/dashboard` — orgs, admin counts, per-org drill-down with admin roster.
- **Platform health** at `/superadmin/health` — embedded Grafana with the LGTM stack and a request-id forensic widget.

## Test coverage

Backend unit + integration tests run against Testcontainers'd Postgres. JaCoCo emits a merged report under `target/site/jacoco/`. Run with:

```bash
cd OnlineVotingSystem/Backend/demo
mvn verify
```

## License

This is a final-year capstone project. Code is shared for portfolio review; please contact the author before reusing in production.

— **Md Shahedul Islam** · BSc Computer Science final year · 2026
