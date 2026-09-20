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
