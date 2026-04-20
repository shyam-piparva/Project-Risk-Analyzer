# 🚂 Railway Deployment Guide

## Quick Deploy to Railway (5 Minutes)

Railway supports your entire stack: Backend, Database, Redis, and Risk Engine.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser. Sign up/login with GitHub (use your shyam-piparva account).

### Step 3: Create New Project

```bash
railway init
```

- Choose: "Empty Project"
- Name it: "project-risk-analyzer"

### Step 4: Deploy Services

Railway will automatically detect your `docker-compose.yml` and deploy all services:

```bash
railway up
```

This will deploy:
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ Backend API (Node.js)
- ✅ Risk Engine (Python)

### Step 5: Get Your Backend URL

After deployment completes:

```bash
railway domain
```

Or go to: https://railway.app/dashboard

Find your backend service and copy the public URL (something like: `https://project-risk-analyzer-production.up.railway.app`)

### Step 6: Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: `project1-pi-gray`
3. Go to: Settings → Environment Variables
4. Add/Update:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app/api
   VITE_API_VERSION=v1
   ```
5. Redeploy your Vercel frontend:
   ```bash
   vercel --prod
   ```

### Step 7: Test Your Application

Visit: https://project1-pi-gray.vercel.app

Your app should now work with:
- Frontend: Vercel
- Backend: Railway
- Database: Railway
- Redis: Railway
- Risk Engine: Railway

## Alternative: Deploy Everything to Railway

If you prefer to host everything on Railway (simpler):

```bash
railway init
railway up
```

Railway will give you URLs for both frontend and backend.

## Cost

- **Railway Free Tier**: $5 credit/month (enough for development)
- **Vercel Free Tier**: Unlimited for personal projects

## Troubleshooting

### If Railway deployment fails:

1. Make sure you're in the project root directory
2. Check that `docker-compose.yml` exists
3. Try deploying services individually:
   ```bash
   railway up --service backend
   railway up --service postgres
   railway up --service redis
   railway up --service risk-engine
   ```

### If Vercel still shows errors:

1. Check environment variables are set correctly
2. Make sure backend URL ends with `/api`
3. Redeploy after changing environment variables

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

**Author:** Shyam Piparva
