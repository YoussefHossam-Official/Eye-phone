# Eye Phone — Mobile Shop Management System

A production-ready REST API for managing mobile phone retail shops. Built with Node.js, Express, Sequelize ORM, MySQL, and Redis. Designed as a multi-tenant SaaS system where a super admin provisions and manages multiple shop accounts.

---

## Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Shop Types and Multi-Tenancy](#shop-types-and-multi-tenancy)
- [Authentication and Security](#authentication-and-security)
- [API Modules](#api-modules)
- [Database Design](#database-design)
- [Caching Strategy](#caching-strategy)
- [Background Jobs](#background-jobs)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Production Deployment](#production-deployment)
- [What Was Built and Fixed](#what-was-built-and-fixed)

---

## System Overview

Eye Phone is a backend system that allows a super admin to create and manage mobile shop accounts. Each shop operates in complete isolation with its own users, inventory, sales, repairs, and installment contracts. Shops can optionally have branches that operate independently but can transfer inventory between each other.

The system handles three subscription states automatically: a 14-day free trial, an active paid subscription, and a 7-day grace period before full deactivation.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js ESM modules | 18+ |
| Framework | Express | 5 |
| ORM | Sequelize | 6 |
| Database | MySQL | 8+ |
| Cache | Redis via ioredis | 5 |
| Validation | Joi | 18 |
| Authentication | JWT + Session table | — |
| Password Hashing | bcryptjs | 3 |
| Logging | Winston | 3 |
| Scheduler | node-cron | 4 |
| Security | Helmet, CORS, express-rate-limit | — |

---

## Architecture

```
Request
   ↓
Route  (auth check + role check)
   ↓
Controller  (receives request, sends response)
   ↓
Service  (all business logic, transactions, validations)
   ↓
Model  (Sequelize ORM → MySQL)
```

### Service Layer

Every business operation lives in a dedicated service class. All services extend `BaseService` which provides shared utilities.

`findByIdOrFail(id, shopId)` finds a record by ID scoped to the shop or throws 404 automatically.

`findPaginated(shopId, query, options)` provides consistent pagination across all list endpoints.

`buildDateFilter(start, end)` builds a Sequelize date range filter used by reports.

`withTransaction(callback)` wraps any operation in a safe database transaction with automatic rollback on error.

```
src/services/
  BaseService.js                shared OOP base class
  CategoryService.js
  CustomerService.js
  DamagedService.js
  ExpenseService.js
  InstallmentContractService.js
  InstallmentCustomerService.js
  InstallmentService.js
  ProductService.js
  PurchaseService.js
  RepairService.js
  ReturnService.js
  SaleService.js
  TransferService.js
```

---

## Project Structure

```
src/
  config/
    database.js
  controllers/
  services/
  models/
    associations.js
  routes/
  middlewares/
    auth.js
    adminAuth.js
    superAdmin.js
    mainAuth.js
    isOwner.js
    isSales.js
    isTech.js
    isOwnerOrSales.js
    isOwnerOrTech.js
    clearCache.js
    errorHandler.js
    validate.js
  utils/
    AppError.js
    asyncHandler.js
    cache.js
    cacheHelper.js
    cacheKeys.js
    cronJobs.js
    logger.js
    paginate.js
  validations/
  index.js
```

---

## User Roles and Permissions

Every user inside a shop has one of three roles stored in the `users` table.

### owner

The shop owner. Created automatically when a shop is provisioned. Can view everything in the shop. Manages staff accounts and all shop operations. Cannot create a sale transaction or update repair status.

### sales

Sales staff. Creates and manages cash sales, processes returns, receives devices for repair, manages products, categories, customers, purchases, and expenses. Cannot view financial reports, the dashboard, or manage staff.

### tech

Technician. Views assigned repairs, updates repair status, views and consumes spare parts. Cannot access sales, customers, reports, or financial data.

### Role Permissions Matrix

| Feature | owner | sales | tech |
|---|---|---|---|
| Dashboard | read | — | — |
| Reports | read | — | — |
| Products | read + write | read + write | — |
| Categories | read + write | read + write | — |
| Inventory | read | read | — |
| Sales | read | create | — |
| Returns | — | create | — |
| Repairs | read + write | read + create | status update |
| Spare Parts | read + manage | — | read + use |
| Customers | read + write | read + write | — |
| Expenses | read + write | read + create | — |
| Purchases | read + write | read + create | — |
| Transfers | read + write | read + write | — |
| Damaged Items | read + write | read + write | — |
| Installments | read + write | read + write | — |
| Staff Management | full | — | — |
| Branches (main only) | full | — | — |

---

## Shop Types and Multi-Tenancy

**individual** — A standalone shop with no branches. Default type when created via `/auth/register`.

**main** — Owns one or more branches. Has access to consolidated reports, cross-branch inventory, and transfers.

**branch** — Independent unit owned by a main shop. Has its own users, inventory, and subscription. Can transfer inventory to sibling branches.

Every database query is scoped to `shop_id`. A user from Shop A can never access data from Shop B.

### Subscription Lifecycle

```
New Shop
   ↓
Trial Period (14 days)
   ↓ expires
is_active: false  ← if not subscribed
   ↓  or  subscribed
Active Subscription
   ↓ expires
Grace Period (7 days)
   ↓ expires
Expired → is_active: false
```

The `auth` middleware blocks access immediately when trial or subscription expires. It does not wait for the daily cron job.

---

## Authentication and Security

### Login Flow

1. Credentials sent to `POST /api/v1/auth/login`
2. Password verified with bcrypt
3. Shop checked for active status and valid subscription
4. Session count checked — maximum 2 active sessions per user
5. JWT signed with 7-day expiry and stored in the `sessions` table
6. Token and user info (including role) returned

### Token Verification on Every Request

Bearer token extracted from Authorization header → JWT signature verified → token looked up in sessions table → user and shop loaded → subscription status checked → `req.user` and `req.shop` attached.

### Rate Limiting

General API: 100 requests per 15 minutes per IP in production.

Login endpoint: separate stricter limit of 10 attempts per 15 minutes per IP to prevent brute force.

### Other Security

Helmet for secure HTTP headers. CORS restricted to `ALLOWED_ORIGINS`. Passwords hashed with bcrypt. JWT contains user ID, shop ID, and role. Admin routes require Bearer token plus `admin-secret` header.

---

## API Modules

All shop endpoints: `/api/v1`

### Auth — `/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, returns token and role |
| POST | `/auth/register` | Super Admin | Create shop and owner |
| POST | `/auth/logout` | Any | Invalidate current session |
| GET | `/auth/staff` | owner | List all staff |
| POST | `/auth/staff` | owner | Create sales or tech account |
| PUT | `/auth/staff/:id` | owner | Update staff |
| DELETE | `/auth/staff/:id` | owner | Delete staff |

### Products — `/products`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/products` | owner, sales |
| GET | `/products/archive` | owner |
| POST | `/products` | owner, sales |
| PUT | `/products/:id` | owner |
| DELETE | `/products/:id` | owner — soft delete |
| POST | `/products/:id/restore` | owner |
| DELETE | `/products/:id/force` | owner — permanent |
| PATCH | `/products/:id/add-quantity` | owner, sales |

### Sales — `/sales`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/sales` | owner |
| POST | `/sales` | sales |

Sale creation finds or creates customer by phone, validates stock, calculates total minus discount, creates sale items, decrements quantities — all in one transaction.

### Returns — `/returns`

| Method | Endpoint | Access |
|---|---|---|
| POST | `/returns` | sales |

Returns item to inventory or logs as damaged. Adjusts sale total. Deletes sale if all items returned.

### Repairs — `/repairs`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/repairs` | owner, sales |
| GET | `/repairs/:id` | owner, sales |
| POST | `/repairs` | owner, sales |
| PUT | `/repairs/:id` | owner |
| PATCH | `/repairs/:id/status` | tech |

Technician cost calculated automatically. Valid statuses: `received`, `in_progress`, `done`, `delivered`, `rejected`.

### Spare Parts — `/repair-parts`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/repair-parts` | owner, tech |
| GET | `/repair-parts/used` | owner, tech |
| GET | `/repair-parts/:id` | owner, tech |
| POST | `/repair-parts` | owner |
| PUT | `/repair-parts/:id` | owner |
| DELETE | `/repair-parts/:id` | owner |
| PATCH | `/repair-parts/:id/use` | tech |
| PATCH | `/repair-parts/:id/add-quantity` | owner |
| PATCH | `/repair-parts/:id/status` | owner |

### Purchases — `/purchases`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/purchases` | owner, sales |
| POST | `/purchases` | owner, sales |
| DELETE | `/purchases/:id` | owner |

Creating a purchase auto-increments the linked product quantity. Deleting decrements it back. Both in transactions.

### Expenses — `/expenses`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/expenses` | owner, sales |
| POST | `/expenses` | owner, sales |
| PUT | `/expenses/:id` | owner |
| DELETE | `/expenses/:id` | owner |

### Customers — `/customers`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/customers` | owner, sales |
| POST | `/customers` | owner, sales |
| PUT | `/customers/:id` | owner, sales |
| DELETE | `/customers/:id` | owner |

### Categories — `/categories`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/categories` | owner, sales |
| GET | `/categories/archive` | owner |
| POST | `/categories` | owner, sales |
| PUT | `/categories/:id` | owner, sales |
| DELETE | `/categories/:id` | owner — archives products too |
| POST | `/categories/:id/restore` | owner — restores products too |
| DELETE | `/categories/:id/force` | owner — blocked if products have sales |

### Inventory — `/inventory`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/inventory` | owner, sales |

Returns inventory grouped by category with quantities, values, and low stock flags. Cached 5 minutes.

### Dashboard — `/dashboard`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard` | owner |

Today's totals: sales, repairs, installments, expenses, low stock, subscription info. Cached 2 minutes.

### Reports — `/reports`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/reports` | owner |
| GET | `/reports/detailed` | owner |

Types: `daily`, `weekly`, `monthly`, `yearly`, `custom`. Summary and detailed versions. Cached 10 minutes.

### Installment Contracts — `/installment-contracts`

Complete installment system with interest, down payments, late fees, grace periods, rounding, prepayments, and early settlement.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/installment-contracts` | owner, sales |
| GET | `/installment-contracts/:id` | owner, sales |
| POST | `/installment-contracts` | owner, sales |
| POST | `/installment-contracts/schedules/:id/pay` | owner, sales |
| POST | `/installment-contracts/schedules/:id/pay-now` | owner, sales |
| POST | `/installment-contracts/:id/pay-full` | owner, sales |
| POST | `/installment-contracts/:id/prepay` | owner, sales |

### Installment Customers — `/installment-customers`

Separate customer profiles with national ID and backup phone.

### Damaged Items — `/damaged`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/damaged` | owner, sales |
| POST | `/damaged` | owner, sales |

### Transfers — `/transfers`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/transfers` | owner, sales |
| POST | `/transfers` | owner, sales |

Decrements source quantity, increments destination if product found by name. Transaction-safe.

### Branches — `/branches`

Main shops with owner role only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/branches` | All branches with subscription status |
| GET | `/branches/alerts` | Branches expiring within 5 days |
| GET | `/branches/inventory` | Cross-branch inventory |
| GET | `/branches/reports` | Consolidated financial report |

### Technicians — `/technicians`

| Method | Endpoint | Access |
|---|---|---|
| GET | `/technicians/me/dashboard` | tech |
| GET | `/technicians/me/repairs` | tech |
| GET | `/technicians/me/parts` | tech |
| GET | `/technicians` | owner |
| GET | `/technicians/report/all` | owner |
| GET | `/technicians/report/:id` | owner |
| GET | `/technicians/:id` | owner |
| PUT | `/technicians/:id` | owner |
| DELETE | `/technicians/:id` | owner |

### Admin Panel — `/admin`

Requires Bearer token from `/admin/login` plus `admin-secret` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/login` | Admin login |
| GET | `/admin/dashboard` | Shop counts and revenue summary |
| GET | `/admin/revenue` | Monthly revenue breakdown and overdue shops |
| GET | `/admin/shops` | All shops with branches nested |
| GET | `/admin/shops/active` | Active subscribed shops |
| GET | `/admin/shops/trial` | Trial shops |
| GET | `/admin/shops/grace-period` | Grace period shops |
| GET | `/admin/shops/expired` | Expired shops |
| GET | `/admin/shops/inactive` | Deactivated shops |
| GET | `/admin/shops/subscriptions` | Full subscription list |
| GET | `/admin/shops/:id/payments` | Payment history |
| POST | `/admin/shops` | Create shop and owner |
| PATCH | `/admin/shops/:id` | Update shop details |
| PATCH | `/admin/shops/:id/subscription` | Set or renew subscription |
| POST | `/admin/shops/:id/pay-due` | Record partial payment |
| PATCH | `/admin/shops/:id/toggle` | Activate or deactivate |
| DELETE | `/admin/shops/:id` | Permanently delete |

---

## Database Design

| Table | Purpose |
|---|---|
| shops | Multi-tenant root |
| users | All users with role field |
| sessions | Active sessions, max 2 per user |
| admins | Super admin accounts |
| categories | Soft-deletable product categories |
| products | Inventory, paranoid soft delete |
| sale_items | Line items with profit and product snapshot |
| sales | Cash sales with discount support |
| repairs | Repair jobs with technician link |
| repair_parts | Spare parts with usage tracking |
| purchases | Linked to products for auto-quantity updates |
| expenses | Shop expenses |
| customers | Walk-in customer records |
| damaged | Manual and return-origin damage records |
| transfers | Inventory movements between shops |
| installment_customers | Customers for the contracts system |
| installment_contracts | Full contracts |
| installment_schedules | Monthly payment schedule |
| subscription_payments | Admin subscription records |

**Soft delete:** Products and categories set `deleted_at` on delete. Cron permanently removes them after 7 days unless they have sale history.

**Snapshots:** `sale_items` stores product name, model, buy price, and category at the time of sale for permanent historical accuracy.

**Technician migration:** Legacy `technicians` table records are auto-migrated to `users` with `role: "tech"` on startup.

**Atomic inventory:** Quantity updates use WHERE conditions on current values to prevent concurrent requests pushing stock negative.

**Indexes:** All tables indexed on `shop_id`. Composite indexes on `(shop_id, created_at)` and `(shop_id, status)`. Sessions indexed on `token` and `user_id`.

---

## Caching Strategy

| Cache Key | TTL | Cleared When |
|---|---|---|
| `dashboard:{shopId}` | 2 min | Any write to the shop |
| `inventory:{shopId}:{type}` | 5 min | Any write to the shop |
| `report:{shopId}:{query}` | 10 min | Any write to the shop |

`clearCache` middleware intercepts successful write responses and clears all shop cache keys. Only runs on POST, PUT, PATCH, DELETE. Redis failures are silently ignored.

---

## Background Jobs

Four cron jobs run daily at midnight.

**Cleanup:** Permanently deletes products and categories archived more than 7 days ago, skipping those with sale history.

**Installment late marking:** Marks overdue pending and partial schedules as late.

**Subscription management:** Moves expired subscriptions to grace period for 7 days, then deactivates.

**Trial expiry:** Deactivates shops whose trial has ended.

---

## Error Handling

```json
{ "message": "Description of the error" }
```

| Status | Cause |
|---|---|
| 400 | Validation error or business rule violation |
| 401 | Missing, invalid, or expired token |
| 403 | Wrong role, expired subscription, inactive account |
| 404 | Record not found |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## Environment Variables

| Variable | Description |
|---|---|
| NODE_ENV | production or development |
| PORT | Server port |
| DB_HOST | MySQL host |
| DB_USER | MySQL username |
| DB_PASSWORD | MySQL password |
| DB_NAME | Database name |
| JWT_SECRET | Long random hex string |
| ADMIN_SECRET | Header secret for admin routes |
| ADMIN_USERNAME | Super admin username |
| ADMIN_PASSWORD | Super admin password |
| ALLOWED_ORIGINS | Comma-separated CORS origins |
| REDIS_HOST | Redis host |
| REDIS_PORT | Redis port |

---

## Installation and Setup

```bash
npm install
cp .env.example .env
mysql -u root -p -e "CREATE DATABASE mobile_shop;"
npm run dev   # development
npm start     # production
```

---

## Production Deployment

```bash
git pull && npm install
# Set NODE_ENV=production, real passwords, and ALLOWED_ORIGINS in .env
npm start
# After confirming migration in logs:
mysql -u root -p mobile_shop -e "DROP TABLE IF EXISTS technicians;"
```

---

## What Was Built and Fixed

### Architecture

**Services Layer (OOP):** Business logic extracted from controllers into service classes extending `BaseService`. Eliminates duplicated shop-scoped find, pagination, date filter, and transaction patterns.

**Role-Based Access Control:** `role` field added to `users` table. Five middleware files enforce permissions on every route.

**Technician consolidation:** Separate `technicians` table and JWT system removed. Technicians are now `users` with `role: "tech"`. Auto-migration runs on startup.

### Bug Fixes

`paginate.js` used `AppError` without importing it — ReferenceError on any date filter.

`Session.js` had duplicate associations also in `associations.js` — Sequelize registered the relationship twice. Missing indexes on `token` and `user_id`.

`TransferService.js` used dynamic `await import("sequelize")` inside a method on every request.

`PurchaseService.js` had no transactions on create or delete — inconsistent state possible if quantity update failed.

`CustomerService.js` search filter lost the `shop_id` scope when passed to `findPaginated`.

`authController.js` imported `sequelize` without using it.

`cronJobs.js` used `console.log` instead of Winston logger.

`adminDashboardController.js` counted branches in shop statistics, inflating all numbers.

`repairController.js` looked up technicians in the old table after the migration.

`technicianRoutes.js` and `repairPartRoutes.js` had `/me/*` and `/used` routes defined after `/:id`, causing Express to interpret them as ID parameters.

`index.js` used `sync({ force: true })` which dropped all tables and all data on every restart.

`associations.js` still linked `Repair` and `RepairPart` to the old `Technician` model.

### Security Additions

Login rate limiter — 10 attempts per 15 minutes, separate from general API limiter.

Trial expiry enforcement in `auth` middleware — active deactivation when trial ends, not just a counter.

Redis failure resilience — all cache operations in try/catch, server never crashes on Redis outage.

### Features Added

Discount support on sales with validation that discount cannot exceed total.

Purchase-to-inventory auto-link — quantity increments on create, decrements on delete, both in transactions.

Staff management endpoints — owner creates and manages team without going through admin panel.

Admin revenue report — monthly breakdown, overdue shops, per-shop payment summary.

Cache invalidation wired — `clearCache` middleware was built but never applied to routes. Connected to all write routes.

`detailedReport` TTL constant added — was missing from `CACHE_TTL`, causing Redis to receive `undefined` as TTL.
