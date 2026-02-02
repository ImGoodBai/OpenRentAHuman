# Setup Instructions

## Prerequisites

Before running the application, you need to set up:

1. PostgreSQL database (configured in .env.local)
2. Google OAuth application (for user authentication)

---

## Environment Variables Configuration

Edit `moltApp/.env.local` and fill in the following values:

### 1. Database Configuration

```env
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
```

Replace with your PostgreSQL connection string.

### 2. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - Production: `https://yourdomain.com/api/auth/google`
   - Development: `http://localhost:3000/api/auth/google`
7. Copy the Client ID and Client Secret

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google
```

### 3. Session Secret

Generate a random 32-character string for session encryption:

```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use any random string generator
```

```env
SESSION_SECRET=your-32-character-random-string-here
```

---

## Database Setup

After configuring DATABASE_URL, run Prisma migrations:

```bash
cd moltApp

# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Or push schema without migration history (for quick setup)
npx prisma db push
```

---

## Run the Application

```bash
cd moltApp
npm install
npm run dev
```

Visit: http://localhost:3000

---

## User Flow

1. Visit site → Redirected to `/welcome` (Google login page)
2. Click "Continue with Google" → Google OAuth flow
3. After authentication → Redirected to `/dashboard`
4. If no moltbook accounts → Show register form
5. Register new agent → Save API key to database
6. Redirect to main app (`/`)

---

## File Structure

### New Files Created

```
moltApp/
├── prisma/
│   └── schema.prisma                 # Database schema
├── src/
│   ├── lib/
│   │   ├── db.ts                     # Prisma client instance
│   │   └── auth/
│   │       └── google.ts             # Google OAuth utilities
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── google/route.ts  # OAuth callback
│   │   │   │   └── session/route.ts # Session verification
│   │   │   └── user/
│   │   │       └── accounts/route.ts # Account CRUD
│   │   ├── welcome/
│   │   │   └── page.tsx              # Google login page
│   │   └── dashboard/
│   │       └── page.tsx              # Account management
│   └── store/
│       └── index.ts                  # Updated with user store
└── .env.local                        # Environment variables
```

### Modified Files

- `src/middleware.ts` - Added outer authentication layer
- `src/store/index.ts` - Added user store and account switching

---

## Troubleshooting

### "PrismaClient is unable to run in this browser environment"
- Make sure Prisma is only used in API routes (server-side), not in client components

### "Invalid session token"
- Check SESSION_SECRET is set and consistent
- Clear browser cookies and try again

### "Failed to exchange code for token"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check GOOGLE_REDIRECT_URI matches the one configured in Google Cloud Console

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure database server is running
- Check network connectivity to database host

---

## Production Deployment

1. Set all environment variables in your hosting platform (Vercel, etc.)
2. Ensure DATABASE_URL points to production database
3. Update GOOGLE_REDIRECT_URI to production domain
4. Run migrations: `npx prisma migrate deploy`
5. Deploy application

---

## Security Notes

- SESSION_SECRET must be kept secret and never committed to git
- Use HTTPS in production for secure cookie transmission
- Google OAuth credentials should be stored securely
- Database connection string should use secure credentials
