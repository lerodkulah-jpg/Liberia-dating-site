# Liberia Dating Site - Deployment Configuration

## App Structure

This repository contains the Next.js application in the `love-liberia/` directory. The root project is only used to orchestrate installation and deployment commands.

## Environment Variables Required

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.lavsdjxjpihkbngqdazw.supabase.co:5432/postgres"

# Authentication and reset links
AUTH_SECRET="generate-a-long-random-production-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.example"

# Password reset email delivery
RESEND_API_KEY="re_..."
PASSWORD_RESET_FROM_EMAIL="Love Liberia <no-reply@your-domain.example>"

```

Set `DATABASE_URL` in your deployment platform environment variables before the build starts.

## Deployment Steps

1. Ensure the deploy target is the repository root, or set the project root to `love-liberia` in Vercel if your project configuration is using the app folder directly.
2. Set `DATABASE_URL` in the deployment environment.
3. Set `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, and `PASSWORD_RESET_FROM_EMAIL`.
4. Ensure Node.js >= 20.9.0 is available.
5. Install dependencies for the nested app using the configured Vercel commands.
6. Build the app with the nested Next.js project.
7. Start the server with the app's runtime settings.

## Vercel Deployment

Use the following settings in Vercel for this project:

- Root directory: `love-liberia`
- Framework: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`

The Vercel project must use `love-liberia` as its root directory. The commands are intentionally relative to that directory; using `--prefix love-liberia` as well would make Vercel look for `love-liberia/love-liberia/package.json`.

Add this environment variable in the Vercel dashboard:

- `DATABASE_URL` - Your database connection string
- `AUTH_SECRET` - A long random signing secret
- `NEXT_PUBLIC_APP_URL` - The public HTTPS URL of the app
- `RESEND_API_KEY` - API key for password reset emails
- `PASSWORD_RESET_FROM_EMAIL` - A verified sender, for example `Love Liberia <no-reply@your-domain.example>`

The repository root `vercel.json` is already configured to point at the nested app so Vercel deploys the correct Next.js project.
