# Liberia Dating Site - Deployment Configuration

## Environment Variables Required

```env
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# For production with PostgreSQL:
# DATABASE_URL="postgresql://username:password@host:port/database_name"
```

## Deployment Steps

1. **Set DATABASE_URL** in your deployment platform environment variables
2. **Ensure Node.js >= 20.9.0** is available
3. **Build command** automatically generates Prisma types and builds Next.js app
4. **Start command** runs the Next.js server on port 3001

## Vercel Deployment

Add these environment variables in Vercel dashboard:
- `DATABASE_URL` - Your database connection string

The `vercel.json` configuration is already in place for optimal Vercel settings.
