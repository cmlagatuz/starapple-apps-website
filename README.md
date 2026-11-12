# StarApple Apps LLC — website & lead portal

A responsive single-page company site with an animated caimito/star-apple mark, accessible scroll transitions, custom service visuals, GitHub REST metrics, a meeting-preference calendar, and a three-step RFQ form with optional private file attachment. The frontend is **vanilla JavaScript, semantic HTML, and CSS** (no build-time frameworks or third-party JavaScript dependencies). A separate **Firebase Functions v2** backend stores submissions in Firestore and private attachments in Cloud Storage.

> **Deployment state:** Source is ready; no Firebase or GitHub project is connected by this archive. The forms do **not** send emails or create calendar events automatically. A successful form submission means Firebase stored the inquiry. An administrator must monitor Firestore and reply to the visitor. Production protection, notifications, and company-specific legal text are additional launch tasks.

## Project structure

```text
starapple-apps-website/
├── index.html                  # SEO, complete SPA markup, meeting & RFQ forms
├── src/
│   ├── main.js                # Bootstrapping, menu, legal dialogs
│   ├── brand.js               # SVG artwork inspired by Philippine caimito
│   ├── styles.css             # Responsive visuals, animation, dark sections
│   ├── motion.js              # Intro, scroll effects, cursor dust & confetti
│   ├── calendar.js            # Preferred weekday/slot picker (Asia/Manila)
│   ├── github.js              # Live public GitHub REST API widget
│   └── forms.js               # Validation and backend submissions
├── public/
│   ├── site-config.js         # PUBLIC settings (never put secrets here)
│   ├── favicon.svg
│   ├── social-card.svg
│   └── robots.txt
├── functions/
│   ├── index.js               # HTTPS v2 submitInquiry, validation and storage
│   ├── package.json
│   └── .env.example
├── tests/site.test.mjs
├── scripts/{build,check,serve}.mjs
├── .github/workflows/deploy.yml
├── firebase.json             # Hosting SPA + /api/inquiries rewrite
├── firestore.rules           # Deny all direct client read/write
├── firestore.indexes.json
├── storage.rules             # Deny all direct client read/write
├── .firebaserc.example
├── .gitignore
├── package.json
└── package-lock.json
```

## 1. Development and quick checks

Use Node.js **22** (Node >=20 works for the frontend) and Git. In a terminal, change into the extracted root folder:

```bash
npm ci
npm run dev               # http://localhost:4173
npm run check             # JS syntax checks + tests + static build
npm run preview           # Preview the dist/ build at http://localhost:4173
```

The custom offline build script emits `dist/`; it copies `public/` into the site root and `src/` to `dist/assets/`. `npm run preview` and `npm run dev` are alternatives; stop one server before starting the other. `npm run dev` previews the UI; the `/api/inquiries` endpoint returns 503 until the Firebase Functions emulator or a live deployment is used.

> **Customize before publication:** Edit `public/site-config.js`. `githubOwner: 'cmlagatuz'` is the initial example GitHub account; change it to the intended official company user or organization. `contactEmail` is deliberately blank, since no company email inbox has been verified. Only add an email you control. The public GitHub section displays *public account* activity and makes no claim about client work. Set page metadata, brand/copy and the draft privacy/terms language to match your company.

## 2. Firebase project preparation

1. In [Firebase Console](https://console.firebase.google.com/), create or select a **Firebase project** and its **Hosting** site.
2. Enable **Cloud Firestore**, and choose the database location deliberately (it cannot be changed in place later).
3. Enable **Cloud Storage for Firebase** and create the project's default bucket.
4. Upgrade to the **Blaze pay-as-you-go plan** before deploying Cloud Functions. Cloud Functions v2 and storage can incur costs; set budgets and alerts in Google Cloud Billing.
5. Install the current [Firebase CLI](https://firebase.google.com/docs/cli) and log in:

```bash
npm install -g firebase-tools
firebase login
firebase projects:list
firebase use --add        # Select the project; creates .firebaserc
```

**Hosting initialization:** The archive already contains `firebase.json` with `public: "dist"`, the SPA fallback, and the function rewrite. Normally **skip** `firebase init hosting` here to avoid overwriting it. If you specifically run it, first back up `firebase.json`, then select your existing project, choose `dist` as the public directory, answer **Yes** to *Configure as a single-page app*, **No** to replacing the existing index file, and **No** to automatic GitHub setup (the included workflow handles that). Restore the supplied function rewrite and headers if the CLI replaces the config. Do not run initializers that overwrite the supplied Firestore/Storage rules or Functions source.

## 3. Deploy backend & privacy rules

From the project root:

```bash
cd functions
npm install
cd ..
# Optional: copy the origin allowlist example and set your real origins:
# Windows PowerShell: Copy-Item functions/.env.example functions/.env
# Linux/macOS:       cp functions/.env.example functions/.env
firebase deploy --only functions,firestore,storage --project YOUR_FIREBASE_PROJECT_ID
```

`functions/.env` is gitignored; set `ALLOWED_ORIGINS=https://YOUR_FIREBASE_PROJECT_ID.web.app` (comma-separated, also add future verified custom domains). Do not set a different domain from the one actually serving the site. `ALLOWED_ORIGINS` controls browser-origin admission, but is **not** a substitute for anti-bot protection. The simple IP request cap allows a maximum of 12/day and writes hashed counters into `_inquiryRateLimits`; configure a Firestore TTL policy on its `expiresAt` field to automatically clear old counter documents. Use a long random `RATE_LIMIT_SALT` function environment variable for stronger IP hashing before public launch. Do **not** commit `.env` or service-account keys.

The backend function is named `submitInquiry`, deployed to **asia-southeast1**. It stores inquiries in the `inquiries` collection. Uploads are private objects under `inquiries/<id>/`. Firestore and Storage client security rules deny all direct access. Admin SDK service credentials are available only within the trusted Cloud Function.

For local end-to-end testing after installing Functions dependencies, run `npm run build`, then use the Firebase Emulator Suite:

```bash
firebase emulators:start --only hosting,functions,firestore,storage
# Open http://localhost:5000
```

The emulator suite may require Java installed for the Firestore emulator. The functions and database in the emulator use local test data; deploy to the actual Firebase project only after validation.

## 4. Initial Firebase Hosting deployment

```bash
npm run check
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

Important: Hosting serves `dist/`, not `public/`. Do not run `firebase init hosting` again unless you preserve `firebase.json` and avoid generating its example `public/index.html`; otherwise the placeholder can replace the website.

Use the output URL, usually:

```text
https://YOUR_FIREBASE_PROJECT_ID.web.app
https://YOUR_FIREBASE_PROJECT_ID.firebaseapp.com
```

These URLs are **examples**, not already deployed sites. Use the Firebase Console's actual assigned Hosting site URL. If you deploy Hosting before the backend, the design appears but meeting/RFQ submissions cannot succeed. Deploy `functions,firestore,storage` to activate them. If your Firebase project has multiple Hosting sites, add an explicit Hosting `site`/`target` config and deploy `--only hosting:<target>` instead.

## 5. Create GitHub repository and push

Create a new **empty** GitHub repository called `starapple-apps-website` first (do not pre-populate it with a README or license). From the extracted root:

```bash
git init -b main
git add .
git commit -m "Initial StarApple Apps LLC website"
git remote add origin https://github.com/YOUR_USERNAME/starapple-apps-website.git
git push -u origin main
```

If using an existing repo, adapt `origin` and branch. GitHub may request an approved credential or SSH key; do not use your GitHub account password as a Git credential. The `.gitignore` excludes Firebase function environment files and private keys. The current repository also tracks `dist/` for inspection, but CI rebuilds it on each deployment.

## 6. GitHub Actions CI/CD → Firebase Hosting

`.github/workflows/deploy.yml` is the only Hosting deploy workflow and runs on:
- Pull requests targeting `main`: `npm ci` → JS lint/test → build (**no live deployment**).
- Commits pushed to `main` (including a merged PR): the same checks, then **live Firebase Hosting deployment**.

It uses the official [`FirebaseExtended/action-hosting-deploy@v0`](https://github.com/FirebaseExtended/action-hosting-deploy) action. The deployment targets the `starappleapps` Firebase project and uses this existing GitHub Actions secret under `Settings → Secrets and variables → Actions → Secrets`:

```text
Name:  FIREBASE_SERVICE_ACCOUNT_STARAPPLEAPPS
Value: {entire contents of your Firebase-deploying service-account JSON file}
```

To generate the JSON, open **Google Cloud Console → IAM & Admin → Service Accounts**, select the correct Firebase project, create a **dedicated GitHub deploy service account**, and grant only the roles necessary for your Hosting deployment. The [Firebase action's service account guide](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md) documents **Firebase Hosting Admin**, **Service Usage API Keys Viewer**, and **Cloud Run Viewer** when function rewrites are present, plus **Firebase Authentication Admin** where Auth preview-domain configuration is needed. Prefer the minimum roles your particular deployment needs. From the service account's **Keys** tab, create a JSON key; copy its entire content into `FIREBASE_SERVICE_ACCOUNT_STARAPPLEAPPS`. Then securely delete the local downloaded copy. Never put JSON keys in a Git commit, `.env`, frontend code, GitHub variable, issue, or chat. Rotate a leaked key immediately.

The first commit can trigger Actions before the secret is created and therefore fail deployment; configure the settings, then select **Re-run jobs** or push another commit. The workflow's built-in GitHub token is **not** the Firebase service account. For future hardening, replace long-lived JSON keys with GitHub OIDC/Workload Identity Federation and review Actions permissions.

**Important:** CI automatically deploys **Hosting only**. When you change `functions/index.js` or Firestore/Storage rules, deploy them manually using step 3. You can later add a separately authorized workflow for backend deployment; don't give the hosting-only CI service account broad admin permissions by default.

## 7. Custom domain connection and zero-downtime migration

Do this **after** the `.web.app` site is verified and the domain is purchased. The example `starappleapps.com` is illustrative and its availability/ownership is **not** implied.

1. Open Firebase Console → **Hosting** → choose the intended site → **Add custom domain**.
2. Enter the actual domain (e.g., `starappleapps.com`). For a new/unhosted domain choose **Quick setup**. If it currently serves visitors from another provider and downtime matters, choose **Advanced setup**.
3. Complete ownership verification by adding the **exact TXT value** Firebase displays to the registrar DNS. On many registrars the apex name is `@`, but use your registrar's correct format. Keep the ownership TXT record in place for certificate renewals.
4. For a brand-new site (**Quick setup**), add the exact Firebase-provided **A** record(s), removing conflicting old A/AAAA/CNAME records when instructed. The common Firebase Hosting example is `A @ → 199.36.158.100` (and sometimes `A www → 199.36.158.100`), **not a substitute** for values shown by your actual Firebase wizard. Follow Firebase's specific records for both apex and `www`; configure a primary-domain redirect as appropriate.
5. For an existing live domain (**Advanced setup / zero-downtime**), **do not cut over A records immediately**. First add the Firebase-provided ownership TXT and any **ACME challenge TXT** or other verification record requested. Firebase prepares domain ownership and SSL while the old provider keeps serving visitors. Wait for the new SSL certificate to be ready, then switch A/AAAA records to the new Hosting values. This sequencing avoids intentional downtime; worldwide DNS propagation and caching mean an absolute zero interruption cannot be guaranteed.
6. Allow DNS and SSL provisioning time, potentially **up to 24 hours**. Confirm Firebase shows **Connected**; verify `https://domain`, the `www` behavior, deep links, HTTPS, and form submission. Firebase automatically renews Hosting certificates when required validation records remain valid.
7. If you use Cloudflare or another proxy/CDN, follow the Firebase wizard carefully and avoid proxy/DNS settings that impede ownership verification or certificate issuance. Restrictive CAA records can block certificate creation; the Firebase docs specify acceptable authorities.

Official reference: [Connect a custom domain — Firebase Hosting](https://firebase.google.com/docs/hosting/custom-domain).

## 8. Release checklist (before advertising the site)

- [ ] Confirm business name, copy and rights to the brand asset.
- [ ] Replace example `githubOwner` with the official public GitHub organization/user; confirm owner links and metrics.
- [ ] Add and verify your actual contact email, and arrange monitoring / notifications for new Firestore inquiries.
- [ ] Test meeting requests, RFQ with and without attachment, Firestore records and private bucket permissions end-to-end.
- [ ] Add managed abuse protection (e.g. Turnstile/reCAPTCHA or Firebase App Check), consider antivirus scanning for uploads, and set operational rate limits. The included honeypot and per-IP quota alone are **not sufficient** for high-traffic production use.
- [ ] Finalize data retention/deletion procedures, region choices, and legally reviewed privacy policy/terms for your jurisdiction.
- [ ] Restrict staff Firebase IAM access and monitor costs, errors and Cloud Function logs.
- [ ] Test mobile and keyboard accessibility, `prefers-reduced-motion`, Lighthouse/Core Web Vitals and Safari/Firefox.
- [ ] Configure custom-domain DNS, verify HTTPS, set canonical metadata and absolute Open Graph image URL when the final domain is known.

## FAQ

**Why not React / Tailwind?** This specific brochure/portal is small enough for a clean no-framework setup, minimizing runtime bundles, breaking upgrades, and hosting requirements. The frontend can be migrated to React/Vite later without changing the Firebase inquiry API.

**Does the calendar read real availability?** No. It is a date/time preference request, Monday–Friday, next 90 days, with selectable time slots in **Asia/Manila**. A scheduling or calendar-provider integration is a separate task. The UI explicitly states that no meeting is confirmed until staff reply.

**Do forms work with Hosting alone?** No. Hosting serves the SPA; the Function API, Firestore database, Storage bucket, and rules must also be deployed. If the API is absent the UI shows an error instead of a fake success.

**Where are email notifications?** This starter stores inquiries in Firestore but does not send mail. Add a trusted server-side mail service or Firebase extension to notify staff when a document is created; do not place provider tokens in the frontend. Until then, staff must monitor `inquiries`.

## One-command deployment helpers

After Firebase login and project/resource setup, optional checked-in scripts deploy the complete backend first, then Hosting:

```bash
# Linux / macOS
bash scripts/deploy.sh YOUR_FIREBASE_PROJECT_ID
bash scripts/deploy.sh YOUR_FIREBASE_PROJECT_ID hosting-only
```

```powershell
# Windows PowerShell
.\scripts\deploy.ps1 -ProjectId YOUR_FIREBASE_PROJECT_ID
.\scripts\deploy.ps1 -ProjectId YOUR_FIREBASE_PROJECT_ID -HostingOnly
```

Both scripts run frontend checks before deploying. Use `hosting-only` / `-HostingOnly` only when the backend has already been deployed. You can also use `npm run deploy:hosting` or `npm run deploy:all` after selecting a default Firebase project with `firebase use --add`.

## Interactive studio redesign (November 2026)

The design uses an original near-black developer-studio visual language, with large typography, an animated caimito-inspired particle sculpture, a scroll reading indicator, responsive service panels, and an accessible four-tab engineering walkthrough. The walkthrough is **illustrative**, not connected to live infrastructure; the public GitHub widget remains the source of externally retrieved activity. The meeting request and multistep quotation submission retain their existing Firebase Cloud Functions and Firestore workflows.

- Edit colors, interaction timing and responsive layouts in `src/revamp.css`.
- Edit the animated canvas, keyboard-accessible experience tabs, and scroll effects in `src/experience.js`.
- Edit the landing-page structure in `index.html`. The existing `src/styles.css` continues to supply base components and form styles.
- Run `npm run check` before committing. It validates source syntax, runs automated tests, and rebuilds `dist/`.
- The animation respects the `prefers-reduced-motion` preference and pauses the particle engine outside the viewport.
- Use `public/site-config.js` to configure the public GitHub account and contact email.
- The `.github/workflows/deploy.yml` workflow verifies pull requests and deploys pushes to `main` using the configured `FIREBASE_SERVICE_ACCOUNT_STARAPPLEAPPS` repository secret.

The StarApple interface and brand design are independently developed. The hero now streams a third-party video directly from Unkey; this clip is not a StarApple-owned original. Public availability of an asset is not permission to reuse it commercially—obtain a valid license or the owner's consent before promoting the site commercially.

## Cinematic hero — externally hosted video

The homepage uses the exact URL `https://www.unkey.com/videos/home/hero-av1.mp4` as the source for its HTML5 hero film. It is **streamed directly from the third-party host**, not downloaded, copied into this repository, or rehosted by Firebase. The now-unused local MP4 has been removed to keep Hosting output small.

The hero remains muted, looping and inline when motion is permitted and its section is visible. It pauses offscreen or in a background tab, and the accessible `PLAY FILM / PAUSE FILM` control remains in place. Reduced-motion and data-saving visitors receive a still image unless they enable playback.

The original static `public/media/starapple-core-poster.webp` remains as a poster/loading/error fallback. The external film is encoded as AV1, so playback depends on browser codec support, third-party network availability, and the host's continued willingness to serve the file. If permission or compatibility is an issue, substitute a licensed and broadly compatible video you control.

The website uses fragment links for navigation and currently does not require URL query parameters. Its early head script removes incoming query strings so referral parameters do not carry over into the URL displayed when hovering over internal links. This does not control how third-party apps format their own outbound links before a visitor reaches the site.

Edit visual placement in `src/cinema.css` and playback behavior in `src/cinema.js`. Run `npm run check` to build the `dist/` folder, and merge or push to `main` to deploy automatically via the GitHub Actions workflow.


## Client experience refresh and inquiry backend

The website now opens immediately with **no intro overlay**. The hero is a responsive two-column composition that keeps the specified externally hosted Unkey video visible beside the text. The former technical sandbox is a real, client-oriented service explorer with four accessible tabs, concrete deliverables and contextual project inquiry links. The GitHub Developer Pulse display and public-repository API requests have been removed.

Both meeting and quote forms POST multipart data to `/api/inquiries`, served by the Gen 2 Firebase Function `submitInquiry` in region `asia-southeast1`. **Deploying Hosting alone does not deploy this function.** A separate `.github/workflows/deploy-backend.yml` workflow attempts a backend deployment when its workflow file, `functions/**`, or `firebase.json` changes. The deploy credential must have the Firebase/Google Cloud permissions required for Functions; Blaze billing and the relevant APIs must also be enabled. Consult the backend workflow logs to confirm a completed deployment.

You can deploy manually from the repository root using `firebase login`, `npm ci --prefix functions` and `firebase deploy --only functions:submitInquiry --project starappleapps`. Set up the default Cloud Firestore database for inquiry records, and configure Cloud Storage for optional attachments. Restrict production access in `firestore.rules` and `storage.rules`. Do not expose a writeable public database or client-side secret as a form workaround.

**Live verification:** Visit `https://starappleapps.web.app/api/inquiries` directly; the deployed function responds with HTTP 405 for GET. A 404 or HTML page indicates that the Hosting-to-Function route is not available. Then submit a non-sensitive test inquiry through the website and confirm a `SAP-...` reference and a corresponding Firestore document before publishing the form as operational.

## Full-screen presentation scrolling

The hero background video is full-bleed again (without a border or dedicated video card), with a shorter headline on top and a dark gradient that leaves the right half visible. On sufficiently wide and tall desktop viewports, each major section fills the available screen under the sticky header and uses native CSS scroll snapping to move between deliberate scenes. This includes the overview, interactive solution explorer, services, design statement, story, contact, and closing footer. The small marquee strip is removed to avoid awkward half-section stops.

The four service cards are shown in a compact single row on large desktops rather than two tall rows. Contact forms open in accessible, scrollable dialogs; their original field IDs, validation, and Firebase submission endpoints are retained. The main page remains readable without being forced to navigate through lengthy forms.

On tablets, narrow windows, short viewports and reduced-motion preferences, mandatory snapping is disabled so visitors can scroll naturally and nothing is clipped. The browser's normal wheel, keyboard, touch, and anchor behavior is preserved; no custom wheel interception is used.

## Founders: inline editorial chapter

The **Our Core → Get to know us** link now scrolls to a dedicated `#founders` section immediately below the story. It is a separate full-viewport chapter on large screens (ten sections total), with natural document flow on tablets/phones and short displays.

The professional two-column layout identifies **Zantetsuken — Founder** and **Ajing — Co-Founder**, using only their chosen public developer names. Both images are linked directly from the exact URLs provided by the project owner and fitted with `object-fit:cover`, individual `object-position` crop controls, an editorial dark-gradient overlay, and responsive stacking. Neither image is a verified photograph of either individual; the alt attributes describe them as illustrative artwork.

The supplied third-party images are not owned or licensed by this codebase. Before promoting the site commercially, obtain suitable reuse permission or replace them with artwork the company has rights to. Remote image hosts can change or block delivery. To replace an image later, change the corresponding `img src` in `index.html`, then run the existing deploy workflow. No modal JS, legal-name placeholders, or photo-placeholder assets remain.

## Founder profile narratives

Both inline founder cards include an **Approach & Focus** overview under the role and name. The copy describes a founding product vision for Zantetsuken and a practical delivery mindset for Ajing, with short service-oriented focus tags. These are editorial descriptions aligned with StarApple's positioning; they do **not** claim verified biographies, previous employers, degrees, years of experience, or personal awards.

The existing remote images and crop positions are preserved. On large screens, portrait height is reduced to accommodate the new descriptions without undermining the full-screen scroll design. On smaller screens the cards stack with natural scrolling. Update biographies in `index.html` once the founders approve more specific factual career details.


## Interaction layer (FX)

Additive, progressive-enhancement layer in `src/fx*.js` + `src/fx.css`:

- **GSAP + ScrollTrigger** (pinned 3.12.5, lazy from jsDelivr): hero opening sequence, split-word headlines, scrubbed parallax, statement word-lighting, 3D card reveals, founder portrait masks.
- **three.js** (pinned 0.164.1): hero particle nebula that assembles into the StarApple star and reacts to the pointer; draggable 3D cut-open star apple (story); aurora shader behind contact and footer.
- **Star-iris page transition** for in-page navigation, section rail, `01 / 10` counter, `[` / `]` keyboard hops, cursor ring + star-dust trail, magnetic buttons, tilting service cards.
- Respects `prefers-reduced-motion`, data-saver and low-memory devices, and has a persistent **FX on/off** switch. If a CDN or WebGL is unavailable the base site is unchanged.
- To self-host the libraries (recommended for production, and to add SRI), copy them to `public/vendor/` and change the two URLs in `src/fx-loader.js`.

## Extended founding team (six profiles)

Immediately after **Our Core**, the founders now appear across three consecutive desktop-sized gallery chapters, in this exact order:

1. Zantetsuken — Founder
2. Mel — Co-Founder
3. Sam — Co-Founder
4. Josh — Co-Founder
5. Marbert — Co-Founder
6. Ajing — Co-Founder

The first and last portraits keep the original owner-provided third-party illustrations. Four new, neutral, abstract SVG portraits live at `public/media/cofounder-*.svg`, copied to `dist/media/` during the build. They are not depictions of real individuals; replace them with approved photos or art when available. The short bios are brand-aligned editorial themes, not claims of verified professional or educational credentials.

Full-screen desktop scrolling now includes ten major chapters. The right-hand FX section rail and its dynamic counter include all three founders chapters. Short and narrow viewports retain native document scrolling. The update also fixes accidentally checked-in literal `\\n` sequences in `src/fx-nav.js` and `src/fx-env.js` that were causing deployment lint errors.


## Cinema autoplay, opt-in FX, and kinetic typography

On page entry, the background cinema video declares `autoplay muted loop playsinline preload="auto"` and the playback controller immediately attempts `video.play()` independently of the FX toggle, power-saving flags and hardware capability detection. It pauses when the hero is offscreen, on a hidden tab, or on explicit user pause; resumes when appropriate, and retains a manual Play button if the browser blocks autoplay. **Third-party source availability, AV1 decoding support, or browser autoplay policy can still prevent playback and cannot be bypassed by site JavaScript.**

The FX button uses a stored three-state preference: `auto` (default), `on` (manual opt-in), and `off`. Low-memory/low-CPU/data-saver devices start automatically in OFF, but can turn on **lightweight** GSAP motion using the FX control. Heavy WebGL remains disabled on these devices. The operating system's reduced-motion preference takes precedence and disables FX. The click handler now sends `!on` instead of the previous erroneous value.

The hero headline keeps `Your next big` fixed while the final word cycles across `idea.`, `launch.`, `product.`, `platform.`, and `vision.`. The four main navigation labels, plus the Start a project CTA, perform a brief left-to-right character scramble on click without intercepting fragment navigation. All kinetic text respects reduced-motion preferences.


## November 2026 headline, FX default and layout calibration

- The hero keyword now pauses for **2250 ms** rather than 3000 ms, then scrambles in **490 ms** rather than 640 ms (approximately 25% quicker overall).
- FX is **enabled by default** for every visitor, including less capable devices, while the demanding WebGL scenes are still gated by memory/data-saving capability checks. The OS reduced-motion preference and a deliberate visitor FX OFF choice continue to be honored. The FX storage key is versioned to `starapple-fx-v2` so legacy OFF choices do not suppress the new default after the update.
- Removed the header's GSAP slide-from-top animation and excluded header/secondary hero links from magnetic transforms to eliminate the displaced Start a project CTA and levitating hero-secondary text. Desktop alignment has explicit dimensions; mobile retains stacked actions.
- The Connect footer includes the official [StarApple Apps LinkedIn page](https://www.linkedin.com/company/starappleapps/), opening in a new tab with secure `rel` attributes.


## Full WebGL, native navigation, and founders zigzag

Full GSAP and WebGL effects start whenever the visitor has FX enabled and the browser supports WebGL. No memory, CPU, data-saver or touch-pointer conditions disable or reduce 3D scenes; the 6,200-particle hero, 150-spark story, both aurora backgrounds and configured full rendering resolution are available on all compatible devices. Unsupported WebGL falls back gracefully; reduced-motion and explicit FX off remain respected. This may increase resource use on older phones and laptops.

Removed the old star-iris navigation overlay and its hash-link click interception. Section links and the FX section rail use normal anchors, preserving the smaller nav-letter scramble. Keyboard panel hops use scrollIntoView.

The six founders follow a desktop diagonal zigzag: left-high, right-low across each of the three two-person chapters. The mobile layout stays in its existing single column, without stagger offsets.


## Client application portfolio examples
A new client portfolio chapter sits between Solutions and Philosophy. It uses two replaceable SVG logo files — `public/media/client-placeholder-one.svg` and `public/media/client-placeholder-two.svg` — alongside placeholder application entries. Both are publicly labelled SAMPLE / PLACEHOLDER; they do not represent actual deployed client work. Edit the project copy in `index.html` and replace logo files when approved client cases exist. The build copies `public/media` into `dist/media`. The navigation rail now includes Client apps. The star particle WebGL scene is removed from the hero; the cinema itself and other WebGL scenes continue unchanged.


## Founder image/text zigzag for desktop

The founder chapters keep their original three sections and the six existing founder names, pictures, roles, and written biographies. On desktop widths above 900px, the layout now matches the supplied alternating portrait/text rows: person 01's portrait sits left of their profile, person 02's portrait sits to the right, repeated through all six founders. No staggered vertical card layout remains. At 900px or below, the original stacked image-first cards remain. Smaller browser heights can scroll naturally rather than clipping biographies.


## Real client carousel showcase (November 2026)

The Client Applications chapter is now an accessible, responsive two-slide carousel for **Armamento Dental Studio** and **Dawney Animal Clinic**. Visitors can use previous/next controls, dots, horizontal touch swipes, and keyboard left/right arrows. The carousel auto-advances while visible, pauses on hover/focus, and disables automatic movement under reduced-motion preferences. The slider does not intercept the site's vertical scroll or fragment navigation.

The Dawney logo is based on the owner-provided image and self-hosted as `public/media/dawney-animal-clinic.webp`. Armamento is shown using an original editable *typographic presentation* in `public/media/armamento-dental-wordmark.svg` because the provided website was not accessible for verifying its official logo. It should not be mistaken for a reproduction of that official logo. Armamento's supplied `https://www.armamentodentalstudio.com/#about` is linked. Dawney has no external site link because none was supplied. No unverified statements about project deliverables or deployment outcomes were added.
