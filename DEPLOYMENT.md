# Deployment Guide

Make the app live on the internet — accessible from anywhere, not just your local Wi-Fi.

---

## Option 1: Render.com (Recommended — Easiest)

Render is a cloud platform that hosts web apps. Free tier works well for this project.

### Step 1: Push to GitHub

Make sure your code is on GitHub:
```bash
git push
```

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com) and sign up (GitHub login works)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `Cu-Product-expiration` repo

### Step 3: Configure the Web Service

| Setting | Value |
|---------|-------|
| **Name** | `cu-product-expiry` (or anything) |
| **Region** | Choose closest to you |
| **Branch** | `master` |
| **Root Directory** | _(leave empty)_ |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

### Step 4: Add a Persistent Disk (for SQLite)

Since SQLite saves to a file, you need a persistent disk so data isn't lost on restart.

1. In your Render dashboard, go to the web service
2. Click **"Disks"** tab
3. Click **"Add Disk"**
4. Set:
   - **Mount Path:** `/opt/render/project/src/server/data`
   - **Size:** 1 GB (free tier allows this)

This mounts a persistent disk at the folder where the database lives (`server/data/`).

### Step 5: Set Environment Variables

In the web service dashboard:
1. Click **"Environment"** tab
2. Add:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = (type a random string, like `cu-store-secret-2024`)
   - `PORT` = (leave empty — Render sets this automatically)

### Step 6: Deploy

Render auto-deploys when you push to GitHub. You can also click **"Manual Deploy"** → **"Deploy Branch"**.

After 2-3 minutes, your app will be live at:
```
https://cu-product-expiry.onrender.com
```

### Step 7: Seed the Database (one time)

After first deploy, you need to seed the admin user. In Render dashboard:
1. Go to your web service
2. Click **"Shell"** tab
3. Run: `npm run seed`

**Login:** `admin` / `admin123`

---

## Option 2: Railway.app (Alternative)

Railway is similar to Render and also has a free tier.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `Cu-Product-expiration` repo

### Step 2: Configure

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

### Step 3: Add Volume (for SQLite)

Railway needs a persistent volume for SQLite:
1. In your project dashboard, click **"New"** → **"Volume"**
2. Mount path: `/server/data`
3. Size: 1 GB

### Step 4: Environment Variables

Add in Railway dashboard:
- `NODE_ENV` = `production`
- `SESSION_SECRET` = (random string)

### Step 5: Seed

Use Railway's shell feature to run `npm run seed`.

---

## Option 3: VPS (DigitalOcean / Linode)

If you prefer full control, rent a $6/month VPS and deploy manually.

1. SSH into the server
2. Install Node.js v20+
3. Clone the repo
4. Run `npm install && npm run build`
5. Run `npm run seed`
6. Run `npm start` (use PM2 to keep it alive)

```bash
# Quick setup (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs git

git clone https://github.com/saman-rai/Cu-Product-expiration.git
cd Cu-Product-expiration

npm install && npm run build && npm run seed
npm install -g pm2
NODE_ENV=production pm2 start server/index.js --name cu-expiry
pm2 save
pm2 startup
```

Your app will be at `http://<SERVER-IP>:3001`.

---

## Common Issues

### Database resets after deploy

If the database keeps resetting, the persistent disk isn't mounted correctly. Check:
- **Render:** The disk mount path must match exactly: `/opt/render/project/src/server/data`
- **Railway:** Volume mount path must be `/server/data`

### Blank page on first load

The build might not have finished. Wait 2-3 minutes after deploy and refresh. Check the logs for build errors.

### Login doesn't work

You probably haven't run `npm run seed` yet. The admin user (`admin` / `admin123`) is created by the seed script.

### "Cannot find module 'sql.js'"

If the build fails with module errors, the postinstall script didn't run. Check that `npm install` installed server dependencies too. You can manually run:
```bash
cd server && npm install
```

### Session keeps expiring

Sessions are stored as files in `server/data/sessions/`. This works as long as the disk is persistent. On free Render tier, the service sleeps after 15 minutes of inactivity and sessions in memory are lost — with file-store, sessions survive sleep/wake cycles.

---

## Cost Comparison

| Platform | Free Tier Limits | Cost if exceeded |
|----------|-----------------|------------------|
| **Render** | 750 hours/month (~24h/day for 31 days), 512MB RAM | $7/month |
| **Railway** | $5 credit/month (~$0.0002/hour usage) | Pay as you go |
| **VPS (DigitalOcean)** | No free tier | $6/month |

**Render free tier note:** The service goes to sleep after 15 minutes of inactivity. When someone visits, it takes 30-60 seconds to wake up. This is fine for a store management app. To prevent sleep, you'd need the paid plan ($7/month).
