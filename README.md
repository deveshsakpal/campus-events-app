# Campus Events and Registration System

A full-stack campus event management and student registration platform built with:
- **Backend API:** Kotlin with Spring Boot 4, Gradle, and Spring Security / JWT.
- **Database:** PostgreSQL with JPA / Hibernate.
- **Admin and Teacher Portal:** React 19 with TypeScript, Vite, and React Router.
- **Student Application:** Flutter (Mobile and Web supported).
- **Cloud Deployment:** Render (PostgreSQL database, Spring Boot Docker web service, React static site, and Flutter Web container service).

---

## Architecture and Role Permissions

The system enforces strict role-based access control (RBAC) across three distinct user roles:

| Feature / Action | Student (Flutter App) | Teacher / Faculty (React Portal) | Administrator (React Portal) |
| :--- | :---: | :---: | :---: |
| **Portal / Access** | Flutter Web / Mobile | `/teacher/login` | `/admin/login` |
| **Account Creation** | Self Sign-Up (`/signup`) | Created by Admin | Bootstrapped via Environment Variables |
| **Browse Events** | Yes | Yes | Yes |
| **View Event Details** | Yes | Yes | Yes |
| **Register for Events** | Yes (Database-enforced 1 per event) | No | No |
| **View My Registrations**| Yes | No | No |
| **Create Events** | No | Yes (assigned as creator) | Yes |
| **Edit Events** | No | Only events created by self | Any campus event |
| **Delete Events** | No | Only events created by self | Any campus event (cascades registrations) |
| **Manage Teacher Accounts**| No | No | Yes (create, view, remove teachers) |

---

## Directory Structure

```text
campus-events-app/
├── api/api/                  # Kotlin + Spring Boot Backend API
│   ├── src/main/kotlin/com/campusevents/api/
│   │   ├── auth/             # Authentication controller & DTOs
│   │   ├── common/           # Security, TokenService, Filters, Exceptions
│   │   ├── events/           # Event entity, repository, and controller
│   │   ├── registrations/    # Registration entity, repository, and controller
│   │   ├── users/            # User entity, TeacherController, UserRepository
│   │   └── ApiApplication.kt # Spring Boot main entry
│   ├── src/main/resources/   # application.yaml configuration
│   ├── Dockerfile            # Multi-stage production container
│   └── build.gradle.kts      # Gradle build script
├── admin/                    # React + TypeScript + Vite Admin & Teacher Portal
│   ├── src/
│   │   ├── api/client.ts     # Shared API client and authentication helpers
│   │   ├── features/admin/   # AdminLoginPage, AdminDashboardPage, modals
│   │   ├── features/teacher/ # TeacherLoginPage, TeacherDashboardPage, modals
│   │   ├── features/shared/  # PortalHome, Navbar, ProtectedRoute
│   │   └── App.tsx           # Route definitions
│   └── public/_redirects     # SPA rewrite rule for Render static hosting
├── mobile/                   # Flutter Student Application (Mobile & Web)
│   ├── lib/
│   │   ├── core/             # API client & domain models
│   │   ├── features/student/ # Login, SignUp, Dashboard, EventDetail screens
│   │   └── main.dart         # Flutter application entry
│   ├── Dockerfile            # Container build for Flutter Web
│   └── nginx.conf.template   # Dynamic PORT Nginx configuration
└── render.yaml               # Render Infrastructure Blueprint
```

---

## Local Setup & Quick Start

### Prerequisites
- **Java:** JDK 21
- **Node.js:** v20+ or v22+ (tested on Node v24)
- **PostgreSQL:** Version 14 or higher running on localhost:5432
- **Flutter SDK:** Version 3.24+ (tested on Flutter 3.47 / Dart 3.13)

---

### Step 1: Start PostgreSQL

Create the database locally using `psql` or pgAdmin:

```powershell
psql -U postgres -c "CREATE DATABASE campus_events;"
```

---

### Step 2: Start the Spring Boot API

Open a PowerShell terminal in `api\api`:

```powershell
Set-Location .\api\api

# (Optional) Set custom credentials or admin bootstrap
$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/campus_events"
$env:DATABASE_USERNAME = "postgres"
$env:DATABASE_PASSWORD = "your-postgres-password"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "adminPassword123"
$env:ADMIN_NAME = "Campus Events Admin"

.\gradlew.bat bootRun
```

- API Base URL: `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`

---

### Step 3: Start the React Admin & Teacher Portal

Open a second PowerShell terminal in `admin`:

```powershell
Set-Location .\admin
npm install
npm run dev
```

- Portal Home: `http://localhost:5173`
- Admin Sign In: `http://localhost:5173/admin/login` (Use `admin@example.com` / `adminPassword123`)
- Teacher Sign In: `http://localhost:5173/teacher/login` (Credentials created by Admin)

---

### Step 4: Start the Flutter Student App

Open a third PowerShell terminal in `mobile`:

```powershell
Set-Location .\mobile
flutter pub get

# Run as Flutter Web
flutter run -d chrome --web-port=5000 --dart-define=API_BASE_URL=http://localhost:8080
```

- Student App: `http://localhost:5000`
- Create a student account using the **Create an Account** button.
- Browse campus events, view event details, and register with one click.
- Check the **My Registrations** tab to see all your saved registrations.

---

## Automated Testing

### Backend Spring Boot Tests
To run all unit and multi-role end-to-end integration tests:
```powershell
Set-Location .\api\api
.\gradlew.bat test
```

### React Portal Build Test
To verify TypeScript compilation and bundle generation:
```powershell
Set-Location .\admin
npm run build
```

### Flutter Test Suite & Web Build
To run Flutter widget tests and compile the production web app:
```powershell
Set-Location .\mobile
flutter test
flutter build web --release
```

---

## Deployment to Render

The repository includes a ready-to-deploy **Render Blueprint** (`render.yaml`).

### Deploying via Render Blueprint

1. Push this repository to your GitHub or GitLab account.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your Git repository.
5. Render will automatically detect `render.yaml` and configure:
   - **`campus-events-db`**: PostgreSQL database (Free tier).
   - **`campus-events-api`**: Spring Boot API container service listening on Render's dynamic `$PORT`.
   - **`campus-events-portal`**: React static site for Admin and Teacher management.
   - **`campus-events-student`**: Flutter Web Docker service for students.
6. When prompted in the Render Dashboard, fill in your initial environment variables:
   - `ADMIN_EMAIL`: Your chosen admin email address.
   - `ADMIN_PASSWORD`: A secure admin password (min 8 chars).
   - `VITE_API_BASE_URL`: The public URL of your deployed `campus-events-api` service (e.g. `https://campus-events-api.onrender.com`).
   - `API_BASE_URL`: The public URL of your deployed `campus-events-api` service.
7. Click **Apply**. Render will build and deploy all services with public HTTPS endpoints.
