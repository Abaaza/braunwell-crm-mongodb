# Deployment Guide for BraunewellCRM

## Production Deployment Steps

### 1. Set Up Convex Production Database

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Create a new production deployment or select your existing production deployment
3. Copy the production deployment URL

### 2. Configure Environment Variables

For production deployment on Vercel:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variables:
   - `CONVEX_DEPLOYMENT`: Your production deployment name (e.g., `prod:your-app-name`)
   - `NEXT_PUBLIC_CONVEX_URL`: Your production Convex URL

### 3. Deploy Functions to Production

1. First, authenticate with Convex:
   ```bash
   npx convex dev
   ```
   Then press Ctrl+C to exit after authentication.

2. Deploy to production:
   ```bash
   npx convex deploy --env-file .env.production.local
   ```

   Or if you've set the environment variables in your shell:
   ```bash
   CONVEX_DEPLOYMENT=prod:resilient-pig-8 npx convex deploy
   ```

### 4. Initialize Production User

There are two ways to initialize the production user:

#### Option A: Using the Script (Recommended for initial setup)

1. After deploying functions, run the initialization script:
   ```bash
   CONVEX_URL=https://resilient-pig-8.convex.cloud npx tsx scripts/init-production-user.ts
   ```

2. The script will create the production admin user:
   - Email: `aideen@braunwell.co.uk`
   - Password: `2ideen1996`
   - Role: `admin`

#### Option B: Using Convex Dashboard

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your production deployment (resilient-pig-8)
3. Navigate to Functions
4. Find and run the `auth:initializeProductionUser` mutation
5. This will create the production user

### 4. Deploy to Vercel

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure production deployment"
   git push origin main
   ```

2. Vercel will automatically deploy the changes

### 5. Verify Deployment

1. Visit your production URL
2. Log in with the production credentials:
   - Email: `aideen@braunwell.co.uk`
   - Password: `2ideen1996`

## Security Recommendations

1. **Change the password immediately** after first login
2. Consider implementing:
   - Two-factor authentication (2FA)
   - Session timeout policies
   - IP whitelisting for admin accounts
   - Regular security audits

## Removing Demo Users (If Needed)

If you've already initialized demo users and want to remove them:

1. Go to Convex Dashboard
2. Navigate to Data
3. Find the `users` table
4. Delete the demo users:
   - `admin@braunwell.com`
   - `user@braunwell.com`

## Troubleshooting

### Issue: User already exists
- This means the production user has already been created
- You can proceed with logging in

### Issue: Cannot connect to Convex
- Verify your environment variables are set correctly
- Check that your Convex deployment is active
- Ensure your production URL is correct

### Issue: Login fails
- Verify the email and password are correct
- Check that the user's `isActive` field is `true` in the database
- Look at the audit logs for any login attempts