# 🚂 Railway Web Setup (No CLI Needed!)

Your Railway dashboard should be open now. Follow these steps:

---

## **STEP 1: You Already Have Database & Redis ✅**

I already added:
- ✅ PostgreSQL Database
- ✅ Redis Cache

---

## **STEP 2: Add Backend Service**

1. In Railway dashboard, click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer**
4. Click **"Add variables"** or **"Deploy"**

### **Add These Environment Variables:**

Click **"Variables"** tab and add:

```
NODE_ENV=production
PORT=3000
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
REDIS_HOST=${{Redis.REDIS_PRIVATE_URL}}
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-12345-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://project1-pi-gray.vercel.app
LOG_LEVEL=info
RISK_ENGINE_URL=http://risk-engine.railway.internal:5001
```

### **Configure Build Settings:**

1. Click **"Settings"** tab
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. Click **"Deploy"**

---

## **STEP 3: Add Risk Engine Service**

1. Click **"+ New"** button again
2. Select **"GitHub Repo"**
3. Choose: **shyam-piparva/Project-Risk-Analyzer** (same repo)
4. Click **"Add variables"** or **"Deploy"**

### **Add These Environment Variables:**

```
PORT=5001
DEBUG=False
LOG_LEVEL=INFO
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=your-super-secret-jwt-key-12345-change-this
```

### **Configure Build Settings:**

1. Click **"Settings"** tab
2. **Root Directory:** `risk-engine`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `python src/app.py`
5. Click **"Deploy"**

---

## **STEP 4: Get Backend Public URL**

1. Go to your **backend** service in Railway
2. Click **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"** button
5. **COPY THE URL** (e.g., `https://backend-production-xxxx.up.railway.app`)

---

## **STEP 5: Update Vercel Environment Variables**

1. Go to: https://vercel.com/dashboard
2. Click your project: **project1-pi-gray**
3. Click **"Settings"** → **"Environment Variables"**
4. Click **"Add New"**
5. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app/api` (paste your Railway URL + `/api`)
   - Select: **Production, Preview, Development**
6. Click **"Save"**

---

## **STEP 6: Redeploy Vercel**

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

## **STEP 7: Test Your App**

Visit: **https://project1-pi-gray.vercel.app**

Your app should work now! 🎉

---

## **Troubleshooting**

### **If backend deployment fails:**
- Check the **"Deployments"** tab in Railway for error logs
- Make sure all environment variables are set
- Try redeploying

### **If you see "Application failed to respond":**
- Wait 2-3 minutes for services to fully start
- Check that PORT is set to 3000 for backend and 5001 for risk-engine

### **If Vercel still shows error:**
- Make sure `VITE_API_URL` ends with `/api`
- Clear browser cache
- Wait a few minutes and try again

---

**Your Railway Dashboard:** https://railway.app/project/f0ccb44f-1206-4c77-a7b2-1bf6d1e32c7b

**Author:** Shyam Piparva
