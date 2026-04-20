# 🚀 Render.com Deployment Guide (Easy Web Interface)

## Why Render?
- ✅ Easy web interface (no CLI needed)
- ✅ Free PostgreSQL database
- ✅ Free Redis
- ✅ Supports Node.js and Python
- ✅ Automatic deployments from GitHub

---

## **STEP 1: Sign Up for Render**

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with your GitHub account (**shyam-piparva**)
4. Authorize Render to access your repositories

---

## **STEP 2: Create PostgreSQL Database**

1. In Render Dashboard, click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name:** `risk-analyzer-db`
   - **Database:** `risk_analyzer`
   - **User:** `postgres`
   - **Region:** Choose closest to you
   - **Plan:** **Free**
4. Click **"Create Database"**
5. Wait 2-3 minutes for database to be ready
6. **IMPORTANT:** Copy the **"Internal Database URL"** (you'll need this later)

---

## **STEP 3: Create Redis Instance**

1. Click **"New +"** button again
2. Select **"Redis"**
3. Fill in:
   - **Name:** `risk-analyzer-redis`
   - **Region:** Same as database
   - **Plan:** **Free**
4. Click **"Create Redis"**
5. Wait 1-2 minutes
6. **IMPORTANT:** Copy the **"Internal Redis URL"** (you'll need this later)

---

## **STEP 4: Deploy Backend Service**

1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository: **shyam-piparva/Project-Risk-Analyzer**
4. Fill in:
   - **Name:** `risk-analyzer-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** **Node**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Free**

5. Click **"Advanced"** and add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<paste your database internal host>
   DB_PORT=5432
   DB_NAME=risk_analyzer
   DB_USER=postgres
   DB_PASSWORD=<paste your database password>
   REDIS_HOST=<paste your redis internal host>
   REDIS_PORT=6379
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=https://project1-pi-gray.vercel.app
   LOG_LEVEL=info
   RISK_ENGINE_URL=<we'll add this after step 5>
   ```

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. **IMPORTANT:** Copy your backend URL (e.g., `https://risk-analyzer-backend.onrender.com`)

---

## **STEP 5: Deploy Risk Engine Service**

1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository: **shyam-piparva/Project-Risk-Analyzer**
4. Fill in:
   - **Name:** `risk-analyzer-engine`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `risk-engine`
   - **Runtime:** **Python**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python src/app.py`
   - **Plan:** **Free**

5. Click **"Advanced"** and add Environment Variables:
   ```
   PORT=5001
   DEBUG=False
   LOG_LEVEL=INFO
   DB_HOST=<paste your database internal host>
   DB_PORT=5432
   DB_NAME=risk_analyzer
   DB_USER=postgres
   DB_PASSWORD=<paste your database password>
   JWT_SECRET=your-super-secret-jwt-key-change-this
   ```

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. **IMPORTANT:** Copy your risk engine URL (e.g., `https://risk-analyzer-engine.onrender.com`)

---

## **STEP 6: Update Backend Environment Variables**

1. Go back to your **backend service** in Render
2. Click **"Environment"** tab
3. Add the Risk Engine URL:
   ```
   RISK_ENGINE_URL=https://risk-analyzer-engine.onrender.com
   ```
4. Click **"Save Changes"**
5. Backend will automatically redeploy

---

## **STEP 7: Update Vercel Environment Variables**

1. Go to: https://vercel.com/dashboard
2. Click your project: **project1-pi-gray**
3. Click **"Settings"** → **"Environment Variables"**
4. Add or update:
   ```
   VITE_API_URL=https://risk-analyzer-backend.onrender.com/api
   VITE_API_VERSION=v1
   ```
5. Click **"Save"**

---

## **STEP 8: Redeploy Vercel**

1. Go to **"Deployments"** tab in Vercel
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

## **STEP 9: Test Your Application**

Visit: **https://project1-pi-gray.vercel.app**

Your app should now work! 🎉

---

## **Important Notes**

⚠️ **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Database has 1GB storage limit

💡 **To keep services awake:**
- Use a service like UptimeRobot to ping your backend every 10 minutes
- Or upgrade to paid plan ($7/month per service)

---

## **Troubleshooting**

**If backend deployment fails:**
- Check the logs in Render dashboard
- Make sure all environment variables are set correctly
- Verify database connection string is correct

**If Vercel still shows error:**
- Make sure `VITE_API_URL` ends with `/api`
- Wait 2-3 minutes after redeploying
- Check browser console for errors

**If you see "Service Unavailable":**
- Free tier services sleep after inactivity
- Wait 30-60 seconds and refresh
- The service is waking up

---

**Author:** Shyam Piparva
