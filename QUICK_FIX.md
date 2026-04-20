# ⚡ QUICK FIX - Vercel Error

## What I Did:
✅ Fixed Vercel configuration (removed serverless function)
✅ Added API key security between Vercel and Railway
✅ Updated frontend to send API key with requests
✅ Pushed all changes to GitHub

---

## What You Need to Do (5 Minutes):

### **1. Deploy Backend to Railway**
- Go to: https://railway.app/project/f0ccb44f-1206-4c77-a7b2-1bf6d1e32c7b
- Click **"+ New"** → **"GitHub Repo"** → **shyam-piparva/Project-Risk-Analyzer**
- Set **Root Directory:** `backend`
- Add variables (copy from `COMPLETE_DEPLOYMENT_GUIDE.md`)
- Click **"Deploy"**
- Generate domain and copy URL

### **2. Deploy Risk Engine to Railway**
- Click **"+ New"** → **"GitHub Repo"** → same repo
- Set **Root Directory:** `risk-engine`
- Add variables
- Click **"Deploy"**

### **3. Update Vercel**
- Go to: https://vercel.com/dashboard → **project1-pi-gray**
- Settings → Environment Variables
- Add:
  ```
  VITE_API_URL=https://your-railway-backend-url.railway.app/api
  VITE_API_KEY=secure-api-key-12345-CHANGE-THIS
  VITE_API_VERSION=v1
  ```
- Redeploy

### **4. Done!**
Visit: https://project1-pi-gray.vercel.app

---

## 🔑 IMPORTANT: API Key Must Match!

The `API_KEY` in Railway backend MUST match `VITE_API_KEY` in Vercel frontend.

Example:
- Railway Backend: `API_KEY=my-secret-key-abc123`
- Vercel Frontend: `VITE_API_KEY=my-secret-key-abc123`

---

## Full Guide:
See `COMPLETE_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.
