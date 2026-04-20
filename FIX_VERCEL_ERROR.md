# 🔧 Fix Vercel Internal Server Error

## The Problem
Your Vercel frontend at https://project1-pi-gray.vercel.app shows "Internal Server Error" because it's trying to connect to a backend API that doesn't exist yet.

## The Solution
Deploy your backend to Railway (I already opened your Railway dashboard for you).

---

# 📋 **FOLLOW THESE STEPS IN RAILWAY DASHBOARD:**

## ✅ **Already Done:**
- PostgreSQL Database (added)
- Redis Cache (added)

## 🔨 **You Need to Do:**

### **1. Add Backend Service**

In Railway dashboard:
1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer**
4. Railway will create a new service

Then configure it:
1. Click **"Settings"** tab
2. Set **Root Directory:** `backend`
3. Click **"Variables"** tab
4. Add these variables (copy-paste):

```
NODE_ENV=production
PORT=3000
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=super-secret-key-12345-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://project1-pi-gray.vercel.app
LOG_LEVEL=info
```

5. Click **"Deploy"** button
6. Wait 5 minutes for deployment

### **2. Add Risk Engine Service**

1. Click **"+ New"** button again
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer** (same repo)

Then configure it:
1. Click **"Settings"** tab
2. Set **Root Directory:** `risk-engine`
3. Click **"Variables"** tab
4. Add these variables:

```
PORT=5001
DEBUG=False
LOG_LEVEL=INFO
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=super-secret-key-12345-change-this
```

5. Click **"Deploy"** button
6. Wait 5 minutes

### **3. Get Backend URL**

1. Go to your **backend** service
2. Click **"Settings"** tab
3. Find **"Networking"** section
4. Click **"Generate Domain"**
5. **COPY THE URL** (something like: `https://backend-production-xxxx.up.railway.app`)

### **4. Update Backend Variables**

1. Still in backend service, click **"Variables"** tab
2. Add one more variable:
   - **Key:** `RISK_ENGINE_URL`
   - **Value:** `http://risk-engine.railway.internal:5001`
3. Service will redeploy automatically

### **5. Update Vercel**

1. Go to: https://vercel.com/dashboard
2. Click: **project1-pi-gray**
3. Click: **Settings** → **Environment Variables**
4. Add new variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app/api` (paste your Railway backend URL + `/api`)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **"..."** → **"Redeploy"**

### **6. Test**

Visit: https://project1-pi-gray.vercel.app

Should work now! 🎉

---

## **Quick Links:**

- **Railway Dashboard:** https://railway.app/project/f0ccb44f-1206-4c77-a7b2-1bf6d1e32c7b
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Frontend:** https://project1-pi-gray.vercel.app

---

## **Need Help?**

If you get stuck, the detailed guide is in: `RAILWAY_WEB_SETUP.md`

**Author:** Shyam Piparva
