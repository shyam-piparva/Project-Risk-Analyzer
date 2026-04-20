# 🚀 Vercel Deployment Guide

This guide explains how to deploy the Project Risk Analyzer to Vercel.

## ⚠️ Important Note

Vercel is optimized for **frontend applications and serverless functions**. This project has:
- ✅ Frontend (React) - **Can deploy to Vercel**
- ❌ Backend (Node.js/Express) - **Needs separate hosting**
- ❌ Risk Engine (Python/Flask) - **Needs separate hosting**
- ❌ PostgreSQL Database - **Needs separate hosting**
- ❌ Redis Cache - **Needs separate hosting**

## 📋 Deployment Options

### Option 1: Frontend Only on Vercel (Recommended)

Deploy the React frontend to Vercel and host backend services elsewhere.

#### Step 1: Deploy Backend & Database

Choose one of these platforms for backend:
- **Railway** (Recommended) - Supports Node.js, Python, PostgreSQL, Redis
- **Render** - Free tier available
- **Heroku** - Easy deployment
- **DigitalOcean App Platform**
- **AWS/Azure/GCP**

#### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy from root directory:**
```bash
vercel
```

4. **Configure Environment Variables in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     VITE_API_VERSION=v1
     ```

5. **Redeploy:**
```bash
vercel --prod
```

### Option 2: Deploy Frontend from GitHub

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository: `shyam-piparva/Project-Risk-Analyzer`

2. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.com/api
   VITE_API_VERSION=v1
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

### Option 3: Full Stack on Railway (Alternative)

Railway supports all components of your project:

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Initialize:**
```bash
railway init
```

4. **Deploy:**
```bash
railway up
```

Railway will automatically:
- Deploy frontend, backend, and risk-engine
- Provision PostgreSQL and Redis
- Set up environment variables
- Provide URLs for all services

## 🔧 Required Backend Hosting

For full functionality, you need to host:

### 1. Backend API (Node.js)
- **Recommended:** Railway, Render, or Heroku
- **Requirements:** Node.js 18+, PostgreSQL connection
- **Environment Variables:** See `backend/.env.example`

### 2. Risk Engine (Python)
- **Recommended:** Railway, Render, or PythonAnywhere
- **Requirements:** Python 3.11+, PostgreSQL connection
- **Environment Variables:** See `risk-engine/.env.example`

### 3. PostgreSQL Database
- **Options:**
  - Railway (Free tier: 500MB)
  - Supabase (Free tier: 500MB)
  - Neon (Free tier: 3GB)
  - ElephantSQL (Free tier: 20MB)

### 4. Redis Cache
- **Options:**
  - Railway (Free tier: 100MB)
  - Upstash (Free tier: 10K commands/day)
  - Redis Cloud (Free tier: 30MB)

## 📝 Deployment Checklist

- [ ] Deploy PostgreSQL database
- [ ] Deploy Redis cache
- [ ] Deploy Backend API
- [ ] Deploy Risk Engine
- [ ] Update frontend environment variables with backend URLs
- [ ] Deploy Frontend to Vercel
- [ ] Test all functionality
- [ ] Set up custom domain (optional)

## 🌐 Recommended Architecture

```
Frontend (Vercel)
    ↓
Backend API (Railway/Render)
    ↓
PostgreSQL (Railway/Supabase)
Redis (Railway/Upstash)
    ↓
Risk Engine (Railway/Render)
```

## 💡 Cost Estimate

**Free Tier Option:**
- Vercel: Free (Frontend)
- Railway: Free tier (Backend + Database + Redis + Risk Engine)
- Total: **$0/month**

**Paid Option (Better Performance):**
- Vercel Pro: $20/month
- Railway: ~$20-30/month
- Total: **~$40-50/month**

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

## 📧 Need Help?

If you need assistance with deployment, feel free to:
- Open an issue on GitHub
- Check the documentation links above
- Contact: shyam-piparva

---

**Note:** For the best experience, consider using Railway for the entire stack as it supports all components natively.
