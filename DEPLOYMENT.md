# Liberia Dating Site - Deployment Configuration

## App Structure

This repository contains the Next.js application in the `love-liberia/` directory. The root project is only used to orchestrate installation and deployment commands.

## Environment Variables Required

```env
# Database Configuration
# For Vercel/serverless, copy Supabase's Transaction pooler URI (port 6543).
# Replace the placeholders using Supabase Dashboard > Connect > Transaction pooler.
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Private profile-photo storage; server-side only
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-side-service-role-key"

# Authentication and reset links
AUTH_SECRET="generate-a-long-random-production-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.example"

# Password reset email delivery (verify this sender in Brevo)
BREVO_API_KEY="your-brevo-api-key"
PASSWORD_RESET_FROM_EMAIL="Love Liberia <no-reply@your-domain.example>"

# Email sign-in code delivery
RESEND_API_KEY="re_..."
AUTH_EMAIL_FROM="Love Liberia <no-reply@your-domain.example>"

```

Set `DATABASE_URL` in your deployment platform environment variables before the build starts.
Keep the transaction-pooler URL for Vercel runtime queries; use a direct or session-pooler URL for migration commands.

## Private Profile Photo Storage

Create a **private** Supabase Storage bucket named `profile-photos`. Do not make the bucket public or add anonymous/authenticated read policies. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-only environment variables in local development and on the deployment platform. Never prefix the service-role key with `NEXT_PUBLIC_` or include it in browser code.

## Database Migrations

Apply pending Prisma migrations before deploying schema-dependent application changes. From the repository root, with a valid PostgreSQL `DATABASE_URL`, run:

```powershell
npx prisma migrate deploy --schema component/prisma/schema.prisma
```

Use a direct or session-pooler PostgreSQL connection for migrations rather than the transaction-pooler URL configured for serverless runtime queries. The Vercel build command generates Prisma Client but does not apply database migrations automatically.

Prisma migrations enable row-level security on every table in the `public` schema. They intentionally add no browser-facing policies; database access must remain server-side.

Deploy the redirect and authenticated photo route before migrating existing profile photos. Then, with the private bucket created and the server-side Supabase storage variables configured, set a direct/session-pooler `DATABASE_URL` and those storage variables in the repository-root `.env`. Run this from the repository root to copy files from `love-liberia/public/uploads/profiles` into the private bucket and rewrite their database URLs:

```powershell
npm --prefix love-liberia run migrate:profile-photos
```

The migration script validates existing files and supports safe retries. It does not delete the local source files. New profile-photo uploads use the private bucket, and the application serves them only after checking profile visibility, account status, and blocking; profile-verification moderators retain access for review. Keep the service-role key server-side.

## PayPal Checkout

Both the PayPal option and the credit/debit-card option use PayPal Checkout, so
payments are processed by the PayPal account belonging to the configured app
credentials. PayPal may not offer card checkout to every buyer; card availability
depends on PayPal's eligibility and buyer location. To enable checkout on the
membership and wallet forms, configure
`PAYMENT_PAYPAL_CLIENT_ID` and `PAYMENT_PAYPAL_CLIENT_SECRET` from a PayPal
Developer Dashboard app. Start with `PAYMENT_PAYPAL_MODE=sandbox`; set it to
`live` only when using live credentials. PayPal checkout currently charges in
USD. For the production app credentials, use the PayPal Business account where
you want funds received. Add these variables to `love-liberia/.env` for local
development and to the deployment platform for production.

## Deployment Steps

1. Ensure the deploy target is the repository root, or set the project root to `love-liberia` in Vercel if your project configuration is using the app folder directly.
2. Set `DATABASE_URL` in the deployment environment.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `BREVO_API_KEY`, `PASSWORD_RESET_FROM_EMAIL`, `RESEND_API_KEY`, and `AUTH_EMAIL_FROM`.
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

- `DATABASE_URL` - Supabase Transaction pooler connection string for Vercel (port 6543, `pgbouncer=true`)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` - private profile-photo storage access; server-side only
- `AUTH_SECRET` - A long random signing secret
- `NEXT_PUBLIC_APP_URL` - The public HTTPS URL of the app
- `BREVO_API_KEY` - Brevo API key for password reset emails
- `PASSWORD_RESET_FROM_EMAIL` - A sender verified in Brevo, for example `Love Liberia <no-reply@your-domain.example>`
- `RESEND_API_KEY` - Resend API key for email sign-in codes
- `AUTH_EMAIL_FROM` - A verified sender for sign-in codes; defaults to `PASSWORD_RESET_FROM_EMAIL`
- `PAYMENT_PAYPAL_CLIENT_ID` and `PAYMENT_PAYPAL_CLIENT_SECRET` - PayPal app credentials (optional; required to offer PayPal)
- `PAYMENT_PAYPAL_MODE` - `sandbox` for testing or `live` for production

The repository root `vercel.json` is already configured to point at the nested app so Vercel deploys the correct Next.js project.
