# 🚀 Complete Deployment Guide - Vercel + Railway

## What I Fixed:
✅ Removed serverless function causing Vercel error
✅ Added API key authentication for security
✅ Configured Vercel to ONLY serve frontend
✅ Set up Railway for backend with secure connection

---

# 📋 **DEPLOYMENT STEPS**

## **PART 1: Deploy Backend to Railway**

### **Step 1: Open Railway Dashboard**
Go to: https://railway.app/project/f0ccb44f-1206-4c77-a7b2-1bf6d1e32c7b

### **Step 2: Add Backend Service**
1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer**
4. Railway will create a service

### **Step 3: Configure Backend**
1. Click the new service
2. Click **"Settings"** tab
3. Set **Root Directory:** `backend`
4. Click **"Variables"** tab
5. Add these variables:

```
NODE_ENV=production
PORT=3000
API_KEY=secure-api-key-12345-CHANGE-THIS-TO-RANDOM-STRING
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=super-secret-jwt-key-67890-CHANGE-THIS
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://project1-pi-gray.vercel.app
LOG_LEVEL=info
```

6. Click **"Deploy"**
7. Wait 5-10 minutes

### **Step 4: Generate Backend Domain**
1. Still in backend service, click **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** button
4. **COPY THE URL** (e.g., `https://backend-production-xxxx.up.railway.app`)

### **Step 5: Add Risk Engine Service**
1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer**
4. Click **"Settings"** → Set **Root Directory:** `risk-engine`
5. Click **"Variables"** tab and add:

```
PORT=5001
DEBUG=False
LOG_LEVEL=INFO
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=super-secret-jwt-key-67890-CHANGE-THIS
```

6. Click **"Deploy"**

### **Step 6: Update Backend with Risk Engine URL**
1. Go back to **backend** service
2. Click **"Variables"** tab
3. Add:
   ```
   RISK_ENGINE_URL=http://risk-engine.railway.internal:5001
   ```
4. Service will redeploy automatically

---

## **PART 2: Deploy Frontend to Vercel**

### **Step 7: Update Vercel Environment Variables**
1. Go to: https://vercel.com/dashboard
2. Click your project: **project1-pi-gray**
3. Click **"Settings"** → **"Environment Variables"**
4. Add these variables:

```
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_API_KEY=secure-api-key-12345-CHANGE-THIS-TO-RANDOM-STRING
VITE_API_VERSION=v1
```

**IMPORTANT:** The `VITE_API_KEY` must match the `API_KEY` you set in Railway backend!

5. Click **"Save"**

### **Step 8: Redeploy Vercel**
1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

## **PART 3: Test Your Application**

### **Step 9: Test Backend**
Open in browser: `https://your-backend-url.railway.app/health`

Should see:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected"
}
```

### **Step 10: Test Frontend**
Visit: **https://project1-pi-gray.vercel.app**

Should load without errors! 🎉

---

## **🔐 Security Notes**

### **API Key Protection:**
- The backend now requires an API key in the `X-API-Key` header
- Only requests with the correct API key can access the API
- The frontend automatically includes this key in all requests
- Change the default API key to something random and secure!

### **Generate Secure Keys:**
You can generate secure random keys using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## **📝 Summary**

**What's Deployed:**
- ✅ Frontend: Vercel (https://project1-pi-gray.vercel.app)
- ✅ Backend: Railway (with API key protection)
- ✅ Database: Railway PostgreSQL
- ✅ Redis: Railway
- ✅ Risk Engine: Railway

**Security:**
- ✅ API key authentication
- ✅ JWT tokens for user authentication
- ✅ CORS protection
- ✅ Secure database connections

---

## **🐛 Troubleshooting**

### **Vercel shows "Internal Server Error":**
- Make sure you redeployed after adding environment variables
- Check that `VITE_API_URL` ends with `/api`
- Clear browser cache

### **Backend shows "Unauthorized" or "Forbidden":**
- Make sure `VITE_API_KEY` in Vercel matches `API_KEY` in Railway
- Check that both are set correctly

### **"Failed to connect to backend":**
- Make sure backend is deployed and running in Railway
- Check that the backend URL in Vercel is correct
- Wait a few minutes for services to fully start

---

**Author:** Shyam Piparva
**Repository:** https://github.com/shyam-piparva/Project-Risk-Analyzer
