# FLOURISH BEE FARM — V12 CUSTOM WEBSITE (PITCH PREVIEW)

Custom-built by Brand Axis as a creative sales concept for Flourish Bee Farm.

## See the website (no tools or account needed)

Unzip this archive. Open **index.html** in Safari, Chrome or Firefox. All images, styling, animation and site scripts are packaged locally and do not require hosting. On your Mac, use the links in the top menu to explore every page.

Pages included:

- `index.html` — Designed homepage with the viscous, scroll-reactive honey border, editorial hero and seasonal product highlights
- `shop.html` — Filterable, searchable catalog with working browser-preview shopping bag
- `product.html` — Individual product pages; click a product from the shop
- `our-story.html` — Ukrainian roots, Carolina home, family story (draft copy)
- `why-flourish.html` — Differentiation, seasonal honey and maker story
- `recipes.html` — Three recipe concepts with expandable instructions and product links
- `admin.html` — Product and inventory editing in **browser-only demo mode**

## Owner demo (not a live protected admin)

Open `admin.html`. You can:

- Create a product and choose a category
- Add a short description and a longer product story
- Upload a JPG/PNG/WebP photo (compressed automatically for the browser preview)
- Specify a product size/variation, season, sample price, and quantity
- Mark listings Available, Coming Soon, Sold Out, or Hidden
- Feature products on the homepage
- Edit/delete listings and reset the sample catalog

Demo changes are stored with `localStorage` in **that one browser on that device only**. If you switch browsers, clear browser data or use a different device, you will not see the same changes. This is not secure and must not be used to operate the actual business.

## Shopper preview

The sample product catalog is linked to the demo shop and product detail pages. Add-to-bag and quantity controls work; checkout is deliberately **disabled**. No orders are created and no payment details are collected. All listed prices and stock levels are placeholders.

The bag displays a proposed **$55 free-shipping threshold** but does not calculate shipping costs. The owner must approve this promotion after calculating margins.

## Visual and factual accuracy

The design uses the real product/event photographs supplied by Brand Axis alongside AI-generated **concept photography**. Generated images are labeled "Concept image". They are not verified photos of Flourish inventory, and some packaging details are fictional. Replace with owner-approved photography before live sales. The beekeeper hero is a **concept portrait**, not confirmed to depict the actual owner.

Product size, pricing, inventory, product ingredients, tasting notes, availability and any shipping promise need approval. No unsupported national honey-supply statistic appears on the site. Organic, medical, allergy-relief or similar claims should not be added without appropriate substantiation.

Alcohol and bee tinctures/propolis should not be offered for live online sale without proper legal, labeling and payment processor review. The propolis collection is **Coming Soon** and not purchasable; alcohol is excluded from the live-ready catalog.

## How to upload to GitHub

1. Open `https://github.com/closetosky-ops/flourish` in your GitHub account.
2. If the repo is empty, choose **uploading an existing file**, then upload the **contents of this unzipped folder**. Keep `assets/` nested, with `index.html` at the repo root.
3. If files exist, replace the old site files and upload new files. Don't upload this ZIP as the website.
4. Choose **Commit changes**. The repo will now contain the actual editable website source.
5. Deploy using your preferred static host (e.g., Netlify) with the publish directory set to the repo root. The site does not need a build command.

If Safari prevents dragging folders onto GitHub's web upload, use **GitHub Desktop** or deploy the extracted folder with Netlify Drop. Do not move `assets/` contents up to the root.

## Live commerce integration roadmap — NOT YET CONNECTED

**Proposed architecture**: Static custom storefront + Supabase (authentication, Postgres catalog, product image storage, order records) + secure serverless Stripe Checkout backend (e.g., Netlify Functions).

A preliminary database schema and row-level security policies are included in `backend/supabase-schema.sql`. They are **drafts, not applied or production tested**.

To move from preview to live:

1. The business owner establishes and controls Supabase and Stripe accounts. Never put secret keys into browser JavaScript or GitHub.
2. Build a protected owner login using Supabase Auth, then replace the local browser catalog with Supabase database reads and writes. Admin product photo uploads use Supabase Storage.
3. Have a server-side checkout function fetch **fresh product prices and stock** from the database; never trust client-submitted prices. Restrict products requiring legal review.
4. Create Stripe Checkout Sessions server-side, handle signed Stripe webhook notifications, record orders and handle stock changes without overselling.
5. Configure taxes, shipping zones/costs, returns, fulfillment email, disclosures, sales policies, product labeling and accessibility testing.
6. Only after end-to-end testing remove the Preview notice and enable real payment buttons.

## Animation notes

The honey pools across the hero edge and gathers into one rounded drop on the right. The drop stretches on downward scroll and retracts when the visitor scrolls back, while the surface ripples gently. The canvas renderer shades the live silhouette and refracts the hero image through it. The SVG supplies a fallback, and the effect is still when the visitor requests reduced motion.

## Version

V12 · November 2026 · Brand Axis / concept prototype

## Footer bee (v11)
The footer on every page now includes a custom inline SVG golden bee in `.footer-bee`, with subtle hovering and wing motion. CSS is at the end of `site.css`; the bee respects reduced-motion preferences. No image or dependency is needed.
