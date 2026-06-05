# PROJECT_MAP — Digital Marketplace Platform (SuqAI)

> Last updated: 2026-06-02 | Status: **In Development (M1-M4 Complete)**

---

## [TECH_STACK]

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Runtime | Node.js | 22.x (LTS) | Confirmed |
| Language | TypeScript | 6.0.3 | Confirmed |
| Framework (Web) | Next.js | 16.2.6 | Confirmed |
| Styling | Tailwind CSS | 4.x | Confirmed |
| UI Components | shadcn/ui | latest | Confirmed |
| ORM | Prisma | 7.8.0 | Confirmed |
| Database | PostgreSQL | 18.4 | Confirmed |
| Cache / Queue | Redis | 8.8.0 | Confirmed |
| Auth | NextAuth.js | v5 | Confirmed |
| Forms | react-hook-form + zod | latest | Confirmed |
| AI Service | Python FastAPI | latest | Confirmed |
| AI NLP | sentence-transformers | latest | Candidate |
| Container | Docker + Compose | latest | Confirmed |
| CI/CD | GitHub Actions | — | Planned |

### Current Versions (as installed):
- Node.js **22.14.0** (LTS)
- Prisma Client **6.19.3** (npm: ^6)
- NextAuth.js **5.0.0-beta.28** (with --legacy-peer-deps for Next.js 16 compat)

### Why NOT:
- **No NestJS**: Next.js API routes + Server Actions suffice for MVP (2-3 dev team). Extract later if needed.
- **No Elasticsearch**: PostgreSQL Full-Text Search + pgvector handles MVP search. ES adds operational cost.
- **No Microservices**: Monolith first; extract bounded contexts when team grows.
- **No React Native**: Mobile web (PWA) for MVP. Native app in Phase 2.

---

## [ARCHITECTURE]

### High-Level Layers

```
┌──────────────────────────────────────────────┐
│              Presentation Layer               │
│  (React Server Components / Client Comps)     │
├──────────────────────────────────────────────┤
│             Application Layer                 │
│  (API Routes / Server Actions / Services)     │
├──────────────────────────────────────────────┤
│              Domain Layer                     │
│  (Modules: City, Sector, Merchant, Product,   │
│   Review, Order, Notification, Auth)          │
├──────────────────────────────────────────────┤
│              Infrastructure Layer             │
│  (Prisma Client / Redis / S3 / AI Proxy)      │
└──────────────────────────────────────────────┘
```

### Module Structure (Domain-Driven)

Each module in `apps/web/src/modules/<name>/` follows:
```
module/
  ├── index.ts          # public exports
  ├── types.ts          # domain types
  ├── validation.ts     # zod schemas
  ├── service.ts        # business logic
  ├── repository.ts     # Prisma queries
  ├── api.ts            # API route handlers
  └── components/       # React components (if any)
```

### Data Flow

```
Browser ←→ Next.js Server Components ←→ Server Actions / API Routes
                                          │
                                    ┌─────┴─────┐
                                    │  Service   │
                                    │  Layer     │
                                    └─────┬─────┘
                                     ┌────┴────┐
                                     │ Prisma  │
                                     │ ORM     │
                                     └────┬────┘
                                     ┌────┴────┐
                                     │PostgreSQL│
                                     └─────────┘
```

For AI: `Browser ←→ API Route ←→ Python FastAPI (HTTP)`

### Route Map (Next.js App Router)

```
/                                   ← Landing page → city selection
/[city]/                            ← City dashboard
/[city]/[sector]/                   ← Sector listing (sub-sectors + merchants)
/[city]/[sector]/[merchant]         ← Merchant showroom (products, reviews, info)
/[city]/[sector]/[merchant]/product/[id] ← Product detail
/api/auth/*                         ← NextAuth.js
/api/cities/*                       ← City CRUD
/api/sectors/*                      ← Sector CRUD
/api/merchants/*                    ← Merchant CRUD
/api/products/*                     ← Product CRUD
/api/reviews/*                      ← Reviews
/api/orders/*                       ← Orders
/api/ai/*                           ← AI assistant proxy
/dashboard/merchant/*               ← Merchant dashboard
/dashboard/admin/*                  ← Admin panel
```

---

## [SYSTEM_FLOW]

### User Journey (Consumer)

```
1. Landing Page → Select City
2. City Dashboard → View Sectors
3. Select Sector → Browse Sub-sectors / Merchants
4. Select Merchant → View Showroom (products, reviews, info)
5. Filter / Search within sector
6. View Product Details
7. Save to Favorites / Request Quote / Contact Merchant
8. Leave Review
```

### User Journey (Merchant)

```
1. Register / Login
2. Complete Profile (city, sector, description, location, hours)
3. Add Products / Services (name, description, price, images)
4. Manage Orders (view requests, accept/reject)
5. View Reviews
6. Dashboard Stats (views, orders, ratings)
```

### AI Assistant Flow

```
1. Consumer clicks AI Assistant button
2. Sends query (text) → POST /api/ai/chat
3. Next.js proxies → Python FastAPI /chat
4. Python: intent classification → entity extraction → DB query → response
5. Response returned to consumer in chat UI
```

---

## [IMPLEMENTATION_STATUS]

### ✅ Milestone 1 — Foundation (COMPLETE)
- [x] Next.js 16 + TypeScript 6.0 + Tailwind v4 scaffolded
- [x] Prisma schema + models (User, City, Sector, Merchant, Product, Review, Order, OrderItem, Favorite, Message, Ticket, Notification)
- [x] Seed script (سيئون only, 7 sectors, 10 merchants, 42 products, reviews, orders, coupons)
- [x] `src/lib/` — prisma singleton, logger (async JSON), auth (bcrypt + session), utils
- [x] RTL layout (Tajawal font) + responsive container
- [x] Landing page (city selection grid)
- [x] City dashboard page (sectors per city)
- [x] Sector page (sub-sectors + merchant list)
- [x] Merchant showroom (info, working hours, products, reviews)
- [x] Auth pages (login/register with form validation)
- [x] API routes: auth (login/register/me), cities, sectors, merchants, products, reviews, orders, favorites, AI chat
- [x] Docker Compose (PostgreSQL 18, Redis 8.8, web, AI assistant)
- [x] Python FastAPI AI service scaffolded
- [x] TypeScript compiles with zero errors (`tsc --noEmit`)

### 🏗️ Milestone 2 — Merchant Tools (COMPLETE)
- [x] Merchant dashboard (stats cards + quick links)
- [x] Merchant registration via register page (2 account types: customer/merchant)
- [x] Merchant pending approval workflow (register → admin verify → active)
- [x] Admin approve/reject merchants with notification
- [x] Product CRUD (add/list/delete in merchant dashboard)
- [x] Order management (list + accept/reject)
- [x] Reviews page for merchant
- [x] AI chat endpoint (keyword-based intent matching)
- [x] Favorites toggle on product cards (FavoriteButton component)
- [x] ReviewForm component on merchant page
- [x] RequestQuoteButton contact form on merchant page
- [x] Merchant settings (edit profile, working hours customization, brand logo upload)

### ✅ Milestone 3 — Consumer Features (COMPLETE)
- [x] Product detail page (`/[city]/[sector]/[merchant]/product/[id]`)
- [x] AI assistant chat widget (floating button in Header)
- [x] Favorites page for consumer (`/dashboard/favorites`)
- [x] Order history page for consumer (`/dashboard/orders`)
- [x] Full-text search across products/merchants (`/api/search` + `/search` page with filters)
- [x] Filter + search by price/category/tags on sector page

### ✅ Milestone 4 — Launch Readiness (COMPLETE)
- [x] Admin: manage cities (`/dashboard/admin/cities`) — includes image URL on create + table thumbnail
- [x] Admin: manage sectors (`/dashboard/admin/sectors`) — includes image URL on create + table thumbnail
- [x] Sector images: seed data (8 Wikimedia images per sector type), display in city & sector pages
- [x] Admin: manage merchants (`/dashboard/admin/merchants`)
- [x] Merchant settings page (`/dashboard/merchant/settings`)
- [x] SEO: generateMetadata for all dynamic pages, OG tags, Twitter cards
- [x] PWA support (manifest.json, service worker sw.js, apple-touch-icon)
- [x] Security: rate limiting middleware (60 req/min per IP)
- [x] Global loading.tsx with spinner

## [KNOWN_FIXES]
- **2026-05-30**: `DATABASE_URL` في `.env` و `.env.example` — كانت تستخدم متغيرات شل (`${DB_USER}`) التي لا يدعمها Prisma CLI. تم توسيعها إلى قيم حرفية.
- **2026-05-30**: `pg_hba.conf` في حاوية PostgreSQL — تم تغيير `host all all all scram-sha-256` إلى `trust` لحل مشكلة مصادقة TCP عبر Docker NAT.
- **2026-05-30**: `src/lib/logger.ts` — `process.on()` و `setInterval(flush)` على مستوى الوحدة يسببان `TypeError: process.on is not a function` في Edge Runtime (الميدلوير يستورد `logger`). تم لفّهما في حارس `typeof process.on === "function"`.
- **2026-05-30**: إصلاح شامل لـ ESLint (15 مشكلة في 10 ملفات): إزالة `any[]` من seed.ts (استبدال بواجهات محددة)، إزالة 4 متغيرات غير مستخدمة، إزالة `fallback` prop من ImageWithFallback، إزالة `redisClient` الميت، إضافة eslint-disable للـ service worker و no-img-element.
- **2026-06-01**: إصلاح `db:seed` — إضافة `dotenv-cli` إلى devDependencies وتغيير script `db:seed` ليقرأ `.env` قبل `tsx`. حل مشكلة "البريد الإلكتروني أو كلمة المرور غير صحيحة" للـ admin بسبب أن `tsx` لا يقرأ `.env` تلقائياً فكان `SEED_PASSWORD=undefined` ويتولد باسورد عشوائي.
- **2026-06-01**: تحديث نص FAQ — تغيير "منصة رقمية سعودية" إلى "منصة رقمية يمنية" في السؤال "ما هي منصة سوقي؟" (`src/app/faq/page.tsx`).
- **2026-06-01**: إصلاح مفتاح React المكرر `cmpvtovox000ax2cgmqwjcr1q` في `MessagesPage` — السبب: EventStream يُضيف رسالة موجودة مسبقاً (بعد POST أو initial fetch) دون التحقق من التكرار. التعديل: إضافة `prev.some(m => m.id === msg.id)` قبل الإضافة في `es.onmessage` (`src/app/messages/page.tsx:49`).
- **2026-06-01**: إصلاح `workingHours.map is not a function` في صفحة التاجر (`[merchant]/page.tsx:106`) — السبب: `JSON.stringify()` في البذرة يحول المصفوفة لنص داخل `jsonb`، فيقرأها Prisma كـ string وليس array. التعديل: إزالة `JSON.stringify()` من `prisma/seed.ts:235`، وإصلاح بيانات التجار الحاليين عبر `UPDATE merchants SET working_hours = (working_hours #>> '{}')::jsonb`.
- **2026-06-02**: إضافة تخصيص ساعات العمل في إعدادات التاجر — `src/lib/schemas.ts` (إضافة `workingHours: z.any().optional()` إلى `updateMerchantSchema`)، `src/app/api/merchants/update/route.ts` (تمرير `workingHours` إلى Prisma update)، `src/app/dashboard/merchant/settings/MerchantSettingsForm.tsx` (واجهة اختيار وقت الفتح/الإغلاق لكل يوم من السبت إلى الخميس مع fallback آمن عند `null`).
- **2026-06-02**: إضافة رفع شعار المتجر (Brand Logo) في إعدادات التاجر — `src/lib/schemas.ts` (إضافة `logo: z.string().optional().nullable()` إلى `updateMerchantSchema`)، `src/app/api/merchants/update/route.ts` (تمرير `logo` إلى Prisma update)، `src/app/dashboard/merchant/settings/MerchantSettingsForm.tsx` (واجهة رفع صورة مع معاينة، زر إزالة، استخدام API `/api/upload` الموجود — بدون إضافة API جديد).
- **2026-06-02**: تحويل مصادقة المستخدمين من Email Only إلى Hybrid (Phone Required + Email Optional): `prisma/schema.prisma` (`phone String @unique`، `email String? @unique`), `src/lib/schemas.ts` (`registerSchema`: phone إجباري + email اختياري، `loginSchema`: يقبل phone أو email), `src/lib/auth.ts` (`login()` يبحث بـ phone OR email، `register()` يتحقق من تكرار phone أولاً), `src/app/api/auth/register/route.ts` (تحقق بتكرار phone + email اختياري للتاجر), `src/app/auth/login/LoginForm.tsx` (تغيير label + type), `src/app/auth/register/RegisterForm.tsx` (phone إجباري للجميع + email اختياري), `src/app/api/admin/merchants/route.ts` (إضافة duplicate phone check), `prisma/seed.ts` (إضافة phone للمدير).

## [ORPHANS & PENDING]

### Pending Decisions
- [ ] Cloud provider (determines: S3 vs Blob vs GCS, managed DB vs self-hosted, domain)
- [ ] Mobile app timeline (React Native or Flutter?)
- [ ] SMS/OTP provider for phone verification
- [ ] Email service (SendGrid, SES, etc.)
- [ ] CDN for images/videos
- [ ] Payment gateway partner (Moyasar, PayTabs, etc.) — Phase 2
- [ ] Map provider (Google Maps vs OpenStreetMap/Leaflet)
- [ ] Sentry or similar for error tracking

### Deferred Features (Post-MVP)
- [ ] Mobile native apps (React Native)
- [ ] Payment integration
- [ ] Advertising platform
- [ ] Full CRM system
- [ ] Predictive AI analytics
- [ ] Public REST API
- [ ] Multi-language support
- [ ] Booking calendar system
- [ ] Advanced analytics dashboard
- [ ] Live chat (WebSocket)
- [ ] Account verification badges
- [ ] Subscription/membership tiers
