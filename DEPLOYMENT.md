# FlowLogic WMS Deployment Guide

This guide covers deploying FlowLogic WMS for test users using Vercel (frontend) and Railway (backend + database).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Railway       │     │   Railway       │
│   (Frontend)    │────▶│   (Backend)     │────▶│   (PostgreSQL)  │
│   React/Vite    │     │   Express.js    │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Prerequisites

- GitHub account (code is already pushed)
- Vercel account (free tier works)
- Railway account (free tier: $5 credit/month)
- Anthropic API key (optional, for AI assistant)

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `flowlogic-wms-ui` repository
4. Choose **"server"** as the root directory

### 1.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically create the database and provide a connection string

### 1.3 Configure Environment Variables

In Railway, go to your backend service → **Variables** tab and add:

```env
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway auto-fills this
NODE_ENV=production
PORT=3001

# Security (generate secure random strings)
SESSION_SECRET=<generate-32-char-random-string>
JWT_SECRET=<generate-32-char-random-string>

# CORS - Will be set after Vercel deployment
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional - AI Assistant
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

**Generate secure secrets:**
```bash
# Run this in terminal to generate random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.4 Deploy and Get URL

1. Railway will auto-deploy on every push to main
2. Go to **Settings** → **Networking** → **Generate Domain**
3. Copy the URL (e.g., `https://flowlogic-backend-production.up.railway.app`)

### 1.5 Initialize Database

After first deployment, run database migrations:

1. In Railway, go to your backend service
2. Click **"Deploy"** → **"View Logs"** to ensure it started
3. Go to the PostgreSQL service → **"Data"** tab to verify tables were created

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import `flowlogic-wms-ui` repository

### 2.2 Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset:** Vite
- **Root Directory:** `./` (leave empty, not `server`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2.3 Set Environment Variables

In Vercel project settings → **Environment Variables**:

```env
VITE_API_URL=https://your-railway-backend-url.up.railway.app
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DARK_MODE=true
VITE_APP_ENV=production
```

### 2.4 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2 minutes)
3. Copy your Vercel URL (e.g., `https://flowlogic-wms.vercel.app`)

### 2.5 Update Railway CORS

Go back to Railway and update the `ALLOWED_ORIGINS` variable:

```env
ALLOWED_ORIGINS=https://flowlogic-wms.vercel.app
```

Railway will automatically redeploy with the new CORS settings.

---

## Step 3: Verify Deployment

### 3.1 Health Checks

- **Backend:** Visit `https://your-railway-url.up.railway.app/api/health`
- **API Docs:** Visit `https://your-railway-url.up.railway.app/api/docs`
- **Frontend:** Visit `https://your-vercel-url.vercel.app`

### 3.2 Test Core Features

1. Open the frontend URL
2. Navigate through different pages
3. Check that data loads (or shows appropriate mock data fallback)
4. Test the AI assistant (if Anthropic API key is configured)

---

## Step 4: Seed Demo Data (Optional)

To populate the database with demo data for testing:

1. In Railway, open your backend service
2. Go to **Settings** → **Custom Start Command**
3. Temporarily change to: `npm run db:seed && node index.js`
4. Trigger a redeploy
5. After seeding completes, change back to: `node index.js`

Alternatively, connect to the database directly:
```bash
# Get connection string from Railway
npx prisma db seed
```

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Server port (3001) |
| `SESSION_SECRET` | Yes | Random string for sessions |
| `JWT_SECRET` | Yes | Random string for JWT tokens |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |
| `ANTHROPIC_API_KEY` | No | For AI assistant features |
| `RATE_LIMIT_RPM` | No | Requests per minute (default: 100) |
| `LOG_LEVEL` | No | Logging level (default: info) |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_ENABLE_AI_ASSISTANT` | No | Enable AI chat (true/false) |
| `VITE_ENABLE_ANALYTICS` | No | Enable analytics (true/false) |
| `VITE_ENABLE_DARK_MODE` | No | Enable dark mode (true/false) |
| `VITE_APP_ENV` | No | Environment name |

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain
3. Configure DNS as instructed

### Railway Custom Domain
1. Go to Railway service → **Settings** → **Networking**
2. Add custom domain
3. Configure DNS as instructed

**Remember to update `ALLOWED_ORIGINS` in Railway if you add custom domains!**

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify `DATABASE_URL` is set correctly
- Ensure Prisma client was generated (`npx prisma generate`)

### CORS errors in browser
- Verify `ALLOWED_ORIGINS` includes your frontend URL exactly
- Check for trailing slashes (don't include them)
- Ensure the backend redeployed after changing `ALLOWED_ORIGINS`

### Database connection issues
- Check PostgreSQL service is running in Railway
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check Railway PostgreSQL logs for connection errors

### Frontend shows no data
- Open browser DevTools → Network tab
- Check if API requests are reaching the backend
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend logs in Railway for errors

### AI Assistant not working
- Verify `ANTHROPIC_API_KEY` is set in Railway
- Check backend logs for Anthropic API errors
- Ensure `VITE_ENABLE_AI_ASSISTANT=true` in Vercel

---

## Cost Estimates

### Free Tier Usage
- **Vercel:** Free for hobby projects (100GB bandwidth/month)
- **Railway:** $5 free credit/month (sufficient for testing)

### Production Scaling
- **Vercel Pro:** $20/month for team features
- **Railway:** ~$10-50/month depending on usage
- **Total:** ~$30-70/month for production

---

## Security Checklist

Before inviting test users:

- [ ] Secure `SESSION_SECRET` and `JWT_SECRET` (not default values)
- [ ] `ALLOWED_ORIGINS` set to only your frontend domain
- [ ] `NODE_ENV=production` in Railway
- [ ] No sensitive data in frontend environment variables
- [ ] Database backups enabled (Railway does this automatically)
- [ ] Rate limiting configured (`RATE_LIMIT_RPM`)

---

## Next Steps After Deployment

1. **Invite Test Users:** Share the Vercel URL
2. **Monitor:** Check Railway logs for errors
3. **Iterate:** Push changes to GitHub, auto-deploys to both platforms
4. **Scale:** Upgrade plans as needed for more users/traffic
