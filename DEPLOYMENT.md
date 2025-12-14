# FlowLogic WMS Deployment Guide

Deploy FlowLogic WMS using **Railway** for a complete, all-in-one solution.

## Why Railway?

- **All-in-one**: Frontend, backend, database, and Redis in one place
- **Simple**: One dashboard, one bill, one deploy
- **Affordable**: $5 free credit/month (enough for testing)
- **Auto-deploys**: Push to GitHub → automatic deployment

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Railway Project                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │  │
│  │  (Static)    │──│  (Express)   │──│  (Database)  │  │
│  │   Vite       │  │  Socket.io   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                           │                             │
│                    ┌──────────────┐                     │
│                    │    Redis     │                     │
│                    │  (Optional)  │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## Features Included

- **WebSockets**: Real-time updates via Socket.io
- **File Uploads**: Document and image uploads via Multer
- **Background Jobs**: Job queue system (in-memory or Redis)
- **AI Assistant**: Claude-powered warehouse assistant

---

## Quick Start (15 minutes)

### Prerequisites

- GitHub account (your code is already there)
- [Railway account](https://railway.app) (sign up with GitHub)
- Anthropic API key (optional, for AI features)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `flowlogic-wms-ui` repository
5. Railway will auto-detect the project

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for it to provision (~30 seconds)

### Step 3: Add Redis (Optional but Recommended)

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. This enables:
   - Background job queues
   - Session caching
   - Real-time pub/sub

### Step 4: Configure Backend Service

1. Click on your main service (flowlogic-wms-ui)
2. Go to **"Settings"** tab
3. Set **Root Directory** to: `server`
4. Set **Start Command** to: `npm run start`

### Step 5: Set Environment Variables

Go to **"Variables"** tab and add:

```env
# Database (Railway auto-fills these if you click "Add Reference")
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (if added)
REDIS_URL=${{Redis.REDIS_URL}}

# Server
NODE_ENV=production
PORT=3001

# Security (IMPORTANT: Generate unique values!)
SESSION_SECRET=<run: openssl rand -hex 32>
JWT_SECRET=<run: openssl rand -hex 32>

# CORS - Your Railway URL (update after first deploy)
ALLOWED_ORIGINS=https://your-app.up.railway.app

# AI Assistant (optional)
ANTHROPIC_API_KEY=sk-ant-...

# File Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

**Generate secure secrets:**
```bash
# Run these commands locally
openssl rand -hex 32  # For SESSION_SECRET
openssl rand -hex 32  # For JWT_SECRET
```

### Step 6: Deploy Frontend

**Option A: Same Railway Project (Recommended)**

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same `flowlogic-wms-ui` repo
3. Name it `frontend`
4. Settings:
   - Root Directory: `.` (empty)
   - Build Command: `npm run build`
   - Start Command: `npx serve dist -s -l 3000`
5. Add variable: `VITE_API_URL=https://your-backend.up.railway.app`

**Option B: Static Hosting via Backend**

The backend can serve the frontend. Just build and copy:
```bash
npm run build
# dist/ folder is served at root
```

### Step 7: Generate Domains

1. Click on each service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy your URLs:
   - Backend: `https://flowlogic-backend-xxx.up.railway.app`
   - Frontend: `https://flowlogic-frontend-xxx.up.railway.app`

### Step 8: Update CORS

Go back to your backend service → Variables:
```env
ALLOWED_ORIGINS=https://flowlogic-frontend-xxx.up.railway.app
```

### Step 9: Initialize Database

Railway will automatically run migrations on deploy. To seed demo data:

1. Go to backend service → **"Settings"**
2. Temporarily set Start Command: `npm run db:seed && npm start`
3. Redeploy
4. After seeding, change back to: `npm start`

---

## Verify Deployment

### Health Checks

| Endpoint | Expected |
|----------|----------|
| `https://your-backend.up.railway.app/api/health` | `{"status":"ok"}` |
| `https://your-backend.up.railway.app/api/docs` | Swagger UI |
| `https://your-frontend.up.railway.app` | FlowLogic UI |

### Test WebSocket Connection

Open browser console on frontend:
```javascript
const socket = io('https://your-backend.up.railway.app');
socket.on('connect', () => console.log('WebSocket connected!'));
```

### Test File Upload

```bash
curl -X POST https://your-backend.up.railway.app/api/uploads/documents \
  -F "file=@test.pdf"
```

---

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NODE_ENV` | Set to `production` |
| `SESSION_SECRET` | Random 32+ character string |
| `JWT_SECRET` | Random 32+ character string |
| `ALLOWED_ORIGINS` | Frontend URL(s), comma-separated |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `REDIS_URL` | - | Redis for queues/cache |
| `ANTHROPIC_API_KEY` | - | AI assistant |
| `UPLOAD_PATH` | ./uploads | File storage path |
| `MAX_FILE_SIZE` | 10485760 | Max upload size (10MB) |
| `RATE_LIMIT_RPM` | 100 | API rate limit |
| `LOG_LEVEL` | info | Logging verbosity |

---

## WebSocket Events

The backend emits real-time events:

```javascript
// Frontend connection
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

// Authenticate after connect
socket.emit('authenticate', {
  userId: user.id,
  warehouseId: user.warehouseId,
  role: user.role
});

// Listen for events
socket.on('inventory:updated', (data) => {
  console.log('Inventory changed:', data);
});

socket.on('task:assigned', (task) => {
  showNotification(`New task: ${task.type}`);
});

socket.on('alert:created', (alert) => {
  showAlert(alert);
});
```

### Available Events

| Event | Description |
|-------|-------------|
| `inventory:updated` | Inventory quantity changed |
| `inventory:low_stock` | Item below reorder point |
| `order:created` | New order received |
| `order:status_changed` | Order status updated |
| `task:assigned` | Task assigned to user |
| `task:completed` | Task marked complete |
| `alert:created` | New system alert |
| `asn:arrived` | ASN checked in at dock |

---

## File Uploads

### Supported Types

| Category | Extensions | Max Size |
|----------|------------|----------|
| Documents | .pdf, .doc, .docx, .xls, .xlsx, .csv | 10MB |
| Images | .jpg, .png, .gif, .webp | 5MB |
| EDI | .edi, .x12, .txt | 50MB |
| Labels | .pdf, .png, .zpl | 2MB |

### Upload Endpoints

```bash
# Single document
POST /api/uploads/documents
Content-Type: multipart/form-data
file: <file>

# Multiple documents
POST /api/uploads/documents/batch
Content-Type: multipart/form-data
files: <file[]>

# Single image
POST /api/uploads/images
Content-Type: multipart/form-data
image: <file>

# Download
GET /api/uploads/download/:fileId
```

---

## Background Jobs

The job queue processes async tasks:

```javascript
// From any route handler
import { initializeQueueSystem, JOB_TYPES } from './lib/queue/index.js';

// Add a job
await queueSystem.addJob(JOB_TYPES.REPORT_GENERATE, {
  reportType: 'inventory-snapshot',
  warehouseId: 'wh-001'
});

// Schedule recurring job
queueSystem.schedule(
  'daily-cleanup',
  '0 2 * * *',  // 2 AM daily
  JOB_TYPES.CLEANUP_OLD_DATA,
  { daysToKeep: 90 }
);
```

### Job Types

| Type | Description |
|------|-------------|
| `edi:inbound:process` | Process incoming EDI |
| `edi:outbound:generate` | Generate outbound EDI |
| `report:generate` | Generate reports |
| `notification:email` | Send email notifications |
| `notification:webhook` | Call external webhooks |
| `maintenance:cleanup` | Clean old data |

---

## Custom Domain

1. Go to service → **Settings** → **Networking**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `app.yourcompany.com`)
4. Add DNS records as shown
5. Wait for SSL certificate (~5 minutes)

**Don't forget to update `ALLOWED_ORIGINS`!**

---

## Monitoring & Logs

### View Logs
- Railway Dashboard → Service → **"Deployments"** → Click deployment → **"View Logs"**

### Health Monitoring
- Backend exposes `/api/health` for uptime monitoring
- Connect to UptimeRobot, Pingdom, or similar

### Database Management
- Railway Dashboard → PostgreSQL service → **"Data"** tab
- Or use Prisma Studio: `npx prisma studio`

---

## Scaling

### Horizontal Scaling
Railway supports multiple instances. Go to **Settings** → **Scaling**:
- Replicas: 2+ for high availability
- Memory: Increase as needed

### Database Scaling
PostgreSQL can be upgraded in Railway:
- Pro plan for larger databases
- Enable connection pooling for high traffic

---

## Troubleshooting

### Build Fails
```
Check: npm install runs successfully locally
Fix: Delete package-lock.json, run npm install, commit
```

### Database Connection Error
```
Check: DATABASE_URL is set correctly
Check: PostgreSQL service is running
Fix: Click "Connect" on Postgres service, copy connection string
```

### CORS Errors
```
Check: ALLOWED_ORIGINS matches your frontend URL exactly
Check: No trailing slash in origins
Fix: Redeploy after changing ALLOWED_ORIGINS
```

### WebSocket Won't Connect
```
Check: Backend URL uses https://
Check: Socket.io client matches server version
Fix: Clear browser cache, check console for errors
```

### File Upload Fails
```
Check: File size under limit
Check: File type is allowed
Check: uploads/ directory is writable
```

---

## Cost Estimate

### Free Tier
- **Railway**: $5/month free credit
- Sufficient for: Testing, demos, small teams

### Production (~$20-50/month)
- Backend: ~$10/month
- PostgreSQL: ~$10/month
- Redis: ~$5/month
- Frontend: ~$5/month

### Enterprise
- Contact Railway for dedicated resources
- Or migrate to AWS/GCP/Azure

---

## Security Checklist

Before going live:

- [ ] Unique SESSION_SECRET (not default)
- [ ] Unique JWT_SECRET (not default)
- [ ] ALLOWED_ORIGINS set to production domain only
- [ ] NODE_ENV=production
- [ ] HTTPS enforced (Railway handles this)
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] Sensitive env vars not in code

---

## Next Steps

1. **Deploy** - Follow steps above (~15 min)
2. **Seed Data** - Add demo data for testing
3. **Invite Testers** - Share the frontend URL
4. **Monitor** - Watch logs for errors
5. **Iterate** - Push to GitHub, auto-deploys

Need help? Check logs first, then [open an issue](https://github.com/Jake1848/flowlogic-wms-ui/issues).
