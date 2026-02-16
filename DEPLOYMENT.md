# Deployment Guide

This guide will help you deploy your Flight Search App to **Render (backend)** and **Vercel (frontend)** using their free tiers.

## Prerequisites

- GitHub account (already set up ✅)
- Render account ([render.com](https://render.com))
- Vercel account ([vercel.com](https://vercel.com))
- Amadeus API credentials

## Part 1: Deploy Backend to Render

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

### 2. Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `60squared/flight-search-app`
3. Configure the service:
   - **Name**: `flight-search-backend` (or your choice)
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (render.yaml will handle this)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd backend && npx prisma migrate deploy && npm start`
   - **Plan**: Free

### 3. Add Environment Variables
In Render dashboard, add these environment variables:
- `NODE_ENV` = `production`
- `AMADEUS_API_KEY` = `your_amadeus_api_key`
- `AMADEUS_API_SECRET` = `your_amadeus_secret`
- `AMADEUS_BASE_URL` = `https://test.api.amadeus.com`
- `FRONTEND_URL` = `https://your-frontend.vercel.app` (update after Vercel deployment)
- `PORT` = `10000`

**Note**: `DATABASE_URL` will be automatically set by Render when you add the database

### 4. Add PostgreSQL Database
1. In your Render dashboard, go to "New +" → "PostgreSQL"
2. Name it: `flight-search-db`
3. Database name: `flightsearch`
4. Plan: Free
5. After creation, go back to your web service
6. In "Environment" tab, add environment variable:
   - Key: `DATABASE_URL`
   - Value: Select "Internal Database URL" from your `flight-search-db`

### 5. Deploy
- Click "Create Web Service"
- Render will automatically deploy
- Wait for build to complete (~3-5 minutes)
- Copy your backend URL: `https://flight-search-backend-xxxx.onrender.com`

**Important**: Free tier services spin down after 15 minutes of inactivity. First request after inactivity may take 30-60 seconds.

## Part 2: Deploy Frontend to Vercel

### 1. Prepare Frontend
Update the production environment variable with your Render backend URL:

```bash
# In frontend directory, create .env.production file
echo "VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api" > frontend/.env.production
```

Replace `your-render-backend-url` with your actual Render URL from Part 1.

### 2. Commit Changes
```bash
git add .
git commit -m "Add deployment configuration for Render and Vercel"
git push origin main
```

### 3. Deploy to Vercel
Two options:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `60squared/flight-search-app`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-render-backend-url.onrender.com/api`
5. Click "Deploy"

### 4. Update Backend CORS
After Vercel deployment, update your Render backend:
1. Go to Render dashboard → Your web service
2. Update `FRONTEND_URL` environment variable with your Vercel URL:
   - `FRONTEND_URL` = `https://your-app.vercel.app`
3. Render will automatically redeploy

## Part 3: Verify Deployment

### Test Backend
```bash
curl https://your-backend.onrender.com/api/flights/health
```

Expected response:
```json
{
  "status": "healthy",
  "amadeusConnection": "connected"
}
```

### Test Frontend
1. Open your Vercel URL in browser
2. Try searching for flights (e.g., LAX → JFK)
3. Verify results load correctly

## Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure database is connected

**"Failed to authenticate with Amadeus API"**
- Verify `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` in Render
- Check you're using test environment URL for test credentials

**"Database connection error"**
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL database is running in Render
- Review Prisma migration logs

### Frontend Issues

**"Network Error" or API calls fail**
- Verify `VITE_API_BASE_URL` points to correct Render URL (with `/api`)
- Check CORS settings in backend
- Verify backend is running (not spun down)

**"Build failed"**
- Check build logs in Vercel
- Verify all dependencies are in package.json
- Ensure environment variables are set

### Performance Notes

**First Request Slow (Render Free Tier)**
- Free services spin down after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast
- To keep always-on: upgrade to paid plan ($7/month)

## Costs

- **Render Backend**: $0/month (Free tier)
- **Render PostgreSQL**: $0/month (Free tier, 90-day data retention)
- **Vercel Frontend**: $0/month (Free tier)
- **Total**: $0/month ✨

## Production Considerations

When moving to production:

1. **Amadeus API**:
   - Switch to production API URL: `https://api.amadeus.com`
   - Use production credentials
   - Monitor API usage and upgrade plan if needed

2. **Database**:
   - Free tier has 90-day data retention
   - For permanent storage, upgrade to paid plan ($7/month)
   - Set up automated backups

3. **Backend Hosting**:
   - Free tier spins down after inactivity
   - For always-on service, upgrade to paid plan
   - Consider alternatives: Railway ($5/month), Fly.io (free tier available)

4. **Custom Domain** (Optional):
   - Add custom domain in Vercel (free)
   - Add custom domain in Render (requires paid plan)

5. **Monitoring**:
   - Set up error tracking (Sentry, LogRocket)
   - Monitor API usage and costs
   - Set up uptime monitoring

## Support

- Render Docs: [render.com/docs](https://render.com/docs)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Amadeus API: [developer.amadeus.com/docs](https://developer.amadeus.com/docs)

---

**Need help?** Open an issue in the GitHub repository.
