# TechNest x Atlantic — Setup Guide (Roman Urdu)

Yeh zip aap ke purane Technest project ka **upgraded version** hai: design/theme/features wahi hain, aur Atlantic Store se
li gayi achi cheezein add ho gayi hain (route loader "T" ring, mega-menu categories, side filters, live search, cart drawer,
mobile bottom bar, admin settings for shipping/tax, working coupons, secure checkout, B2B page, assistant, policy pages...).

> **Zip mein `.env.local` bhi hai** (aap ki asli Neon + Clerk keys, bilkul unchanged; sirf `ADMIN_EMAILS` line add hui hai).
> Isay kisi ko share/upload mat karein. `.gitignore` is file ko git push se pehle hi rok deta hai.

---------------------------------------------------------------------------------------------------

## 1) Pehli dafa chalana (Anti-Gravity / VS Code terminal)

```bash
# 1. zip ko unzip karein, folder "Technest" ko IDE mein open karein
# 2. terminal mein:
npm install
npm run dev
```

`npm run dev` shuru hone se pehle **khud** yeh karta hai (aap ko kuch nahi karna):

1. Neon DB ka JSON **backup** `backups/` folder mein (agar migration pending ho)
2. DB mein **naye columns/tables add** (`sql/001_upgrade.sql`) — kuch delete/replace nahi hota, purane products waise hi rahte hain
3. **Demo catalogue** (46 Atlantic-style products, 32 categories, 17 brands, `SAVE10` coupon, shipping zones, marquee text) — sirf ek dafa
4. Phir website `http://localhost:3000` par khul jati hai

Agar koi masla ho: `npm run verify` chalayein — yeh saaf PASS / WARN / FAIL list deta hai.

**Zaroori:** Node.js 18.18 ya us se naya (20 / 22 behtar).

---------------------------------------------------------------------------------------------------

## 2) Folder map (kahan kya hai)

| Path | Kya hai |
|---|---|
| `.env.local` | Aap ki asli keys (Neon, Clerk) — **git mein nahi jati** |
| `.env.local.example` | Bina secrets ki copy (reference) |
| `sql/001_upgrade.sql` | Additive DB migration (safe, dobara chalane par bhi theek) |
| `scripts/` | `migrate`, `seed`, `verify`, `backup`, `import-products`, `make-admin`, `test-pricing` |
| `data/seed/atlantic.json` | Demo catalogue + default settings |
| `public/products/` | Product photos (38 photos videos se crop ki hui) |
| `import/products-template.csv` | Client ka data import karne ka template |
| `lib/pricing.js` | Shipping / tax / coupon ka **ek hi formula** (cart + checkout dono yehi use karte hain) |
| `lib/catalog.js` | Products, categories, filters, search ki server queries |
| `app/admin/settings` | Admin > Store Settings (shipping, tax, COD, zones, marquee, store info) |
| `app/admin/categories` | Admin > Categories (department, parent, order, show/hide) |

---------------------------------------------------------------------------------------------------

## 3) Demo ka rasta (kal dikhane ke liye, ~10 minute)

1. **Home** — page load par center mein **ring + "T" loader**, upar orange **marquee** (Admin se editable), trust strip, brands, categories.
2. **Category bar** (desktop) — **SFP / QSFP**, **Fiber**, **CCTV**... par hover: dropdown; arrows se scroll. Mobile par bottom bar > **Shop**.
3. **Fiber** category kholen — **left sidebar**: Categories (counts), Price, Brand, Rating, Availability; Sort; pagination; filters URL mein (link share ho sakta hai).
4. **Live search** — navbar ka search box (ya Ctrl+K): `dahua`, `sfp`, ya SKU `ATL-PLT-SFP-001` likhein.
5. **Product page** — gallery, SKU, specs table, **Delivery estimate** (city likhein: `Lahore` -> Rs.200 / `Karachi` -> Rs.350), WhatsApp / Bulk quote buttons.
6. **Add to cart** — cart icon par **slide-in drawer**, free-shipping progress bar.
7. **Cart** — coupon `SAVE10` lagayen (10% off). Shipping/tax **server** se calculate hoti hai.
8. **Checkout** — sign in, form, COD, **Confirm** -> Order success -> **Track order** (order id + phone).
9. **Admin** (`/admin`, admin email se login):
   - **Store Settings**: free shipping threshold badlein (jaise Rs.3,000), zones, tax on/off — **Live preview** foran total dikhata hai. Save karke cart mein dekhein.
   - **Orders**: status badlein; **Cancelled** karne par stock wapas; **Invoice > Print**.
   - **Inventory**: SKU / Brand / Tax% / Free shipping wale naye fields.
   - **Categories**: naya category / department.
   - **Inventory > Edit**: kisi bhi product ki har cheez (title, category, brand, SKU, price, discount, stock, photos, specs) badal sakte hain; search + filters.
   - **Orders > View / Payment**: address, items, notes dekhein; bank transfer aane par Payment = Paid karein.
   - **Reviews / Stock Alerts / Brands**: spam reviews hatana, out-of-stock waiting list (stock add karte hi customers ko e-mail), brand logos.
10. Purane Technest products (Phones, Laptops...) **waise hi maujood** hain: nav bar mein **Consumer Tech** dropdown, home par alag section.

**Demo se pehle 2 minute:** Admin > Store Settings > "Store information" mein phone / WhatsApp / email / address bhar ke Save karein
(footer, contact page, WhatsApp buttons wahi se aate hain). Khali chhorne par woh hisse bas chhup jate hain.

---------------------------------------------------------------------------------------------------

## 4) GitHub + Vercel par publish

```bash
git add .
git commit -m "Atlantic-style upgrade"
git push
```

(`.env.local` aur `backups/` gitignored hain — push mein nahi jayenge.)

**Vercel** (pehli dafa):
1. vercel.com > **Add New > Project** > apna GitHub repo import karein.
2. **Environment Variables** mein `.env.local` ka **poora content copy karke paste** karein
   (pehli key ke box mein paste karne se Vercel saari lines khud alag kar deta hai). Ye step Vercel ke liye zaroori hai —
   woh `.env.local` git se nahi padhta.
3. **Deploy**. Build se pehle migration khud chalti hai (safe & idempotent).
4. Deploy ke baad `https://<aap-ka-domain>/api/health` kholein — `"ok": true` aana chahiye.
5. Agar sign-in Vercel par masla kare: Clerk dashboard mein us domain ko allowed origins/domains mein add karein
   (Clerk **test keys** development mode mein hoti hain; asli launch par live keys chahiye).

---------------------------------------------------------------------------------------------------

## 5) Asli data (client ke 380 products) kaise dalna hai

1. Client se **CSV/Excel export** + **images ka folder** lein.
2. CSV ko `import/` mein rakhein (columns ke liye `import/products-template.csv` dekhein). Images `public/products/` mein.
3. Pehle test: `npm run import:products -- import/mera-data.csv --dry-run` (kuch change nahi hota, report aati hai)
4. Phir: `npm run import:products -- import/mera-data.csv`
5. Demo products hatane ke liye (sirf woh jo seed se aaye): `npm run db:seed:remove`

Category ko `Parent > Child` likhein, jaise `SFP / QSFP > SFP 10G`. Jo categories maujood nahi, khud ban jati hain.

---------------------------------------------------------------------------------------------------

## 6) Masla aaye to

| Nishani | Wajah / Hal |
|---|---|
| `npm install` ERESOLVE / peer error | `.npmrc` (`legacy-peer-deps=true`) folder mein hona chahiye — zip mein maujood hai |
| `DATABASE_URL is not set` | `.env.local` project root mein hai? Vercel par env variables paste kiye? |
| Migration fail / DB connect nahi | Internet + Neon project active? Temporary skip: `SKIP_DB_MIGRATE=1 npm run dev` |
| Site khuli par products nahi | `npm run verify` chalayein; `/api/health` dekhein; `npm run db:migrate` |
| Admin panel nahi khulta | Aap ki email `ADMIN_EMAILS` (`.env.local` / Vercel) mein honi chahiye, ya `npm run make-admin -- aap@email.com` |
| Checkout "session expired" | Dobara sign in karein |
| Price/total ajeeb | `npm run test:pricing` (20 tests) — total hamesha server calculate karta hai |
| Vercel build fail | Build log dekhein; sab se aam wajah env variable missing hota hai |
| Vercel log mein `Dynamic server usage ... admin` | Is version mein fix ho chuka hai (root layout `force-dynamic`) |
| Windows par `NODE_OPTIONS is not recognized` | Is version ke `dev`/`build` scripts cross-platform hain (`node --max-old-space-size=4096 ...`) |
| `@next/swc-win32-x64-msvc` package.json mein add ho gaya | Hata dein — Vercel (Linux) par install fail karta hai; `next` ise khud optional dependency ke taur par install kar leta hai |
| Kuch ulta ho gaya | `backups/backup-*.json` (purana data), `git revert`, ya Vercel > Deployments > purani deployment > **Promote to Production** |

**Security:** Purana `/api/setup-admin` route aur sign-in ka "Enter Admin Panel Directly" button **hata diya gaya hai**.
Naye users ka default role ab **customer** hai (pehle admin tha). Admin sirf `ADMIN_EMAILS` ya users table se.
Admin > Staff & Roles mein check karein ke sirf wahi log admin hain jo hone chahiye (purane default ki wajah se
extra admin rows ho sakti hain).

---------------------------------------------------------------------------------------------------

## 7) Anti-Gravity ke AI ko yeh paste karein (jo kaam AI kar sakta hai)

```
Project root: Technest (Next.js 14 + Clerk + Neon). Do NOT change versions in package.json and do NOT
print or commit .env.local. Please run these in order and fix only real errors:
1) npm install
2) npm run verify      (read the output; tell me about any FAIL)
3) npm run test:pricing
4) npm run dev         (wait until it says Ready; the DB migration + seed run automatically first)
5) Open http://localhost:3000/api/health and confirm "ok": true
6) npm run build       (must finish without errors)
7) If everything passes: git add . ; git commit -m "Atlantic-style upgrade" ; git push
Report every error message you see exactly, and never delete data or run destructive SQL.
```

Neon par "push" ki zaroorat nahi: DB changes migration khud apply karti hai (`npm run dev` / `npm run build`).
