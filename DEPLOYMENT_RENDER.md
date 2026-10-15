# TradeMind AI - Production Deployment Guide on Render

## Architecture Overview

```
+-------------------------------------------------------+
|                 USER BROWSER / CLIENT                 |
+-------------------------------------------------------+
                           |
            HTTPS Requests | Assets & Static Pages
                           v
+-------------------------------------------------------+
|           FRONTEND (Render Static Site)               |
|  - URL: https://trademind-ai-frontend.onrender.com    |
|  - Built with: React 19 + Vite + Recharts             |
|  - SPA Routing: Rewrite /* -> /index.html             |
|  - Configured with: VITE_API_URL                      |
+-------------------------------------------------------+
                           |
       REST API Calls via  | HTTPS / JSON (Bearer JWT)
                           v
+-------------------------------------------------------+
|             BACKEND (Render Web Service)              |
|  - URL: https://trademind-ai-backend.onrender.com     |
|  - Runtime: Python 3.11 (FastAPI + Uvicorn)          |
|  - Start Command: uvicorn app.main:app                |
|  - Real-time Market Data: yfinance (25 Equities)      |
|  - ML Signal Engine: Scikit-learn Random Forest       |
|  - Health Endpoint: /health & /api/health             |
+-------------------------------------------------------+
                           |
              AsyncIO Motor| mongodb+srv://... (TLS 1.2+)
                           v
+-------------------------------------------------------+
|             DATABASE (MongoDB Atlas M0 Free)          |
|  - Managed Cluster: AWS / GCP                         |
|  - IP Whitelist: 0.0.0.0/0 (Render dynamic IPs)       |
|  - Collections: users, trades, holdings, backtests,   |
|                 signals, predictions, alerts, chat    |
+-------------------------------------------------------+
```

---

## Part 1: Set Up Free MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in / sign up.
2. Click **Create Deployment** -> Select **M0 Free Tier** (Shared, $0/month).
3. Under **Security Quickstart**:
   - Create a database user (e.g. `trademind_admin`) with a secure password. *(Note down the password!)*
4. Under **Network Access**:
   - Click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm. *(Render uses dynamic outbound IP addresses, so `0.0.0.0/0` is required).*
5. Click **Connect** -> Choose **Drivers (Python)**.
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://trademind_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
7. Replace `<password>` with your database user password and append `/trademind_ai` before the `?` query string:
   ```
   mongodb+srv://trademind_admin:YOUR_PASSWORD@cluster0.abcde.mongodb.net/trademind_ai?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## Part 2: Deployment via Render Blueprint (Recommended)

Both the root repository and the `TradeMind-AI/` directory contain pre-configured `render.yaml` blueprints.

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure TradeMind AI for Render production deployment"
   git push origin main
   ```
2. Log into the [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> Select **Blueprint**.
4. Connect your GitHub repository (`yashwanthgowda-portfolio`).
5. Render will detect `render.yaml` and parse:
   - **trademind-ai-backend** (Python Web Service)
   - **trademind-ai-frontend** (Static Site with SPA rewrite rules)
6. Under **Environment Variables**, fill in:
   - `MONGODB_URL`: Paste your MongoDB Atlas connection string.
7. Click **Apply**.
8. Once the backend is deployed, note its URL (e.g., `https://trademind-ai-backend.onrender.com`).
9. Update the frontend environment variable:
   - `VITE_API_URL` = `https://trademind-ai-backend.onrender.com`
10. Trigger a manual deploy of the frontend so Vite builds with the backend URL.

---

## Part 3: Manual Deployment on Render Dashboard (Alternative)

If you prefer deploying services manually without the Blueprint:

### A. Deploy Backend (FastAPI Web Service)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the following parameters:
   - **Name**: `trademind-ai-backend`
   - **Language**: `Python`
   - **Branch**: `main`
   - **Root Directory**: `TradeMind-AI/backend`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `DATABASE_NAME`: `trademind_ai`
   - `MONGODB_URL`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/trademind_ai?retryWrites=true&w=majority`
   - `JWT_SECRET`: *(Click Generate or paste a random 64-char string)*
   - `CORS_ORIGINS`: `https://trademind-ai-frontend.onrender.com,http://localhost:5173`
   - `ENVIRONMENT`: `production`
5. Click **Create Web Service**. Wait for the build to finish and verify `https://<backend-url>/health` returns `{"status":"healthy"}`.

### B. Deploy Frontend (React Static Site)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same repository.
3. Configure the following parameters:
   - **Name**: `trademind-ai-frontend`
   - **Branch**: `main`
   - **Root Directory**: `TradeMind-AI/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://<your-backend-service-name>.onrender.com`
5. Under **Redirects/Rewrites**:
   - Click **Add Rule**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## Part 4: Production Verification Checklist

- [ ] **Backend Health Check**: Visit `https://<backend-service>.onrender.com/health` -> verify database ping is `healthy`.
- [ ] **API Documentation**: Visit `https://<backend-service>.onrender.com/docs` -> interactive Swagger UI is functional.
- [ ] **Frontend Loading**: Visit `https://<frontend-service>.onrender.com` -> UI renders cleanly without console errors.
- [ ] **Client-Side Routing**: Refresh pages on `/markets`, `/ai-analyst`, `/backtest` -> no 404 errors.
- [ ] **Authentication**: Register a new user and login -> JWT token persisted in localStorage.
- [ ] **Real-time Market Data**: Dashboard loads prices and charts for US and Indian NSE equities.
- [ ] **Explainable AI Analyst**: Horizontal stock bar scrolls smoothly across all 25 stocks; signal calculation returns confidence score and explanations.
- [ ] **Quantitative Backtest Lab**: Simulation executes over 6M/1Y timeframe and produces equity curve.
- [ ] **Paper Trading**: Virtual BUY and SELL orders execute and update live cash balance in MongoDB Atlas.
- [ ] **Chatbot Assistant**: Answers stock queries and technical questions using verified market data.
