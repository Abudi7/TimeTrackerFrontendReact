# ⏱️ TimeTracker (React + Vite + TypeScript) + Node.js + MySQL

A full-stack time tracking application featuring a **React (Vite + TypeScript)** frontend and a **Node.js (Express + TypeScript)** backend with **MySQL** for persistence. Users can **register**, **log in**, **start** and **end** a time session, and view **today's total time**.

> Author: **Abdulrhman Al Shalal**

---

## Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup (Express + TS)](#backend-setup-express--ts)
  - [Environment Variables](#environment-variables)
  - [Install Dependencies](#install-dependencies)
  - [Run the API](#run-the-api)
  - [API Endpoints](#api-endpoints)
- [Database (MySQL) Setup](#database-mysql-setup)
  - [SQL Schema](#sql-schema)
  - [Docker Compose (MySQL + phpMyAdmin)](#docker-compose-mysql--phpmyadmin)
- [Frontend Setup (React + Vite + TS)](#frontend-setup-react--vite--ts)
  - [Environment Variable](#environment-variable)
  - [Install Dependencies](#install-dependencies-1)
  - [Run the Frontend](#run-the-frontend)
- [Testing the API](#testing-the-api)
- [Screens & Features](#screens--features)
- [Notes & Recommendations](#notes--recommendations)
- [License](#license)
- [Credits](#credits)

---

## Architecture
```
root/
  server/                     # Express + TypeScript backend
    src/
      index.ts
      db.ts
      auth.ts
      middleware/authMiddleware.ts
      routes/auth.routes.ts
      routes/time.routes.ts
    .env                      # Backend environment variables
    tsconfig.json
    package.json
  my-app/                     # React + Vite + TypeScript frontend
    src/
      api.ts
      main.tsx
      App.tsx
      pages/LoginRegister.tsx
      components/TimeTracker.tsx
    .env                      # Frontend environment variable (optional)
    package.json
```

---

## Prerequisites
- **Node.js** >= 18
- **npm** (bundled with Node)
- **MySQL 8** (local or via Docker)
- Optional: **Docker Desktop** (to spin up MySQL + phpMyAdmin quickly)
- Optional: **Thunder Client** (VS Code extension) or **Postman** for testing the API

---

## Quick Start

1) **Database**: Create MySQL database `timetrack_db` and run the SQL schema below (see [SQL Schema](#sql-schema)).  
   - Quickest path: use the provided **Docker Compose** to run MySQL & phpMyAdmin.

2) **Backend**:
```bash
cd server
npm i
# run in dev mode (ts-node)
npm run dev
# or build & run
npm run build && npm start
```
The API will be available on **http://localhost:4000**

3) **Frontend**:
```bash
cd my-app
npm i
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## Backend Setup (Express + TS)

### Environment Variables
Create `server/.env`:
```
PORT=4000
JWT_SECRET=supersecret_change_me
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=timetrack_db
```

### Install Dependencies
From `server/`:
```bash
npm i
# If you haven't installed yet:
# npm i express cors jsonwebtoken bcrypt mysql2 dotenv
# npm i -D typescript ts-node @types/express @types/jsonwebtoken @types/cors
```

### Run the API
```bash
# Development (ts-node)
npm run dev

# Production
npm run build
npm start
```

You should see:
```
API on http://localhost:4000
```

### API Endpoints
- `POST /auth/register`  
  **Body (JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "Passw0rd!",
    "fullName": "Test User"
  }
  ```
  **Response:**
  ```json
  { "message": "Registered" }
  ```

- `POST /auth/login`  
  **Body (JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "Passw0rd!"
  }
  ```
  **Response:**
  ```json
  { "token": "eyJhbGciOi..." }
  ```

- `POST /time/start` *(requires Bearer token)*  
  **Headers:** `Authorization: Bearer <JWT>`  
  **Response:**
  ```json
  { "message": "Started" }
  ```

- `POST /time/end` *(requires Bearer token)*  
  **Headers:** `Authorization: Bearer <JWT>`  
  **Response (example):**
  ```json
  { "message": "Stopped", "seconds": 360 }
  ```

- `GET /time/today` *(requires Bearer token)*  
  **Headers:** `Authorization: Bearer <JWT>`  
  **Response:**
  ```json
  { "total_seconds": 360, "running": false }
  ```

---

## Database (MySQL) Setup

### SQL Schema
Run this SQL in your MySQL server (phpMyAdmin → SQL tab, or MySQL CLI, or Workbench):

```sql
CREATE DATABASE IF NOT EXISTS timetrack_db;
USE timetrack_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_time_entries_user_start ON time_entries(user_id, start_at);
```

> All date/time values are stored in MySQL as `DATETIME`. You can change to `TIMESTAMP` or store in UTC and convert on the frontend as needed.

### Docker Compose (MySQL + phpMyAdmin)
Create `docker-compose.yml` at the project root (or inside `server/`) and run:
```yaml
version: "3.9"
services:
  mysql:
    image: mysql:8.0
    container_name: timetrack-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: timetrack_db
      MYSQL_USER: app
      MYSQL_PASSWORD: apppass
    ports:
      - "3306:3306"
    command: ["--default-authentication-plugin=mysql_native_password"]
    volumes:
      - dbdata:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: timetrack-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_USER: root
      PMA_PASSWORD: rootpass
    ports:
      - "8080:80"
    depends_on:
      - mysql

volumes:
  dbdata:
```
Bring services up:
```bash
docker compose up -d
```
- phpMyAdmin: http://localhost:8080  
- MySQL: `localhost:3306` (user: `app`, pass: `apppass`) or root (`root`/`rootpass`)

> Update your backend `.env` to match the credentials you use.

---

## Frontend Setup (React + Vite + TS)

### Environment Variable
Create `my-app/.env` (optional):
```
VITE_API_URL=http://localhost:4000
```

### Install Dependencies
From `my-app/`:
```bash
npm i
npm i axios framer-motion bootstrap
```

### Run the Frontend
```bash
npm run dev
```
Open `http://localhost:5173`

#### Available Screens
- **Login / Register** (single page with tabs)
- **Time Tracker** (start / end session, shows today's total, animated)

---

## Testing the API

### With Thunder Client (VS Code)
1. Install **Thunder Client** extension in VS Code.
2. Create a new **POST** request to `http://localhost:4000/auth/register` with body:
   ```json
   {
     "email": "test@example.com",
     "password": "Passw0rd!",
     "fullName": "Test User"
   }
   ```
3. Log in via `POST /auth/login`, copy the **token**.
4. For protected endpoints (`/time/start`, `/time/end`, `/time/today`), set a header:  
   `Authorization: Bearer <YOUR_TOKEN>`

### With cURL
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Passw0rd!","fullName":"Test User"}'

curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Passw0rd!"}'
# copy token

curl -X POST http://localhost:4000/time/start \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST http://localhost:4000/time/end \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X GET http://localhost:4000/time/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Screens & Features
- **Register** a new account (`email`, `password`, `fullName`).
- **Login** to get a JWT token (stored in LocalStorage and attached to Axios requests).
- **Start/End time** sessions with a single click.
- **Today's total time** calculated on the backend (`/time/today`) including currently running session.
- **UI/UX** styled with **Bootstrap** and animated via **Framer Motion**.

---

## Notes & Recommendations
- For production, set a strong `JWT_SECRET` and consider HTTPS.
- Apply rate-limiting on `/auth/login`.
- Store all date-times in UTC to avoid DST/timezone issues.
- Add monthly reports, CSV export, and a sessions table for history (future enhancement).
- Use Docker in development to keep consistency across environments.

---

## License
MIT

---

## Credits
Built by **Abdulrhman Al Shalal**.
