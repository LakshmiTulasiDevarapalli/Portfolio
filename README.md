# 📁 Portfolio Resources App

A full-stack Next.js 14 + Supabase portfolio application featuring:
- **Resources page** — Browse PDF, Word, Excel, PowerPoint, and link resources
- **Gated downloads** — Request access → admin approves → secure email with download link
- **Experience page** — Work history, skills, education, certifications
- **Contact page** — Contact form with social links
- **Admin dashboard** — Upload files, manage resources, approve/reject requests

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Storage** → Create a new bucket named `resources` (set to **private**)
4. In Storage → `resources` bucket → Policies, add:
   - Allow service role full access (INSERT, SELECT, DELETE)

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret!) |
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (usually `587`) |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | App password (Gmail: generate in account settings) |
| `OWNER_EMAIL` | Where alert emails are sent (usually same as SMTP_USER) |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (or `http://localhost:3000`) |

### 4. Gmail App Password Setup
If using Gmail SMTP:
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail" and use it as `SMTP_PASS`

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
portfolio-app/
├── app/
│   ├── page.tsx                  # Home page
│   ├── resources/page.tsx        # Resources gallery + request modal
│   ├── experience/page.tsx       # Work history & skills
│   ├── contact/page.tsx          # Contact form
│   ├── admin/
│   │   ├── page.tsx              # Admin login
│   │   └── dashboard/page.tsx   # Admin dashboard (upload + manage)
│   └── api/
│       ├── admin-login/          # POST — authenticate admin
│       ├── admin-requests/       # GET  — fetch all access requests
│       ├── request-access/       # POST — submit download request + email alert
│       ├── approve-access/       # POST — approve/reject + send download email
│       ├── upload-resource/      # POST — upload file to Supabase Storage
│       └── download/             # GET  — validate token + serve signed URL
├── components/
│   └── Navigation.tsx            # Top nav bar
├── lib/
│   └── supabase.ts               # Supabase client + types
├── supabase-schema.sql           # Full DB schema to run in Supabase
└── .env.local.example            # Environment variable template
```

---

## 🔄 User Flow

### Resource Download Flow
```
User visits /resources
  → Sees resource cards
  → Clicks "Request Access"
  → Fills name + email + reason
  → POST /api/request-access
      → Creates DB record
      → Emails OWNER_EMAIL with alert
  → Admin sees pending badge in dashboard
  → Admin clicks "Approve"
  → POST /api/approve-access
      → Generates secure token (72hr expiry)
      → Emails requester with download link
  → Requester clicks link in email
  → GET /api/download?token=xxx
      → Validates token + expiry
      → Generates Supabase signed URL (60s)
      → Redirects to file download
```

### Admin Flow
```
Admin visits /admin
  → Enters email + password
  → POST /api/admin-login → JWT token stored in sessionStorage
  → Redirected to /admin/dashboard
  → Upload tab: drag & drop files → Supabase Storage
  → Requests tab: view pending/approved/rejected
  → Click Approve/Reject → email sent automatically
```

---

## 🎨 Customization

### Update Your Info
- **Experience**: Edit the `EXPERIENCE`, `SKILLS`, `EDUCATION`, `CERTIFICATIONS` arrays in `app/experience/page.tsx`
- **Contact**: Edit the `CONTACT_INFO` object in `app/contact/page.tsx`
- **Brand**: Update colors in `app/globals.css` CSS variables

### Supported File Types
| Type | Extension | Icon Color |
|---|---|---|
| PDF | .pdf | Red |
| Word | .docx, .doc | Blue |
| Excel | .xlsx, .xls | Green |
| PowerPoint | .pptx, .ppt | Amber |
| Link | URL | Purple |

---

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL after deployment.

---

## 🔒 Security Notes

- Admin token is a HMAC-signed payload stored in `sessionStorage` (cleared on tab close)
- Download tokens are 32-byte random hex strings with 72-hour expiry
- All file uploads go through the server (admin token verified before any write)
- Supabase Storage bucket is private — files only accessible via signed URLs
- Service role key is **never** exposed to the client
