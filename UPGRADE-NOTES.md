# What changed (short list for the team)

## Added from the Atlantic reference
- Route-change loader: top progress bar + centred ring with the "T" mark (150 ms delay, 10 s fail-safe, never sticks)
- Announcement marquee (text editable in Admin) · mega-menu category bar · mobile "Shop by category" drawer + bottom tab bar
- Category pages `/category/[slug]` with left filters (categories with counts, price, brand, rating, availability), sort, numbered pagination, URL-synced filters
- Live search (name / brand / SKU) · cart slide-in drawer with free-shipping progress · brand strip · trust strip
- Product page: gallery, SKU, specs table, delivery estimate by city, WhatsApp order, bulk quote link, JSON-LD
- B2B quote page (lands in the Support Inbox) · help assistant widget · footer + policy pages

## Selling engine (new)
- Admin > **Store Settings**: shipping charge, free-shipping threshold, city zones, min order, tax (%, inclusive/exclusive, per-product override), COD fee, bank transfer, store info, marquee
- One server-side pricing engine (`lib/pricing.js`, 20 unit tests) used by cart preview AND checkout — the browser can no longer choose the price
- Coupons now really work (percent / flat / free shipping, min order, expiry, max uses, on/off)
- Orders store the full price breakdown; cancelling an order returns the stock (exactly once); printable invoice

## Data
- New additive columns/tables only. Old products + categories untouched; `categories.department` keeps
  "Networking & IT" and "Consumer Tech" separate without hiding anything.
- Demo catalogue: 46 products, 32 categories, 17 brands (from the reference videos).
- Bulk importer (CSV/JSON, dry-run) for the client's full catalogue.

## Removed / fixed
- REMOVED public `/api/setup-admin` (reset admin passwords) and the sign-in "Enter Admin Panel Directly" button
- FIXED role default `admin` -> `customer`; admin e-mails now from `ADMIN_EMAILS`; errors never grant admin
- FIXED `/api/orders/:id` leaking customer name/phone/address to anyone (now owner or order id + phone)
- FIXED checkout trusting client totals / non-atomic stock; now atomic reserve + rollback + idempotency key
- FIXED contact form (went to a third-party Formspree, never reached the admin inbox)
- FIXED analytics counting cancelled orders as revenue
- REMOVED fake countdown, unused/fluff components (FeaturesGrid, InteractiveDashboard, LoyaltyBadge, FrequentlyBoughtTogether),
  static demo dataset, hard-coded coupons, fake ratings/brands, made-up "About" statistics, dead links
- Every page no longer downloads the whole catalogue: paginated/filtered server queries
- Prices are Pakistani Rupees (Rs.) everywhere; images fall back to a placeholder if a file is missing
- Error boundaries (`error.js`, `global-error.js`, `not-found.js`, `loading.js`), request timeouts/retries, rate limits on public forms

## Second pass (after the first Vercel deployment)
- FIXED Vercel build log "Dynamic server usage ... couldn't be rendered statically" on every /admin page:
  root layout + admin layout are now `force-dynamic`, and `lib/permissions.js` no longer swallows Next.js' own dynamic-rendering signal.
  (Side effect fixed too: pages can no longer freeze the menu / marquee / settings into static HTML at build time.)
- ADOPTED the package.json fix made in the IDE: `dev` / `build` now run `node --max-old-space-size=4096 node_modules/next/dist/bin/next ...`
  (works on Windows PowerShell/cmd, macOS, Linux and Vercel); no `@next/swc-win32-x64-msvc` dependency (it breaks Linux/Vercel installs).
- ADDED `sitemap.xml` (home, pages, categories, products) and `robots.txt` (blocks /admin, /api, /cart, /checkout).
- ADDED "notify me when back in stock" on the product page; admin price labels now say Rs.
- HARDENED the category query (`GROUP BY` every selected column).
- New static checks used before every release: syntax, import resolution, undefined identifiers / missing components (0 found),
  SQL placeholder consistency, Next.js file conventions, pricing unit tests.

## Third pass (admin completeness + crash safety)
- HOME PAGE crash protection: every home section sits in its own error boundary; the WebGL particle canvas can no longer crash the
  page (browsers without WebGL/GPU just skip it); the "Something went wrong" page now shows a "Technical details" box with the real reason.
- Admin > Inventory: **edit every field of an existing product** (title, description, category, brand, SKU, price, old price/discount,
  stock, tax %, featured, free shipping, main image + gallery, specifications) + search box + category / stock filters.
- Admin > Orders: **payment status** (Pending / Paid / Refunded; Cash-on-Delivery orders become Paid when Delivered), order details view
  (address, notes, items, price breakdown), search + status filter.
- Admin > **Reviews**: remove spam / abusive reviews.
- Admin > **Stock Alerts**: who is waiting for an out-of-stock product; customers are e-mailed automatically when you add stock (needs RESEND_API_KEY).
- Admin > **Brands**: logo, featured, order, show/hide for the home "Trusted brands" strip.
- E-mails escape HTML in names/messages. Migration `002_admin_upgrade.sql` (additive) adds `orders.payment_status` and notify tracking.
- Offline test-suite used before this release: 151 files syntax/imports/undefined-identifier checks, 20 pricing tests,
  render tests of 20 public + 9 admin pages with production-shaped data, 17 API handler tests (checkout incl. coupon, free shipping,
  stock reservation, tampering, out-of-stock; every admin route).
