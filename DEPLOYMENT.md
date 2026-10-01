# Liberia Dating Site - Deployment Configuration

## App Structure

This repository contains the Next.js application in the `love-liberia/` directory. The root project is only used to orchestrate installation and deployment commands.

## Environment Variables Required

```env
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# Production example with PostgreSQL:
# DATABASE_URL="postgresql://username:password@host:port/database_name"
```

Set `DATABASE_URL` in your deployment platform environment variables before the build starts.

## Deployment Steps

1. Ensure the deploy target is the repository root, or set the project root to `love-liberia` in Vercel if your project configuration is using the app folder directly.
2. Set `DATABASE_URL` in the deployment environment.
3. Ensure Node.js >= 20.9.0 is available.
4. Install dependencies for the nested app using the configured Vercel commands.
5. Build the app with the nested Next.js project.
6. Start the server with the app's runtime settings.

## Vercel Deployment

Use the following settings in Vercel for this project:

- Framework: `Next.js`
- Install command: `npm install --prefix love-liberia`
- Build command: `npm --prefix love-liberia run build`
- Output directory: `love-liberia/.next`

If you prefer to set the project root directly in Vercel instead of using the root `vercel.json`, set the project root to:

```text
love-liberia
```

Add this environment variable in the Vercel dashboard:

- `DATABASE_URL` - Your database connection string

The repository root `vercel.json` is already configured to point at the nested app so Vercel deploys the correct Next.js project.
