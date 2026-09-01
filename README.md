# CommodityPlay. — Full-Stack Web App + Mobile

The definitive career and sales guide for commodity trading. Full-stack Next.js 15 web app + Expo React Native mobile app.

---

## Architecture

```
commodity-playbook-app/
├── src/                    # Next.js web app
│   ├── app/                # App Router pages
│   │   ├── (auth)/         # Login / Signup
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Member dashboard
│   │   ├── playbook/       # Full playbook (Pro+)
│   │   ├── glossary/       # Desk glossary (free)
│   │   ├── career-roadmap/ # Career roadmap (Pro+)
│   │   ├── mentor-connect/ # Mentor Connect (Elite)
│   │   ├── pricing/        # Pricing page
│   │   └── ...
│   ├── components/         # Shared components
│   ├── lib/                # Auth, Prisma, Stripe
│   └── data/               # Content data
├── prisma/
│   └── schema.prisma       # Database schema
├── mobile/                 # Expo React Native app
│   ├── app/                # Expo Router pages
│   │   ├── (tabs)/         # Dashboard, Playbook, Glossary, Profile
│   │   └── (auth)/         # Login, Signup
│   └── lib/                # API client
└── vercel.json             # Vercel config
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | Next.js 15 (App Router) |
| Database | Neon Postgres (via Vercel Marketplace) |
| Auth | Auth.js v5 (NextAuth) + bcrypt |
| Payments | Stripe (one-time + subscriptions) |
| ORM | Prisma |
| Styling | Tailwind CSS + Framer Motion |
| UI Components | Custom + Radix UI primitives |
| Email | Resend |
| Mobile | Expo (React Native) |
| Hosting | Vercel |

## Membership Tiers

| Tier | Price | Access |
|---|---|---|
| **Starter** | Free | 5 infographics, Chapter A preview, Desk Glossary, Weekly Digest |
| **Pro** | SGD 99 one-time | Full Playbook (5ch), Resume Templates, Career Roadmap, Interview Qs, Knowledge Test |
| **Elite** | SGD 299/month | Everything in Pro + Case Studies, Desk Channel, Mentor Connect, Job Openings |

## Personas

- 🎓 Fresh Graduate
- 🔄 Career Switcher
- ⚡ Industry Insider
- 📊 Analyst / Trader
- 🤝 Vendor / Supplier

---

## Demo Accounts

After setting up your database, seed demo accounts:

```bash
npm run db:push
npm run db:seed
```

**Password for all demo accounts:** `Demo1234!`

| Email | Role | Tier | Persona | Track |
|---|---|---|---|---|
| `admin@demo.com` | Admin | Elite | Insider | Career |
| `starter.fresh@demo.com` | User | Starter | Fresh Grad | Career |
| `starter.vendor@demo.com` | User | Starter | Vendor | Sales |
| `pro.switcher@demo.com` | User | Pro | Career Switcher | Career |
| `pro.analyst@demo.com` | User | Pro | Analyst / Trader | Career |
| `pro.vendor@demo.com` | User | Pro | Vendor | Sales |
| `elite.insider@demo.com` | User | Elite | Insider | Career |
| `elite.vendor@demo.com` | User | Elite | Vendor | Sales |

Try them at `/demo` (one-click sign-in) or from the login page quick-picker.

**Admin panel:** `/admin` — manage users, answer mentor questions, view waitlist.

---

## Quick Start

### 1. Install dependencies

```bash
cd commodity-playbook-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in all values (see below)
```

### 3. Set up database

```bash
# Push schema to Neon Postgres
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run development server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Run mobile app

```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app
```

---

## Deployment to Vercel

### Web App

1. **Push to GitHub**:
   ```bash
   git init && git add . && git commit -m "initial commit"
   gh repo create commodity-playbook --private --push
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Set Root Directory to `.` (or leave default)

3. **Add Neon Postgres** via Vercel Marketplace:
   - Marketplace → Neon → Add → Copies `DATABASE_URL` automatically

4. **Set environment variables** in Vercel Dashboard → Settings → Environment Variables:
   ```
   AUTH_SECRET=          (generate: openssl rand -base64 32)
   NEXTAUTH_URL=         https://your-domain.vercel.app
   GOOGLE_CLIENT_ID=     (from Google Cloud Console)
   GOOGLE_CLIENT_SECRET= (from Google Cloud Console)
   STRIPE_SECRET_KEY=    (from Stripe Dashboard)
   STRIPE_PRO_PRICE_ID=  (create in Stripe Products)
   STRIPE_ELITE_PRICE_ID=(create in Stripe Products)
   STRIPE_WEBHOOK_SECRET=(from Stripe Webhooks)
   RESEND_API_KEY=       (from resend.com)
   ```

5. **Configure Stripe Webhook**:
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`

6. **Stripe receipt emails (Dashboard — recommended in addition to app emails)**:
   - Settings → Emails → enable **Successful payments** and **Invoices**
   - Settings → Branding → add CommodityPlay. logo and accent colour `#0830a0`

7. **Stripe Customer Portal** (Settings → Billing → Customer portal):
   - Enable payment method update, invoice history, subscription cancellation
   - Optional: copy Configuration ID → `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`

8. **Deploy**: Vercel auto-deploys on every git push to `main`

### Mobile App (Expo)

```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform all  # First build (creates .ipa + .apk)
eas submit                 # Submit to App Store + Google Play
```

---

## Stripe Products Setup

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create **Pro** product:
   - Name: "CommodityPlay. Pro"
   - Pricing: One-time, SGD 99.00
   - Copy Price ID → `STRIPE_PRO_PRICE_ID`
3. Create **Elite** product:
   - Name: "CommodityPlay. Elite"
   - Pricing: Recurring, SGD 299.00/month
   - Copy Price ID → `STRIPE_ELITE_PRICE_ID`

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable "Google+ API"
3. Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy Client ID and Secret to env vars

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create new user account |
| POST | `/api/stripe/checkout` | Required | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe sig | Handle Stripe events |
| POST | `/api/user/persona` | Required | Update user persona + track |
| GET/POST | `/api/user/progress` | Required | Get/update chapter progress |
| GET/POST | `/api/mentor-connect` | Elite | Submit/get mentor questions |
| POST | `/api/waitlist` | None | Join job board waitlist |

---

## QA Checklist

- [ ] All env vars set in Vercel
- [ ] `DATABASE_URL` from Neon (auto-set by Marketplace)
- [ ] `AUTH_SECRET` is a random 32-byte string
- [ ] Stripe products created and price IDs match
- [ ] Stripe webhook endpoint registered with correct events
- [ ] Google OAuth redirect URI matches production URL
- [ ] Test complete purchase flow (Stripe test mode → real upgrade)
- [ ] Test all 3 tier levels (Starter / Pro / Elite) access gates
- [ ] Mobile app connects to production API
- [ ] Verify Prisma schema is migrated (`npm run db:push`)
