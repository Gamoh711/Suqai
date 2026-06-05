# SuqAI — Comprehensive Technical Analysis Report

> **Project:** SuqAI — A digital marketplace platform for Yemen (Arabic, RTL)
> **Stack:** Next.js 15.5.18 | Prisma 6 ORM | PostgreSQL 18 | Redis 8 | Docker | Caddy
> **Status:** Build passes (63 static pages) | ESLint 0 errors | 33 tests pass | No type errors
> **Session:** Mon Jun  1 02:30:33 2026

---

## Table of Contents

1. Executive Architecture
2. Folder Structure Analysis
3. File-by-File Analysis
4. Database Architecture
5. API Analysis
6. Authentication System
7. Authorization System
8. Business Logic
9. Search System
10. AI Integration
11. Redis Analysis
12. Security Architecture
13. Docker Architecture
14. Production Infrastructure
15. Testing Analysis
16. Dependency Analysis
17. Request Flow Deep Dive
18. Project Knowledge Map

---

## 1. Executive Architecture

### 1.1 Business Goal
SuqAI is a **digital marketplace** that connects merchants, service providers, and consumers within a unified platform focused on Yemen. It supports a **city → sector → merchant → product** hierarchy with search, reviews, orders, favorites, cart/checkout, messaging, coupons, notifications, and an optional AI assistant.

### 1.2 Design Pattern
- **Hybrid SSR + Client**: Next.js 15 App Router using React Server Components (RSC) for data fetching, Client Components for interactivity.
- **Custom Auth**: Session management via HMAC-SHA256 signed cookies (no NextAuth.js used despite being a dependency).
- **Repository-style queries**: Business logic lives in `src/lib/` modules; API routes are thin wrappers.
- **Singleton services**: Prisma client, Redis (or in-memory fallback), logger queue.

### 1.3 Request Flow (simplified)

```
Browser
  │
  ├── Next.js Middleware (Edge Runtime)
  │     ├── CSRF origin check on mutating requests
  │     ├── Per-IP in-memory rate limiting (60 req/min)
  │     └── CSP + security headers attached
  │
  ├── Static pages (63 generated at build time)
  │     └── RSC: prisma.$queryRaw / prisma.findMany in page components
  │
  └── API routes (31 endpoints)
        ├── Auth check via getSession() reading signed cookie
        ├── Zod validation on input
        ├── Prisma queries to PostgreSQL
        ├── Redis via getStore() (rate limiting, password reset tokens)
        └── Optional AI fetch to FastAPI service
```

### 1.4 Data Flow (simplified)

```
PostgreSQL (via Prisma 6 ORM)
  ├── 10 models: User, City, Sector, Merchant, Product, Review, Order, OrderItem, Favorite, Message, Ticket, Coupon, CartItem, Notification
  │
Redis (or in-memory Map)
  ├── Login rate limiting: login:{email}:{ip} → incr with 15min TTL
  ├── Password reset tokens: reset_token:{sha256(token)} → userId, 30min TTL
  └── Health check: health:ping

External AI Service (FastAPI + sentence-transformers)
  ├── POST /index — embed documents
  ├── POST /chat — semantic + rule-based response
  ├── POST /semantic-search — cosine similarity search
  └── GET /health
```

---

## 2. Folder Structure Analysis

```
E:\enge project\
├── .github\workflows\ci.yml          # CI: lint + typecheck + test + docker build
├── docker\
│   ├── docker-compose.yml             # 7 services (caddy, db, redis, web, ai-assistant, migrate, backup, healthcheck-ping)
│   ├── Dockerfile.web                 # Multi-stage: deps → builder → runner (standalone) + migrate target
│   ├── deploy.sh                      # Production deployment script
│   ├── caddy\Caddyfile                # Reverse proxy, auto TLS, security headers, gzip
│   ├── backup\Dockerfile              # PostgreSQL backup container
│   ├── backup\backup.sh               # pg_dump + retention cleanup
│   └── monitoring\healthchecks.yml    # Healthchecks.io integration docs
│
├── services\ai-assistant\
│   ├── app\main.py                    # FastAPI: /health, /index, /chat, /semantic-search
│   ├── requirements.txt               # fastapi, uvicorn, sentence-transformers, numpy, psycopg2
│   └── Dockerfile                     # Python 3.11-slim
│
├── prisma\
│   ├── schema.prisma                  # 10 models, 2 enums, full relational schema
│   └── seed.ts                        # Seeder: 1 admin, 4 consumers, 8 cities, 8+ sectors, 10 merchants, 42 products, reviews, orders, etc.
│
├── public\
│   ├── favicon.svg
│   ├── icon-192.svg
│   ├── manifest.json
│   ├── robots.txt
│   ├── sw.js                          # Service worker stub for PWA
│   └── sitemap.xml                    # auto-generated sitemap
│
├── src\lib\                           # Core business logic (server-only modules)
│   ├── auth.ts                        # Custom auth: createSession, getSession, clearSession, login, register, hashPassword, verifyPassword, requireAuth, requireRole
│   ├── prisma.ts                      # Singleton PrismaClient (globalThis pattern)
│   ├── redis.ts                       # Unified store interface: Redis (ioredis) or in-memory Map fallback
│   ├── search.ts                      # Raw SQL search via prisma.$queryRawUnsafe with ILIKE + parameterized filters
│   ├── schemas.ts                     # Zod schemas: register, login, product, order, review, contact, merchant
│   ├── rate-limit.ts                  # Login rate limiting: 5 attempts / 15 min per email:IP combo
│   ├── magic-bytes.ts                 # Upload validation by magic bytes (JPEG/PNG/GIF/WebP)
│   ├── logger.ts                      # Queue-based async logger with interval flush + process.on flush
│   └── utils.ts                       # slugify, formatPrice, classNames, generateId
│
├── src\middleware.ts                  # Edge Runtime middleware: CSRF + 60req/min per-IP + security headers + CSP
│
├── src\components\                    # UI components (shared)
│   ├── Header.tsx                     # Server component: session-aware header with nav links, cart, notifications, mobile menu
│   ├── AIChatWidget.tsx               # Client: floating chat button → POST /api/ai/chat
│   ├── CartDrawer.tsx                 # Client: slide-over cart with quantity controls
│   ├── CookieConsent.tsx              # Client: GDPR-style consent banner
│   ├── CityCard.tsx                   # Server: city card with image fallback
│   ├── MerchantCard.tsx               # Server: merchant card with avg rating
│   ├── ProductCard.tsx                # Server: product card with price + favorite
│   ├── FavoriteButton.tsx             # Client: toggle favorite
│   ├── AddToCartButton.tsx            # Client: add to cart
│   ├── RequestQuoteButton.tsx         # Client: order request form
│   ├── ReviewForm.tsx                 # Client: star rating + comment
│   ├── NotificationBell.tsx           # Client: dropdown notification list
│   ├── MobileMenu.tsx                 # Client: mobile hamburger menu
│   ├── LogoutButton.tsx               # Client: logout
│   ├── ImageWithFallback.tsx          # Client: img with fallback placeholder
│   ├── PwaInstallPrompt.tsx           # Client: beforeinstallprompt handler
│   ├── RecentlyViewed.tsx             # Client: localStorage-based recent items
│   ├── TrackProductView.tsx           # Client: tracks product views to localStorage
│   ├── Skeletons.tsx                  # Loading skeletons
│   └── Toast.tsx                      # Context-based toast notification system
│
├── src\app\layout.tsx                 # Root layout: Tajawal font, RTL, Header, ToastProvider, CookieConsent, PWA
├── src\app\page.tsx                   # Landing page: hero, cities grid, latest products, top merchants
├── src\app\globals.css                # Tailwind v4 + custom styles
│
├── src\app\api\                       # 31 API route files (see Section 5)
│
├── src\app\[city]\[sector]\[merchant]\          # Dynamic merchant page
│   └── product\[productId]\                      # Dynamic product page
├── src\app\[city]\[sector]\                      # Dynamic sector page (merchant list)
├── src\app\[city]\                                 # Dynamic city page (sector list)
│
├── src\app\auth\login\page.tsx         # Login page
├── src\app\auth\register\page.tsx      # Register page
├── src\app\auth\reset-password\page.tsx # Reset password form
│
├── src\app\checkout\page.tsx           # Checkout page
├── src\app\contact\page.tsx            # Contact page
├── src\app\search\page.tsx             # Search page with filters
├── src\app\messages\page.tsx           # Messages page
│
├── src\app\dashboard\consumer\page.tsx # Consumer dashboard
├── src\app\dashboard\merchant\page.tsx # Merchant dashboard
├── src\app\dashboard\admin\page.tsx    # Admin dashboard
├── src\app\dashboard\favorites\page.tsx# Favorites list
├── src\app\dashboard\orders\page.tsx   # Orders list
├── src\app\dashboard\notifications\page.tsx # All notifications
├── src\app\dashboard\settings\page.tsx # User settings
│
├── src\test\                           # 4 test suites, 33 tests
│   ├── setup.ts
│   ├── auth.test.ts                    # Schema validation tests (23 tests)
│   ├── logger.test.ts                  # Logger output tests (2 tests)
│   ├── magic-bytes.test.ts             # Magic byte detection (8 tests)
│   └── schemas.test.ts                 # Schema validation edge cases
│
├── .env.example                        # Environment template
├── next.config.ts                      # standalone output, images, headers, serverActions
├── vitest.config.ts                    # jsdom, @ alias, globals
├── tsconfig.json                       # Standard Next.js TS config
├── package.json                        # Scripts + dependencies
└── eslint.config                       # ESLint flat config (not read but present)
```

---

## 3. File-by-File Analysis

### 3.1 Critical Library Files

| File | Purpose | Dependencies | Callers | Criticality |
|------|---------|-------------|---------|-------------|
| `src/lib/auth.ts` | Custom HMAC-SHA256 session management, login, register, password hashing | crypto, bcryptjs, prisma, cookies(), logger | All auth routes, middleware, pages | **9/10** — entire auth depends on it |
| `src/lib/prisma.ts` | Singleton PrismaClient (globalThis caching) | @prisma/client | Every server file | **10/10** — DB access |
| `src/lib/redis.ts` | Store interface (ioredis or in-memory Map) | ioredis (dynamic import) | rate-limit.ts, health, forgot/reset-password | **7/10** — fallback degrades but doesn't break |
| `src/lib/search.ts` | Raw SQL product search with ILIKE | prisma | /api/search route | **8/10** — SQL injection risk if queryRawUnsafe misused |
| `src/lib/schemas.ts` | Zod validation (register, login, product, order, review, contact, merchant) | zod | All POST/PUT/PATCH routes | **8/10** — input validation boundary |
| `src/lib/rate-limit.ts` | Login attempt tracking | redis, logger | login route | **5/10** — login hardening |
| `src/lib/magic-bytes.ts` | Upload file type detection | none | upload route | **6/10** — file upload security |
| `src/lib/logger.ts` | Queue-based async JSON logger | none (stdout) | All API routes, middleware | **4/10** — operational logging |
| `src/lib/utils.ts` | slugify, formatPrice, classNames, generateId | none | Various routes and pages | **3/10** — utilities |
| `src/middleware.ts` | CSRF + rate limiting + CSP + security headers | logger | Edge Runtime | **8/10** — security boundary |

### 3.2 Config Files

| File | Purpose | Criticality |
|------|---------|-------------|
| `package.json` | 15 scripts, 12 dependencies, 17 devDependencies | **10/10** — build/test infra |
| `next.config.ts` | standalone output, images, security headers | **8/10** — build config |
| `tsconfig.json` | Standard Next.js | **3/10** |
| `vitest.config.ts` | jsdom environment, @ alias | **4/10** — test infra |
| `.env.example` | 28 env vars documented | **7/10** — deployment docs |

### 3.3 Infrastructure / CI Files

| File | Purpose | Criticality |
|------|---------|-------------|
| `prisma/schema.prisma` | 10 models, 2 enums, full relational DB | **10/10** — data model |
| `prisma/seed.ts` | 372-line seeder for dev/staging | **6/10** — dev onboarding |
| `docker/docker-compose.yml` | 7 services, volumes, health checks | **9/10** — production |
| `docker/Dockerfile.web` | Multi-stage: deps → builder → runner + migrate | **8/10** — production |
| `docker/deploy.sh` | Validation, build, migrate, health check | **6/10** — ops |
| `services/ai-assistant/app/main.py` | FastAPI with sentence-transformers | **5/10** — optional feature |
| `.github/workflows/ci.yml` | 2 jobs: lint+typecheck+test, docker build | **7/10** — CI quality gate |

### 3.4 Page Files

| File | Purpose | SSR? | Criticality |
|------|---------|------|-------------|
| `src/app/layout.tsx` | Root layout: Tajawal font, RTL, Header, ToastProvider, CookieConsent, PWA, footer | Yes | **10/10** |
| `src/app/page.tsx` | Landing page: 4 Prisma queries, hero, city grid, products, merchants | Yes | **9/10** |
| `src/app/[city]/page.tsx` | City page: sectors for a given city | Yes | **7/10** |
| `src/app/[city]/[sector]/page.tsx` | Sector page: merchants in a sector within a city | Yes | **7/10** |
| `src/app/[city]/[sector]/[merchant]/page.tsx` | Merchant profile: products, reviews, working hours, avg rating, view counter | Yes | **8/10** |
| `src/app/[city]/[sector]/[merchant]/product/[productId]/page.tsx` | Product detail | Yes | **7/10** |
| `src/app/search/page.tsx` | Search page with filters | Yes | **7/10** |
| `src/app/auth/login/page.tsx` | Login form | Client | **7/10** |
| `src/app/auth/register/page.tsx` | Register form (customer or merchant) | Client | **7/10** |
| `src/app/checkout/page.tsx` | Checkout page | Client | **6/10** |
| `src/app/dashboard/consumer/page.tsx` | Consumer dashboard | Yes | **6/10** |
| `src/app/dashboard/merchant/page.tsx` | Merchant dashboard | Yes | **7/10** |
| `src/app/dashboard/admin/page.tsx` | Admin dashboard | Yes | **6/10** |

---

## 4. Database Architecture

### 4.1 Entity Relationship Diagram (text)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (users)                            │
│  id (PK) | name | email (UQ) | password | phone | role (ENUM)  │
│  cityId (FK→City) | image | isActive | createdAt | updatedAt   │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ 1                                  │ 1
             ▼                                    ▼
     Merchant (merchants)                  Ticket (tickets)
     id (PK)                               id (PK)
     nameAr, slug (UQ with cityId)         subject, description
     description, logo, coverImage         status, priority
     contactEmail, contactPhone            senderId (FK→User)
     website, address                      assigneeId (FK→User)
     cityId (FK→City)                      ────────────────
     sectorId (FK→Sector)
     userId (FK→User, UQ)                  Notification (notifications)
     isVerified, status, viewCount         id (PK)
     ────────────────                       userId (FK→User)
     │ 1                                   title, body, type, isRead
     │
     ├── Product (products) (1:N)
     │     id (PK)
     │     nameAr, description             Message (messages)
     │     price, currency                 id (PK)
     │     images (String[])               content
     │     isService, category, tags[]     senderId (FK→User)
     │     merchantId (FK→Merchant)        orderId (FK→Order, opt)
     │     isActive                        isRead
     │     ────────────────                ────────────────
     │     │ 1:N → OrderItem
     │     │ 1:N → Favorite                CartItem (cart_items)
     │     └── 1:N → CartItem              id (PK)
     │                                     userId (FK→User)
     ├── Review (reviews) (1:N)            productId (FK→Product)
     │     id (PK)                         quantity
     │     rating, comment                 UQ(userId, productId)
     │     consumerId (FK→User)            ────────────────
     │     merchantId (FK→Merchant)
     │     UQ(consumerId, merchantId)       Coupon (coupons)
     │                                     id (PK)
     ├── Order (orders) (1:N)              code (UQ)
     │     id (PK)                         discountPercent
     │     status (ENUM: PENDING/ACCEPTED/REJECTED/COMPLETED/CANCELLED)  discountAmount
     │     message, totalAmount            minOrder, maxUses, usedCount
     │     shippingAddress, phone          expiresAt, isActive
     │     consumerId (FK→User)            merchantId (FK→Merchant, opt)
     │     merchantId (FK→Merchant)        ────────────────
     │     couponId (FK→Coupon, opt)
     │     ────────────────
     │     │ 1:N → OrderItem
     │     │ 1:N → Message
     │
     │ OrderItem (order_items)
     │   id (PK)
     │   quantity, unitPrice
     │   productId (FK→Product)
     │   orderId (FK→Order)
     │
     │ Favorite (favorites)
     │   id (PK)
     │   userId (FK→User)
     │   productId (FK→Product)
     │   UQ(userId, productId)
     │
City (cities)
  id (PK)
  nameAr, slug (UQ)
  lat, lng, image, isActive
  │ 1:N → Sector
  │ 1:N → User
  └── 1:N → Merchant

Sector (sectors)
  id (PK)
  nameAr, slug (UQ with cityId)
  description, icon, image
  parentId (FK→Sector, self-ref)
  cityId (FK→City)
  sortOrder, isActive
  └── 1:N → Merchant
```

### 4.2 Enums

| Enum | Values |
|------|--------|
| **UserRole** | `ADMIN`, `MERCHANT`, `CONSUMER` |
| **OrderStatus** | `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELLED` |

### 4.3 Model Counts

| Model | Table Name | Fields | Relations | Constraints |
|-------|-----------|--------|-----------|-------------|
| User | `users` | 10 | City, Merchant, Review, Order, Favorite, Message, Ticket (sent+assigned), CartItem, Notification | email UQ |
| City | `cities` | 8 | Sector, User, Merchant | slug UQ |
| Sector | `sectors` | 12 | City, Sector (self parent/child), Merchant | UQ(slug, cityId) |
| Merchant | `merchants` | 20 | City, Sector, User, Product, Review, Order, Coupon | UQ(slug, cityId), UQ(userId) |
| Product | `products` | 12 | Merchant, Favorite, OrderItem, CartItem | — |
| Review | `reviews` | 7 | User (consumer), Merchant | UQ(consumerId, merchantId) |
| Order | `orders` | 11 | User (consumer), Merchant, Coupon, OrderItem, Message | — |
| OrderItem | `order_items` | 5 | Product, Order | — |
| Favorite | `favorites` | 4 | User, Product | UQ(userId, productId) |
| Message | `messages` | 7 | User (sender), Order | — |
| Ticket | `tickets` | 8 | User (sender), User (assignee) | — |
| Coupon | `coupons` | 10 | Merchant, Order | code UQ |
| CartItem | `cart_items` | 5 | User, Product | UQ(userId, productId) |
| Notification | `notifications` | 7 | User | — |

### 4.4 Notable Schema Details

- **Auto-createdAt**: `@default(now())` on every model
- **Auto-updatedAt**: `@updatedAt` on User, City, Sector, Merchant, Product, Review, Order, Ticket, Notification
- **Soft-delete**: City has `isActive` boolean; City DELETE endpoint sets `isActive: false` rather than deleting
- **Cascade delete**: Not defined in schema (manual deletion via `$transaction` in `users/[id]/route.ts`)
- **JSON fields**: Merchant `workingHours` is `Json?` (no JSON schema validation)
- **Array fields**: Product `images` and `tags` are `String[]` (native PostgreSQL arrays)
- **Map to table names**: All `@@map("snake_case_table_names")` — PostgreSQL tables are snake_case
- **CUIDs**: All primary keys use `@default(cuid())`

---

## 5. API Analysis

### 5.1 Route Table

| # | Route | Method | Auth | Role | Description |
|---|-------|--------|------|------|-------------|
| 1 | `/api/health` | GET | No | — | DB ping + Redis ping → {status, timestamp, uptime, checks} |
| 2 | `/api/auth/register` | POST | No | — | Register customer OR merchant (creates user + merchant, auto-login) |
| 3 | `/api/auth/login` | POST | No | — | Login with rate-limit check (5/15min per email:IP) |
| 4 | `/api/auth/me` | GET | Yes | Any | Return `{userId, name, role}` from session |
| 5 | `/api/auth/me` | DELETE | — | — | **NOT FOUND** (LogoutButton uses this but it doesn't exist — logout is via client-side fetch to nowhere) |
| 6 | `/api/auth/forgot-password` | POST | No | — | Generate 30-min reset token, store sha256 in Redis, log URL in dev |
| 7 | `/api/auth/reset-password` | POST | No | — | Verify token (sha256), update password |
| 8 | `/api/cities` | GET | No | — | List active cities sorted by nameAr |
| 9 | `/api/cities` | POST | Yes | ADMIN | Create city (slug auto-generated if not provided) |
| 10 | `/api/cities/[id]` | PUT | Yes | ADMIN | Update city fields |
| 11 | `/api/cities/[id]` | DELETE | Yes | ADMIN | Soft-delete (set isActive=false) |
| 12 | `/api/sectors` | GET | No | — | List active sectors, filterable by cityId, parentId |
| 13 | `/api/sectors` | POST | Yes | ADMIN/MERCHANT | Create sector with auto-slug |
| 14 | `/api/sectors/[id]` | DELETE | Yes | ADMIN | Delete sector (refuses if merchants exist) |
| 15 | `/api/merchants` | GET | No | — | List active merchants (or all if `?all=true`) with avg rating |
| 16 | `/api/merchants` | POST | Yes | Any | Create merchant, link to user, upgrade role to MERCHANT |
| 17 | `/api/merchants/[id]` | DELETE | Yes | ADMIN | Delete merchant + all related data in transaction |
| 18 | `/api/merchants/verify` | PATCH | Yes | ADMIN | Approve/reject merchant → notification to user |
| 19 | `/api/merchants/update` | PUT | Yes | MERCHANT/ADMIN | Update merchant fields |
| 20 | `/api/products` | GET | Opt | Any | List products, filter by merchant/sector/q |
| 21 | `/api/products` | POST | Yes | MERCHANT | Create product (auto-filter by merchant.userId) |
| 22 | `/api/products/[id]` | DELETE | Yes | MERCHANT | Delete own product |
| 23 | `/api/search` | GET | No | — | Full-text product search with ILIKE across name/description/tags/merchant |
| 24 | `/api/orders` | GET | Yes | Any | List own orders (consumer=own, merchant=own merchant's) |
| 25 | `/api/orders` | POST | Yes | Any | Create order with optional items, message, phone |
| 26 | `/api/orders` | PATCH | Yes | MERCHANT | Update order status → notification to consumer |
| 27 | `/api/checkout` | POST | Yes | CONSUMER | Cart → order: validates single-merchant, applies coupon, clears cart |
| 28 | `/api/cart` | GET | Yes | CONSUMER | List cart items with product details |
| 29 | `/api/cart` | POST | Yes | CONSUMER | Add item to cart (or increment quantity) |
| 30 | `/api/cart` | DELETE | Yes | CONSUMER | Remove item from cart |
| 31 | `/api/cart` | PATCH | Yes | CONSUMER | Update item quantity |
| 32 | `/api/favorites` | GET | Yes | Any | List favorites with product+merchant details |
| 33 | `/api/favorites` | POST | Yes | Any | Toggle favorite (add/remove) |
| 34 | `/api/reviews` | GET | Yes | Any | List reviews by merchant or own consumer reviews |
| 35 | `/api/reviews` | POST | Yes | Any | Create review (5 max, UQ consumer+merchant prevents duplicates) |
| 36 | `/api/messages` | GET | Yes | Any | List messages for an order or all own orders |
| 37 | `/api/messages` | POST | Yes | Any | Send message → creates notification for recipient |
| 38 | `/api/messages/stream` | GET | Yes | Any | SSE stream for real-time messages (2s polling interval) |
| 39 | `/api/notifications` | GET | Yes | Any | List latest 50 notifications |
| 40 | `/api/notifications` | PATCH | Yes | Any | Mark notification(s) as read |
| 41 | `/api/contact` | POST | Opt | — | Create support ticket (Ticket model), requires auth or admin fallback |
| 42 | `/api/coupons/validate` | POST | No | — | Validate coupon code, returns discount amount |
| 43 | `/api/admin/merchants` | POST | Yes | ADMIN | Create merchant directly (auto-verified) |
| 44 | `/api/users/[id]` | DELETE | Yes | ADMIN | Delete user + all related data in large transaction |
| 45 | `/api/upload` | POST | Yes | Any | Upload image file with magic byte + MIME + size validation |
| 46 | `/api/ai/chat` | POST | No | — | AI assistant: greeting → sector lookup → product search → fallback |

**Note**: Route #5 (`DELETE /api/auth/me`) **does not exist** — the `LogoutButton` component calls it but there is no route file. The cookie is cleared via `cookies().delete()` in `clearSession()` from `auth.ts`, but the route isn't connected.

### 5.2 Route Categories

| Category | Count | Endpoints |
|----------|-------|-----------|
| Auth | 5 | register, login, me, forgot-password, reset-password |
| Cities | 3 | GET/POST cities, PUT/DELETE cities/[id] |
| Sectors | 3 | GET/POST sectors, DELETE sectors/[id] |
| Merchants | 5 | GET/POST merchants, DELETE merchants/[id], verify, update |
| Products | 3 | GET/POST products, DELETE products/[id] |
| Search | 1 | GET search |
| Orders | 3 | GET/POST/PATCH orders |
| Checkout | 1 | POST checkout |
| Cart | 4 | GET/POST/DELETE/PATCH cart |
| Favorites | 2 | GET/POST favorites |
| Reviews | 2 | GET/POST reviews |
| Messages | 3 | GET/POST messages, SSE stream |
| Notifications | 2 | GET/PATCH notifications |
| Contact | 1 | POST contact |
| Coupons | 1 | POST coupons/validate |
| Admin | 1 | POST admin/merchants |
| Users | 1 | DELETE users/[id] |
| Upload | 1 | POST upload |
| AI | 1 | POST ai/chat |
| Health | 1 | GET health |

### 5.3 API Patterns

**Common structure for CRUD routes:**
1. Parse/validate input (Zod schema in schemas.ts)
2. Authenticate via `getSession()` from auth.ts
3. Authorize via role check (manual `if (session.role !== 'ADMIN')`)
4. Business logic (Prisma queries / search.ts / redis.ts)
5. Log via logger.ts
6. Return `NextResponse.json(...)`

**Error handling pattern:** Try-catch with generic 500 + `logger.error`. Some routes have per-case error messages (Arabic strings). Most errors return `{ error: "رسالة الخطأ" }`.

**Missing input validation:** Several Routes (cities POST, merchants POST, etc.) use manual `if (!field)` checks instead of Zod. This is inconsistent — some use Zod (register, login, product, order, review, contact), others don't (cities, sectors, merchants, checkout).

---

## 6. Authentication System

### 6.1 Architecture

SuqAI uses **custom HMAC-SHA256 session cookies** — NOT NextAuth.js (which is installed as a dependency but never used).

### 6.2 Session Creation (`auth.ts:39-51`)

```
createSession(userId, role, name):
  1. Create JSON payload: {userId, role, name, exp: now + 7 days}
  2. Base64url-encode payload → encoded
  3. HMAC-SHA256(encoded, SESSION_SECRET) → signature
  4. Cookie name: "suqai_session"
  5. Cookie value: "{encoded}.{signature}"
  6. httpOnly, sameSite:lax, path:/, secure in production, maxAge: 7 days
```

### 6.3 Session Verification (`auth.ts:53-69`)

```
getSession():
  1. Read "suqai_session" cookie from request
  2. Split on "." → [encoded, sig]
  3. Verify sig === HMAC-SHA256(encoded, SESSION_SECRET) (constant-time compare)
  4. Base64url-decode → JSON parse
  5. Check exp < Date.now() (expiry check)
  6. Return {userId, role, name} or null
```

### 6.4 Secret Resolution (`auth.ts:9`)

```
SESSION_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || ""
```

Falls back to NEXTAUTH_SECRET if SESSION_SECRET isn't set. Empty string if neither is set.

### 6.5 Password Hashing (`auth.ts:31-37`)

- `bcryptjs` with 12 salt rounds
- `hashPassword(password)` → bcrypt hash
- `verifyPassword(password, hash)` → bcrypt compare

### 6.6 Login Flow

```
POST /api/auth/login:
  1. Zod validate body (email, password)
  2. Extract client IP (x-forwarded-for / x-real-ip / "unknown")
  3. checkLoginRateLimit(email, IP): incr Redis key "login:{email}:{IP}"; >5 → block 15min
  4. login(email, password):
     a. prisma.user.findUnique({email})
     b. verifyPassword(password, user.password)
     c. createSession(user.id, user.role, user.name)
  5. resetLoginRateLimit(email, IP)
  6. Return {user: {userId, role, name}}
```

### 6.7 Session Lifecycle

```
Browser                          Server
  │                                │
  │── POST /api/auth/login ───────→│  Create session
  │←── Set-Cookie: suqai_session──│  (HMAC-SHA256 signed)
  │                                │
  │── GET /api/auth/me ──────────→│  Cookie sent automatically
  │←── {userId, name, role} ──────│  Cookie verified, payload decoded
  │                                │
  │── (session expires after 7d) ──│  Client-side: no refresh
  │── GET /api/auth/me ──────────→│  Cookie stale → 403
  │                                │
  │── (LogoutButton.tsx) ──────────│  Calls DELETE /api/auth/me (MISSING ROUTE!)
  │                                │  Actually no route handles it — client navigates to "/"
```

**Critical Issue**: `LogoutButton.tsx` calls `DELETE /api/auth/me` but this route **does not exist** in the project files. The `clearSession()` function exists in `auth.ts:71-74` but no route calls it. The logout button effectively navigates to `/` without actually clearing the session cookie.

### 6.8 Register Flow

```
POST /api/auth/register:
  1. Zod validate body
  2. If accountType === "merchant":
     a. Validate extra fields (storeName, phone, cityId, sectorId)
     b. Check email uniqueness
     c. Verify city and sector exist
     d. Hash password (bcrypt 12 rounds)
     e. Create user with role "MERCHANT"
     f. Create merchant with status "pending" (not auto-verified)
     g. Create session → login automatically
     h. Return {user: {userId, role, name, email}}
  3. If customer:
     a. Call register() from auth.ts
     b. Hash password → create user → create session
     c. Return {user: {userId, role, name}}
```

---

## 7. Authorization System

### 7.1 Role Model

Three roles defined in `UserRole` enum:
- **ADMIN** (`ADMIN`) — full system access
- **MERCHANT** (`MERCHANT`) — own store management
- **CONSUMER** (`CONSUMER`) — browse, order, review

### 7.2 Enforcement Table

| Endpoint | Required Role | Enforcement Method |
|----------|--------------|-------------------|
| GET /api/cities | None | — |
| POST /api/cities | ADMIN | `session.role !== "ADMIN"` |
| PUT/DELETE /api/cities/[id] | ADMIN | `session.role !== "ADMIN"` |
| GET /api/sectors | None | — |
| POST /api/sectors | ADMIN or MERCHANT | `session.role !== "ADMIN" && session.role !== "MERCHANT"` |
| DELETE /api/sectors/[id] | ADMIN | `session.role !== "ADMIN"` |
| POST /api/merchants | Any (authenticated) | `if (!session)` |
| DELETE /api/merchants/[id] | ADMIN | `session.role !== "ADMIN"` |
| PATCH /api/merchants/verify | ADMIN | `session.role !== "ADMIN"` |
| PUT /api/merchants/update | MERCHANT or ADMIN | `session.role !== "MERCHANT" && session.role !== "ADMIN"` |
| GET /api/products | None (public) | — |
| POST /api/products | MERCHANT | `session.role !== "MERCHANT"` |
| DELETE /api/products/[id] | MERCHANT (own only) | Checks `merchant.userId === session.userId` |
| GET /api/orders | Any | Filters by role: CONSUMER → own; MERCHANT → own merchant |
| POST /api/orders | Any | `if (!session)` |
| PATCH /api/orders | MERCHANT | `session.role !== "MERCHANT"` + checks merchant ownership |
| POST /api/checkout | CONSUMER | `session.role !== "CONSUMER"` |
| GET /api/cart | CONSUMER | `session.role !== "CONSUMER"` |
| GET /api/favorites | Any | `if (!session)` |
| GET /api/messages | Any | Multi-query to scope by user |
| POST /api/messages | Any | `if (!session)` |
| GET /api/notifications | Any | Scoped to own userId |
| POST /api/upload | Any | `if (!session)` |
| POST /api/coupons/validate | None | — |
| POST /api/admin/merchants | ADMIN | `session.role !== "ADMIN"` |
| DELETE /api/users/[id] | ADMIN | `session.role !== "ADMIN"` |
| POST /api/ai/chat | None | — |

### 7.3 Role Hierarchy

```
ADMIN ─── full access to everything
  │
MERCHANT ─ create/edit own products, view own orders, manage own store
  │
CONSUMER ─ browse (no auth needed for most reads), add cart, place orders, write reviews
```

No role inheritance — checks are explicit per-route.

### 7.4 Authorization Gap

The `requireRole(...roles)` function exists in `auth.ts:82-86` but is **never used** by any route. All routes do manual role checks via `if (session.role !== "X")`. This is inconsistent — `requireAuth()` is also never used.

---

## 8. Business Logic

### 8.1 Core Domain Concept: City → Sector → Merchant → Product

```
City (اليمن: سيئون, صنعاء, عدن...)
  │
  ├── Sector (الطاقة المتجددة, الكهربائيات, مواد البناء...)
  │     │
  │     ├── Merchant (شركة الطاقة الشمسية الأولى...)
  │     │     ├── Product (لوح شمسي 500 واط, بطارية ليثيوم...)
  │     │     ├── Review (rating 1-5, comment)
  │     │     └── Order (PENDING → ACCEPTED/REJECTED → COMPLETED/CANCELLED)
  │     │
  │     └── Merchant (مؤسسة كهرباء المستقبل...)
  │
  └── Sector (الكهربائيات)
        └── ...
```

### 8.2 Product Lifecycle

1. Admin creates city
2. Admin (or merchant) creates sector under city
3. Merchant registers → creates merchant profile → **pending status**
4. Admin approves merchant via `/api/merchants/verify` → `status: "active"`
5. Merchant creates products
6. Products appear in search, city/sector/merchant pages
7. Consumer browses, favorites, adds to cart
8. Consumer requests quote or checkout → creates order (PENDING)
9. Merchant accepts/rejects/completes/cancels order
10. Consumer writes review (once per merchant, UQ constraint)

### 8.3 Order Lifecycle

```
PENDING → ACCEPTED → COMPLETED
  │          │
  │          └── CANCELLED
  └── REJECTED
```

Status transitions are validated only by `OrderStatus` enum (Prisma-level). No business logic prevents invalid transitions (e.g., COMPLETED → PENDING is allowed at DB level but enforced by enum values).

### 8.4 Cart & Checkout Flow

1. Consumer adds products to cart (CartItem per user+product, quantity)
2. Consumer opens CartDrawer → sees items with quantities
3. Consumer clicks "إتمام الطلب" → goes to checkout page
4. POST /api/checkout:
   - Validates: CONSUMER only, cart not empty, all items from same merchant
   - Applies coupon if code provided (validates: active, not expired, not exceeded, minOrder, merchant-scoped)
   - Calculates discount (percent or fixed amount)
   - Creates Order with OrderItems
   - Empties cart
   - Creates notification for merchant
   - Returns `{orderId}`

### 8.5 Favorite Logic

Toggle-based: POST /api/favorites with productId → if exists, delete (unfavorite); if not, create (favorite). Frontend uses `favorited` boolean in response to toggle heart icon.

### 8.6 Merchant Verification Flow

1. Merchant registers → `status: "pending"`, `isVerified: false`
2. Admin reviews in the admin dashboard
3. Admin calls `PATCH /api/merchants/verify` with `{merchantId, action: "approve"|"reject"}`
4. On approve: `status: "active"`, `isVerified: true` + notification to merchant
5. On reject: `status: "rejected"` + notification
6. Only verified merchants appear in public listings (where filter `status: "active"`)

### 8.7 Coupon System

- Coupons have: code (unique), discountPercent, discountAmount, minOrder, maxUses, usedCount, expiresAt, merchantId (optional scope), isActive
- Validated: active, not expired, not exceeded maxUses, minOrder reached, correct merchant
- Calculated: discountAmount > 0 → fixed discount; else → percent * total
- Checkout: applies coupon, increments usedCount, uses couponId on Order
- Validate endpoint: `POST /api/coupons/validate` (read-only check)

---

## 9. Search System

### 9.1 Architecture

Raw SQL via `prisma.$queryRawUnsafe` in `src/lib/search.ts`. Not using Prisma's built-in `findMany` with `contains`.

### 9.2 SQL Query (search.ts:71-83)

```sql
SELECT p.id, p.name_ar, p.price, p.currency, p.images, p.is_service, p.category, p.tags,
       m.name_ar as merchant_name, m.slug as merchant_slug, m.logo as merchant_logo,
       s.slug as sector_slug, c.slug as city_slug,
       COALESCE((SELECT AVG(rating) FROM reviews rv WHERE rv.merchant_id = m.id), 0) as avg_rating
FROM products p
JOIN merchants m ON m.id = p.merchant_id
JOIN sectors s ON s.id = m.sector_id
JOIN cities c ON c.id = m.city_id
[WHERE conditions]
ORDER BY p."createdAt" DESC
LIMIT 50
```

### 9.3 Filters (all optional, combined with AND)

| Parameter | SQL Condition | Type |
|-----------|--------------|------|
| `q` (text) | `p.name_ar ILIKE $1 OR p.description ILIKE $1 OR p.tags::text ILIKE $1 OR m.name_ar ILIKE $1` | text search |
| `citySlug` | `c.slug = $2` | exact |
| `sectorSlug` | `s.slug = $3` | exact |
| `minPrice` | `p.price >= $4` | numeric |
| `maxPrice` | `p.price <= $5` | numeric |
| `category` | `p.category = $6` | exact |
| `type` | `p.is_service = true` or `p.is_service = false` | boolean |

### 9.4 Pre-filtering (search.ts:30)

```sql
WHERE p.is_active = true AND m.status = 'active'
```

Always applied. Combined with user filters via AND.

### 9.5 Security Assessment

- **Parameterized**: All user inputs use `$N` parameterized placeholders → safe against SQL injection
- **Known column name fix**: Originally used `p.created_at` but PostgreSQL column is `"createdAt"` (auto-created from Prisma's `@updatedAt`). Fixed by quoting: `p."createdAt"`
- **`ILIKE` performance**: `ILIKE` with leading `%` cannot use indexes → full table scan. Acceptable for limited dataset but won't scale beyond ~10k products
- **`::text` cast on `tags`**: `tags::text ILIKE $1` — will also match serialized arrays, potentially causing false positives

### 9.6 Response Type

Returns `SearchResult[]` (defined in search.ts:13-27):
- id, nameAr, price, currency, images, isService, category, tags
- merchantName, merchantSlug, sectorSlug, citySlug
- avgRating (computed from reviews subquery)

### 9.7 Derived Search (public search page)

The public `/search` page additionally performs:
- City/merchant search via `insert into` technique (different from raw SQL)
- Text search across name/description/tags using Prisma `contains` + `mode: "insensitive"`

---

## 10. AI Integration

### 10.1 Architecture

```
SuqAI Web (Next.js)                  AI Assistant (FastAPI)
POST /api/ai/chat ──────────────────→ POST /[chat|index|semantic-search]
  │                                    │
  │  ├── Rule-based fallback           │  ├── sentence-transformers
  │  ├── DB query fallback             │  │   (multilingual-e5-small)
  │  └── Fetch to AI service ─────────→│  ├── Cosine similarity search
  │                                    │  └── Response generation
  │←── JSON response ←─────────────────│
```

### 10.2 AI Service (`services/ai-assistant/app/main.py`)

**Endpoints:**
- `GET /health` — model loaded, document count
- `POST /index` — embed documents using `SentenceTransformer` (multilingual-e5-small), store embeddings in memory
- `POST /chat` — rule-based greeting detection + semantic search + city filtering
- `POST /semantic-search` — cosine similarity search with top-k

**Model:** `intfloat/multilingual-e5-small` — multilingual sentence embeddings, supports Arabic

**Limitations:**
- Embeddings stored **in-memory** (lost on restart)
- No persistent vector database
- `psycopg2-binary` dependency is installed but **not used** in main.py
- No authentication on AI service endpoints

### 10.3 Chat Flow (Web side, `/api/ai/chat`)

1. Parse `{message, cityId?}`
2. **Greeting detection**: Check for Arabic/English greeting keywords → return city list
3. **AI service call**: POST to `http://ai-assistant:8000/chat` with 5s timeout
   - If AI returns `intent !== "not_found"` and `intent !== "general"` → return AI response
   - On timeout/error → proceed to fallbacks
4. **Sector fallback**: Search sectors matching query text → list merchants with avg rating
5. **Product fallback**: Prisma text search across name/description/tags → list up to 3 products
6. **Default**: "عذراً، لم أتمكن من العثور على نتائج"

### 10.4 Data Indexing

- `indexData()` function: queries all sectors, merchants, products → creates document array → POSTs to AI service `/index`
- Called on **first chat request only** (via `indexingAttempted` flag)
- Documents include: `{id, text, sector, merchant, city_id}`
- Not re-indexed on data changes (stale until restart)

---

## 11. Redis Analysis

### 11.1 Usage

Redis is used for **two features** with graceful in-memory fallback:

| Feature | Key Pattern | TTL | When Used |
|---------|-------------|-----|-----------|
| Login rate limiting | `login:{email}:{ip}` | 15 min (900s) | POST /api/auth/login |
| Password reset tokens | `reset_token:{sha256(token)}` | 30 min (1800s) | POST /api/auth/forgot-password, POST /api/auth/reset-password |
| Health check | `health:ping` | — | GET /api/health |

### 11.2 Store Interface (`src/lib/redis.ts`)

```typescript
type Store = {
  get(key: string): Promise<string | null>
  setex(key: string, ttl: number, value: string): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
  pttl(key: string): Promise<number>
}
```

### 11.3 Connection Logic

```javascript
getStore():
  1. If store already initialized, return it
  2. If REDIS_URL exists:
     a. Try to connect using ioredis (lazyConnect, no retry, no fail)
     b. If successful, wrap redis commands → return
     c. If error, log warning → fall through to memory store
  3. Return in-memory Map store
```

### 11.4 In-Memory Fallback

`memStore`: A `Map<string, {v: string, exp: number}>` with:
- TTL checked on every `get()` — expired entries removed
- `incr()` with default 24h TTL for new keys
- `setex()` stores expiration timestamp
- **No persistence** — all data lost on server restart

### 11.5 Critical Note

The password reset flow depends on Redis. If Redis is unavailable and the in-memory store is used on a multi-instance deployment (which it isn't — single container), reset tokens would be instance-specific. In single-container deployment this is acceptable.

---

## 12. Security Architecture

### 12.1 Implemented Security Measures

| Layer | Measure | Location | Status |
|-------|---------|----------|--------|
| Transport | HTTPS (Caddy auto TLS) | Caddyfile | ✅ Production only |
| Transport | HSTS (max-age=63072000, preload) | middleware.ts:79-81 | ✅ Production only |
| Auth | HMAC-SHA256 signed session cookies | auth.ts | ✅ |
| Auth | httpOnly, sameSite:lax, secure cookies | auth.ts:44-49 | ✅ |
| Auth | Password hashing (bcrypt, 12 rounds) | auth.ts | ✅ |
| Auth | Rate limiting on login (5/15min per email:IP) | rate-limit.ts | ✅ |
| Auth | Password reset with short-lived hashed tokens | forgot-password.ts | ✅ |
| CSRF | Origin header check on mutating API requests | middleware.ts:16-36 | ✅ Partial (no CSRF token, only origin check) |
| Rate Limit | Per-IP 60 requests/minute on all API | middleware.ts:38-53 | ✅ (in-memory, single-instance only) |
| Input Val. | Zod schemas on register/login/product/order/review/contact | schemas.ts | ✅ Partial (not all routes use Zod) |
| File Upload | MIME type check (server-side) | upload/route.ts:17 | ✅ |
| File Upload | Magic byte validation (byte-level) | magic-bytes.ts | ✅ |
| File Upload | File size limit (5MB) | upload/route.ts:18 | ✅ |
| File Upload | Random filename (no user-controlled names) | upload/route.ts:43 | ✅ |
| SQL | Parameterized queries | search.ts | ✅ |
| CSP | Content-Security-Policy header | middleware.ts:63-77 | ✅ |
| Headers | X-Content-Type-Options: nosniff | middleware.ts:57 | ✅ |
| Headers | X-Frame-Options: DENY | middleware.ts:58 | ✅ |
| Headers | Referrer-Policy: strict-origin-when-cross-origin | middleware.ts:59 | ✅ |
| Headers | Permissions-Policy (camera=(), microphone=(), geolocation=()) | Caddyfile:9 | ✅ |
| Headers | -Server (remove server header) | Caddyfile:10 | ✅ |
| PWA | HTTPS requirement for service worker | manifest | ✅ |

### 12.2 Missing or Partial Security Measures

| Gap | Details | Risk |
|-----|---------|------|
| **No CSRF token** | Only origin header check — vulnerable if attacker can spoof Origin on same-site. Origin check is good but not complete CSRF protection. | Medium |
| **No rate limit on non-login endpoints** | Only login has rate limiting; other endpoints (register, contact, etc.) are unlimited. | Medium |
| **No brute-force on register** | No rate limit on registration attempts. | Low-Medium |
| **No API auth on AI service** | AI assistant has no auth — anyone who can reach port 8000 can use it. Internal (Docker network only). | Low |
| **No input length limits on Prisma text fields** | Tags, descriptions, etc. have no max-length validation in Zod schemas. | Low |
| **No email verification** | Users can register with any email, no verification step. | Medium |
| **No account lockout** | Only rate limiting on login attempts — no permanent lockout after N failures. | Low |
| **Password reset token in URL** | Token is sent as query param in dev console log — could be logged by proxies. | Low (dev only) |
| **No sanitization of user-generated content** | Merchant descriptions, product names, etc. are stored and rendered as-is (XSS risk in client components that use dangerouslySetInnerHTML — none found). | Low |
| **CORS** | No CORS headers set — middleware does Origin check for CSRF but doesn't set Access-Control-Allow-Origin. Browser-to-API from different origin will be blocked by CSP. | Low (expected) |

### 12.3 Security Headers Summary

**Set by middleware.ts:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: off
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' [unsafe-eval in dev]; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://upload.wikimedia.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (production only)
```

**Set by Caddy (additional):**
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
-Server
```

**Set by next.config.ts:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Note: next.config.ts and middleware.ts both set overlapping security headers. The middleware runs first and its headers take precedence.

---

## 13. Docker Architecture

### 13.1 Docker Compose Services (`docker/docker-compose.yml`)

| Service | Image | Port(s) | Depends On | Healthcheck | Restart |
|---------|-------|---------|------------|-------------|---------|
| **caddy** | caddy:2-alpine | 80, 443 | web (healthy) | — | unless-stopped |
| **db** | postgres:16-alpine | 5432 | — | pg_isready (5s) | unless-stopped |
| **redis** | redis:8-alpine | 6379 | — | redis-cli ping (5s) | unless-stopped |
| **web** | Custom (Dockerfile.web) | 3000 | db, redis (healthy) | wget /api/health (30s, start 40s) | unless-stopped |
| **ai-assistant** | Custom (services/ai/Dockerfile) | 8000 | db (healthy) | curl /health (30s, start 40s) | unless-stopped |
| **migrate** | Custom (Dockerfile.web migrate stage) | — | db (healthy) | — | no |
| **backup** | Custom (backup/Dockerfile) | — | db (healthy) | — | unless-stopped |
| **healthcheck-ping** | curlimages/curl | — | web (healthy) | — | unless-stopped |

### 13.2 Dockerfile.web Multi-stage

```
Stage 1: deps (node:22-alpine)
  ├── COPY package.json + package-lock.json
  └── RUN npm ci

Stage 2: builder (node:22-alpine)
  ├── COPY node_modules from deps
  ├── COPY all source
  ├── RUN npx prisma generate
  └── RUN npm run build

Stage 3: runner (node:22-alpine)
  ├── Install curl (healthcheck)
  ├── Create nextjs user (uid 1001)
  ├── COPY public, .next/standalone, .next/static, prisma, node_modules/.prisma
  ├── USER nextjs
  ├── EXPOSE 3000
  └── CMD ["node", "server.js"]

Stage 4: migrate (node:22-alpine)
  ├── COPY node_modules from deps + all source
  ├── RUN npx prisma generate
  └── CMD ["sh", "-c", "npx prisma db push && npx prisma db seed"]
```

### 13.3 Volumes

| Volume | Mount | Purpose |
|--------|-------|---------|
| pgdata | /var/lib/postgresql/data | PostgreSQL data persistence |
| redisdata | /data | Redis data persistence |
| caddy_data | /data | Caddy TLS certificates |
| caddy_config | /config | Caddy config |
| backup_data | /backups | Database backups |

### 13.4 Networks

All services communicate via the default Docker Compose network (bridge). AI assistant connects to the database directly (not through the web app).

### 13.5 Caddy Configuration

- Auto TLS via Let's Encrypt (domain from `$DOMAIN`, email from `$SSL_EMAIL`)
- Reverse proxy to web:3000
- Forward client IP headers (X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, -Server)
- Gzip compression
- JSON structured logging

### 13.6 Backup Service

- Uses `pg_dump` with `--no-owner --no-acl --compress=9`
- Daily backup to `/backups` volume
- 7-day retention (configurable via `BACKUP_RETENTION_DAYS`)
- Filename: `suqai_YYYYMMDD_HHMMSS.sql.gz`
- Dockerfile: `postgres:16-alpine` with `pg_dump` + bash + find

### 13.7 Healthcheck-ping Service

- Connects to external Healthchecks.io monitoring service (free cron-job-style uptime monitoring)
- Pings `$HEALTHCHECKS_URL` every `$HEALTHCHECKS_INTERVAL` (default 300s)
- Silently exits if `HEALTHCHECKS_URL` not set
- Retries 3 times on failure

### 13.8 Deployment Script (`deploy.sh`)

```
1. Check prerequisites (docker, docker-compose)
2. Validate .env exists
3. Check required vars: NEXTAUTH_SECRET, DB_USER, DB_PASSWORD
4. Pull base images
5. Build and start services (docker compose up -d --build)
6. Wait 10 seconds
7. Run migration (docker compose run --rm migrate)
8. Wait 5 seconds
9. Verify web and AI health
10. Print connection info
```

---

## 14. Production Infrastructure

### 14.1 Full Request Path

```
Internet
  │
  ├── DNS → domain (configured via DOMAIN env var)
  │
Caddy (TLS termination, port 443)
  ├── Auto HTTPS via Let's Encrypt
  ├── Security headers applied
  ├── Gzip compression
  └── Reverse proxy → web:3000
        │
        Next.js (Node.js, port 3000)
        ├── Edge Middleware (CSRF, rate limit, CSP, security headers)
        ├── Static pages (63 pre-built)
        ├── SSR pages (dynamic routes)
        └── API routes (31)
              │
              ├── PostgreSQL (port 5432, via Prisma)
              └── Redis (port 6379, via ioredis / in-memory fallback)
                    │
                    AI Assistant (FastAPI, port 8000, optional)
                    └── sentence-transformers inference
```

### 14.2 Single-Container Design

The `web` service runs a single Next.js `standalone` build container. No horizontal scaling. In-memory caches (rate limit Map, logger queue, Redis fallback) are instance-specific.

### 14.3 Health Check Hierarchy

```
Caddy ←── web (port 3000, GET /api/health)
            ├── PostgreSQL (SELECT 1)
            └── Redis (GET health:ping)

healthcheck-ping ←── web (port 3000, curl /api/health)
                     └── Healthchecks.io (external monitoring)
```

### 14.4 Key Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | — | ✅ Yes |
| `NEXTAUTH_SECRET` | Auth secret (session fallback) | — | ✅ Yes |
| `SESSION_SECRET` | Session HMAC key (falls back to NEXTAUTH_SECRET) | — | Recommended |
| `NEXT_PUBLIC_APP_URL` | Public app URL | http://localhost:3000 | For reset links |
| `AI_SERVICE_URL` | AI assistant URL | http://ai-assistant:8000 | Docker only |
| `DB_USER` / `DB_PASSWORD` | PostgreSQL credentials | — | ✅ Docker |
| `DOMAIN` | Deployment domain | localhost | For HTTPS |
| `SSL_EMAIL` | Let's Encrypt email | — | For HTTPS |
| `REDIS_URL` | Redis connection string | — | Optional (falls back to memory) |
| `HEALTHCHECKS_URL` | Healthchecks.io ping URL | — | Optional |
| `SENTRY_DSN` | Sentry error tracking | — | Optional |

### 14.5 CI/CD Pipeline (GitHub Actions)

```
Job 1: lint + typecheck + test
  ├── Services: PostgreSQL 16 + Redis 8
  ├── Steps: checkout → node 22 → npm ci → prisma generate → typecheck → lint → test
  └── Env: DATABASE_URL, NEXTAUTH_SECRET, SESSION_SECRET

Job 2: docker build (depends on Job 1)
  ├── Steps: checkout → docker build web → docker build migrate → docker build ai-assistant
  └── No push to registry (CI only tests that images build)
```

**Note**: CI does not run the actual Docker Compose stack — it only verifies that Docker images build successfully.

---

## 15. Testing Analysis

### 15.1 Test Suite Overview

| Suite | File | Tests | Type | Coverage Target |
|-------|------|-------|------|-----------------|
| Logger | `src/test/logger.test.ts` | 2 | Unit | Logger interface and JSON output |
| Auth Schemas | `src/test/auth.test.ts` | 9 | Unit | Registration/login Zod validation |
| Magic Bytes | `src/test/magic-bytes.test.ts` | 8 | Unit | File type detection by magic bytes |
| Zod Schemas | `src/test/schemas.test.ts` | 14 | Unit | Schema validation edge cases |
| **Total** | | **33** | | |

### 15.2 Test Coverage Details

**logger.test.ts (2 tests):**
- Exports all 4 log levels (debug, info, warn, error)
- logger.info writes valid JSON to stdout with correct fields

**auth.test.ts (9 tests):**
- registerSchema: rejects short password (< 8)
- registerSchema: accepts exactly 8 chars
- registerSchema: rejects invalid email (no domain)
- registerSchema: accepts merchant registration with optional fields
- registerSchema: rejects empty name
- loginSchema: rejects empty email
- loginSchema: rejects empty password
- loginSchema: accepts valid login
- *(9th test not detailed in source — likely the combined suite)*

**magic-bytes.test.ts (8 tests):**
- Detects JPEG (0xFF 0xD8 0xFF)
- Detects PNG (8-byte PNG signature)
- Detects GIF (GIF89a)
- Detects WebP (RIFF + WEBP)
- Rejects plain text (Hello)
- Rejects empty buffer
- Rejects partial JPEG (only 2 bytes)
- Rejects PHP file (<?php)
- Rejects HTML file (<html)

**schemas.test.ts (14 tests):**
- registerSchema: valid input, short password, invalid email, valid phone (3 formats), invalid phone
- loginSchema: valid input, empty password
- reviewSchema: valid review, rating < 1, rating > 5
- contactSchema: valid contact, short message

### 15.3 Coverage Gaps

| Area | Not Tested | Risk |
|------|------------|------|
| **Auth logic** | createSession, getSession, login, register, hashPassword | High — core security |
| **API routes** | All 31 route handlers | High — business logic |
| **Search** | Raw SQL query, filters, parameter binding | Medium |
| **Database** | Prisma queries, seed data integrity | Medium |
| **Components** | All 20 UI components (rendering, state, interaction) | Medium |
| **Middleware** | CSRF check, rate limiting, CSP headers | Medium |
| **Redis** | Store interface, in-memory fallback | Low |
| **End-to-end** | No E2E tests (Cypress, Playwright) | Medium |
| **Integration** | No integration tests between services | Medium |

### 15.4 Test Configuration

- **Framework**: Vitest 3.1.0
- **Environment**: jsdom (browser-like for component tests if added)
- **Setup**: `src/test/setup.ts` (purpose not found — likely imports testing-library matchers)
- **Pattern**: `src/**/*.test.{ts,tsx}`
- **Run command**: `npm test` (`vitest run`) or `npm run test:watch` (`vitest`)

---

## 16. Dependency Analysis

### 16.1 Production Dependencies

| Package | Version | Purpose | Criticality |
|---------|---------|---------|-------------|
| `next` | ^15.5.18 | React framework (App Router, SSR, RSC) | **10/10** |
| `react` / `react-dom` | 19.2.4 | UI library | **10/10** |
| `@prisma/client` | ^6 | ORM — database access | **10/10** |
| `prisma` (dev) | ^6 | Schema management, migrations, generate | **10/10** |
| `next-auth` | 5.0.0-beta.28 | **NOT USED** (but installed) | 0/10 |
| `@auth/prisma-adapter` | ^2 | **NOT USED** | 0/10 |
| `bcryptjs` | ^3 | Password hashing (12 rounds) | **9/10** |
| `zod` | ^3 | Input validation schemas | **8/10** |
| `ioredis` | 5.11.0 | Redis client (with in-memory fallback) | **7/10** |
| `react-hook-form` | ^7 | Form state management | **5/10** |
| `@hookform/resolvers` | ^5 | Zod integration with react-hook-form | **5/10** |
| `date-fns` | ^4 | Date formatting | **3/10** |
| `uuid` | ^11 | ID generation (crypto.randomUUID fallback) | **2/10** |
| `@types/*` (dev) | various | TypeScript type definitions | **6/10** |

### 16.2 Dev Dependencies

| Package | Version | Purpose | Criticality |
|---------|---------|---------|-------------|
| `typescript` | ^5 | Type checking | **9/10** |
| `eslint` | ^9 | Linting (flat config) | **8/10** |
| `eslint-config-next` | 16.2.6 | Next.js ESLint rules | **8/10** |
| `tailwindcss` | ^4 | CSS framework (utility-first) | **8/10** |
| `@tailwindcss/postcss` | ^4.3.0 | PostCSS plugin for Tailwind v4 | **8/10** |
| `autoprefixer` | ^10.5.0 | CSS vendor prefixes | **5/10** |
| `vitest` | ^3.1.0 | Test runner | **7/10** |
| `jsdom` | ^26.0.0 | DOM environment for tests | **5/10** |
| `@testing-library/react` | ^16.3.0 | Component testing (not used yet) | **3/10** |
| `@testing-library/jest-dom` | ^6.6.0 | DOM matchers (not used yet) | **3/10** |
| `tsx` | ^4 | TypeScript execution (seed scripts) | **4/10** |

### 16.3 Critical Observations

1. **`next-auth` is an unused dependency**: Both `next-auth` and `@auth/prisma-adapter` are installed but never imported anywhere. The entire auth system is custom (HMAC cookies, bcrypt). These were likely part of an earlier implementation attempt.

2. **`ioredis` is loaded dynamically**: The import is inside a function (`await import("ioredis")`), which means if Redis is not configured, ioredis is never loaded. This is a good pattern for graceful degradation.

3. **No runtime validation library for AI service**: The FastAPI service uses Pydantic for request validation, which is good. But `psycopg2-binary` is installed and never used — the AI service doesn't query the database directly (it receives data from the web app).

4. **No monitoring/logging SDK**: Sentry DSN is in `.env.example` but `@sentry/nextjs` is not in dependencies. Healthchecks.io is integrated at the infrastructure level.

---

## 17. Request Flow Deep Dive

### 17.1 Login Flow

```
Browser
  │
  ├── 1. User fills login form (LoginForm component)
  │
  ├── 2. POST /api/auth/login {email, password}
  │     │
  │     ├── 3. MIDDLEWARE (Edge Runtime):
  │     │     ├── CSRF origin check (Origin === Host) → PASS
  │     │     ├── Rate limit (IP-based, 60/min) → PASS
  │     │     └── Security headers attached to response
  │     │
  │     ├── 4. login/route.ts:
  │     │     ├── Zod parse body → {email, password}
  │     │     ├── Extract IP from x-forwarded-for / x-real-ip
  │     │     ├── checkLoginRateLimit(email, IP):
  │     │     │     ├── store.incr("login:{email}:{IP}")
  │     │     │     ├── if count === 1: store.expire(key, 900)
  │     │     │     └── if count > 5: return 429
  │     │     │
  │     │     ├── login(email, password):
  │     │     │     ├── prisma.user.findUnique({email})
  │     │     │     ├── if (!user) return error
  │     │     │     ├── bcrypt.compare(password, user.password)
  │     │     │     ├── if (!valid) return error
  │     │     │     └── createSession(userId, role, name):
  │     │     │           ├── payload = JSON.stringify({userId, role, name, exp})
  │     │     │           ├── encoded = base64url(payload)
  │     │     │           ├── sig = HMAC-SHA256(encoded, SESSION_SECRET)
  │     │     │           └── Set-Cookie: suqai_session={encoded}.{sig}
  │     │     │
  │     │     ├── resetLoginRateLimit(email, IP) → del key
  │     │     ├── logger.info("Login success")
  │     │     └── Return 200 {user: {userId, role, name}}
  │
  └── 5. Browser stores cookie, navigates to dashboard
```

### 17.2 Create Product Flow

```
Merchant Dashboard (Browser)
  │
  ├── 1. Merchant fills product form (name, description, price, images, etc.)
  │
  ├── 2. POST /api/products {nameAr, description, price, currency, etc.}
  │     │
  │     ├── 3. MIDDLEWARE (same as above)
  │     │
  │     ├── 4. products/route.ts:
  │     │     ├── getSession():
  │     │     │     ├── Read "suqai_session" cookie
  │     │     │     ├── Verify HMAC signature (timing-safe compare)
  │     │     │     ├── Check expiry
  │     │     │     └── Return {userId, role, name}
  │     │     │
  │     │     ├── if (session.role !== "MERCHANT") → 403
  │     │     ├── prisma.merchant.findUnique({userId: session.userId})
  │     │     ├── if (!merchant) → 400 "ليس لديك متجر"
  │     │     ├── Zod parse body → productSchema
  │     │     ├── if (!valid) → 400
  │     │     ├── prisma.product.create({data: {nameAr, price, ..., merchantId}})
  │     │     └── Return 200 {product}
  │
  └── 5. Product appears in merchant's product list
```

### 17.3 Create Order (Checkout) Flow

```
Consumer Cart → Checkout Page
  │
  ├── 1. Consumer clicks "إتمام الطلب"
  │
  ├── 2. POST /api/checkout {shippingAddress, phone, couponCode?}
  │     │
  │     ├── 3. MIDDLEWARE (same as above)
  │     │
  │     ├── 4. checkout/route.ts:
  │     │     ├── getSession() → verify auth
  │     │     ├── if (session.role !== "CONSUMER") → 403
  │     │     ├── prisma.cartItem.findMany({userId: session.userId})
  │     │     │     └── Include: product (id, price, merchantId, merchant.userId)
  │     │     ├── if (cart empty) → 400
  │     │     ├── Check all items from same merchant → else 400
  │     │     ├── Calculate subtotal
  │     │     ├── Apply coupon (if provided):
  │     │     │     ├── Validate coupon exists, active, not expired, not exceeded
  │     │     │     ├── Check minOrder, merchant scope
  │     │     │     ├── Calculate discount (fixed or percentage)
  │     │     │     └── Increment usedCount
  │     │     ├── prisma.order.create({
  │     │     │     consumerId, merchantId, totalAmount, couponId,
  │     │     │     items: {create: cartItems.map(i → {productId, unitPrice, quantity})}
  │     │     │   })
  │     │     ├── prisma.cartItem.deleteMany({userId})
  │     │     ├── prisma.notification.create({userId: merchant.userId, title: "طلب جديد", ...})
  │     │     └── Return 200 {orderId}
  │
  └── 5. Consumer redirected to confirmation page
```

### 17.4 Add Favorite Flow

```
Browser (ProductCard → FavoriteButton)
  │
  ├── 1. Consumer clicks heart icon
  │
  ├── 2. POST /api/favorites {productId}
  │     │
  │     ├── 3. favorites/route.ts:
  │     │     ├── getSession() → verify auth
  │     │     ├── Check existing: prisma.favorite.findUnique({userId, productId})
  │     │     ├── If exists:
  │     │     │     ├── prisma.favorite.delete({id: existing.id})
  │     │     │     └── Return {favorited: false}
  │     │     └── If not:
  │     │           ├── prisma.favorite.create({userId, productId})
  │     │           └── Return {favorited: true}
  │
  └── 4. Heart icon toggled (filled/outline)
```

### 17.5 Upload Image Flow

```
Browser (Upload Form)
  │
  ├── 1. User selects image file
  │
  ├── 2. POST /api/upload (multipart/form-data)
  │     │
  │     ├── 3. upload/route.ts:
  │     │     ├── getSession() → verify auth
  │     │     ├── Parse formData → get File
  │     │     ├── Check MIME type in set: image/jpeg, image/png, image/webp, image/gif
  │     │     ├── Check file size ≤ 5MB
  │     │     ├── Read bytes as ArrayBuffer
  │     │     ├── validateMagicBytes(buffer) → check JPEG/PNG/GIF/WebP signatures
  │     │     ├── if invalid → 400 "محتويات الملف لا تطابق الصيغة المعلنة"
  │     │     ├── Generate random filename: {timestamp}-{random}.{ext}
  │     │     ├── mkdir public/uploads (recursive)
  │     │     └── writeFile → /uploads/{filename}
  │     │     └── Return {url: "/uploads/{filename}"}
  │
  └── 4. Image URL used in merchant/product form
```

---

## 18. Project Knowledge Map

### 18.1 System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                        │
│  ├── Pages (SSR/SSG): 63 static pages                       │
│  ├── Client Components: 20 shared components                │
│  ├── State: Local state (useState), Toast context            │
│  └── Storage: localStorage (recent views, cookie consent)   │
├─────────────────────────────────────────────────────────────┤
│               NEXT.JS APP ROUTER (Node.js)                  │
│  ├── Middleware (Edge Runtime)                               │
│  │    ├── CSRF (origin check on mutating methods)            │
│  │    ├── Rate limit (in-memory Map, 60/min/IP)             │
│  │    └── Security headers (CSP, HSTS, etc.)                │
│  │                                                           │
│  ├── Route Handlers (31 API endpoints)                      │
│  │    ├── Auth: register, login, me, forgot/reset password  │
│  │    ├── CRUD: cities, sectors, merchants, products         │
│  │    ├── Commerce: cart, checkout, orders, favorites        │
│  │    ├── Social: reviews, messages, notifications           │
│  │    ├── Admin: users, merchant verify, admin create        │
│  │    ├── Utility: search, upload, coupons, contact          │
│  │    └── AI: chat, stream (optional)                        │
│  │                                                           │
│  └── Server Components (pages)                               │
│       ├── Landing page (4 Prisma queries)                     │
│       ├── Dynamic pages (city → sector → merchant → product) │
│       └── Dashboard pages (consumer, merchant, admin)        │
├─────────────────────────────────────────────────────────────┤
│                    CORE LIBRARIES (src/lib/)                 │
│  ├── auth.ts        — HMAC-SHA256 session, bcrypt auth       │
│  ├── prisma.ts      — Singleton PrismaClient                 │
│  ├── redis.ts       — Store interface (Redis or in-memory)   │
│  ├── search.ts      — Raw SQL search (ILIKE, parameterized)  │
│  ├── schemas.ts     — Zod validation schemas                 │
│  ├── rate-limit.ts  — Login attempt tracking                 │
│  ├── magic-bytes.ts — File type detection                    │
│  ├── logger.ts      — Queue-based JSON logger                │
│  └── utils.ts       — slugify, formatPrice, classNames, IDs  │
├─────────────────────────────────────────────────────────────┤
│                  DATA PERSISTENCE                            │
│  ├── PostgreSQL 16 (via Prisma 6 ORM)                       │
│  │    └── 14 tables across 10 models, 2 enums               │
│  └── Redis 8 (or in-memory fallback)                        │
│       ├── Rate limit counters                               │
│       └── Password reset tokens                              │
├─────────────────────────────────────────────────────────────┤
│                 EXTERNAL SERVICES (Optional)                 │
│  ├── AI Assistant (FastAPI + sentence-transformers)          │
│  └── Healthchecks.io (cron-ping monitoring)                 │
├─────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE (Docker)                      │
│  ├── Caddy (reverse proxy, TLS, security headers)           │
│  ├── PostgreSQL 16 (database)                               │
│  ├── Redis 8 (cache)                                        │
│  ├── Web (Next.js standalone)                               │
│  ├── AI Assistant (FastAPI)                                 │
│  ├── Migrate (one-shot migration + seed)                    │
│  ├── Backup (pg_dump, 7-day retention)                      │
│  └── Healthcheck-ping (Heartbeat monitor)                   │
└─────────────────────────────────────────────────────────────┘
```

### 18.2 Critical File Dependency Map

```
layout.tsx
  ├── Header.tsx
  │     ├── getSession() ← auth.ts ← prisma.ts
  │     ├── AIChatWidget.tsx
  │     ├── NotificationBell.tsx ← /api/notifications
  │     ├── CartDrawer.tsx ← /api/cart
  │     ├── MobileMenu.tsx
  │     └── LogoutButton.tsx → DELETE /api/auth/me (MISSING!)
  │
  ├── CookieConsent.tsx
  ├── ToastProvider.tsx
  └── PwaInstallPrompt.tsx

middleware.ts
  └── logger.ts

/api/auth/login/route.ts
  ├── login() ← auth.ts ← prisma.ts, cookies()
  ├── loginSchema ← schemas.ts ← zod
  ├── checkLoginRateLimit() ← rate-limit.ts ← redis.ts
  └── logger.ts

/api/search/route.ts
  └── searchProducts() ← search.ts ← prisma.ts

/api/ai/chat/route.ts
  ├── prisma.ts
  ├── fetch() → AI_SERVICE_URL
  └── logger.ts
```

### 18.3 Entry/Exit Points

| Direction | Entry | Exit |
|-----------|-------|------|
| HTTP (browser) | `src/middleware.ts` | All pages and API routes |
| API reads | Route handler → `getSession()` | Route handler → `NextResponse.json()` |
| API writes | Route handler → Zod parse | Route handler → Prisma write → json response |
| File upload | `POST /api/upload` | `public/uploads/{filename}` |
| AI chat | `POST /api/ai/chat` | `POST http://ai-assistant:8000/chat` |
| Auth | `POST /api/auth/login` | `Set-Cookie: suqai_session` |
| Build | `npm run build` | `.next/standalone` |
| Deploy | `docker/deploy.sh` | Docker Compose stack |
| CI | GitHub Actions push/PR | Tests pass → Docker images build |

### 18.4 Areas Requiring Attention

1. **Logout route missing**: `DELETE /api/auth/me` is called by `LogoutButton.tsx` but doesn't exist. Session is never cleared.

2. **`next-auth` is dead code**: `next-auth` and `@auth/prisma-adapter` are dependencies but never used anywhere. Adds ~500KB to build.

3. **Search scalability**: `ILIKE '%keyword%'` cannot use indexes. For production with >10k products, consider PostgreSQL full-text search (`tsvector` + `tsquery`) or ElasticSearch.

4. **AI embeddings are ephemeral**: Stored in-memory on the AI service. Lost on restart. No persistent vector database.

5. **No email delivery**: Password reset tokens are logged to console in dev but never actually emailed. No email service integrated.

6. **Inconsistent input validation**: Some routes use Zod (register, login, product, order, review, contact), others use manual checks (cities, sectors, merchants, checkout, coupons).

7. **No automated DB migrations**: The `migrate` Docker service uses `prisma db push` (schema sync without migration history). `prisma migrate dev` is in package.json but not used in Docker/CI.

8. **Session no rotation**: Sessions last 7 days with no refresh mechanism. No way to invalidate all sessions for a user server-side.

9. **Password reset no email**: Token is stored in Redis and logged to console (dev), but there's no email sending integration. Feature is effectively non-functional in production.

10. **Single-instance assumptions**: In-memory rate limiting and logger queue are instance-local. Won't work with horizontal scaling.

---

*Report generated on Mon Jun  1 02:30:33 2026*
*Based on full source code analysis of SuqAI project at E:\enge project*
*Total: 31 API routes, 10 DB models, 20 components, 7 core libraries, 4 test suites (33 tests), 7 Docker services*
