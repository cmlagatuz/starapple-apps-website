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

If using an existing repo, adapt `origin` and branch. GitHub may request an approved credential or SSH key; do not use your GitHub account password as a Git credential. The `.gitignore` excludes Firebase function env files, generated builds and private keys.

## 6. GitHub Actions CI/CD → Firebase Hosting

`.github/workflows/deploy.yml` runs on:
- Pull requests targeting `main`: `npm ci` → JS lint/test → build (**no live deployment**).
- Commits pushed to `main` (including a merged PR): the same checks, then **live Firebase Hosting deployment**.

It uses the official [`FirebaseExtended/action-hosting-deploy@v0`](https://github.com/FirebaseExtended/action-hosting-deploy) action. Configure **two** settings on GitHub:

**A. Repository variable** under `Settings → Secrets and variables → Actions → Variables`:

```text
FIREBASE_PROJECT_ID = YOUR_FIREBASE_PROJECT_ID
```

**B. Repository secret** under `Settings → Secrets and variables → Actions → Secrets → New repository secret`:

```text
Name:  FIREBASE_SERVICE_ACCOUNT
Value: {entire contents of your Firebase-deploying service-account JSON file}
```

To generate the JSON, open **Google Cloud Console → IAM & Admin → Service Accounts**, select the correct Firebase project, create a **dedicated GitHub deploy service account**, and grant only the roles necessary for your Hosting deployment. The [Firebase action's service account guide](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md) documents **Firebase Hosting Admin**, **Service Usage API Keys Viewer**, and **Cloud Run Viewer** when function rewrites are present, plus **Firebase Authentication Admin** where Auth preview-domain configuration is needed. Prefer the minimum roles your particular deployment needs. From the service account's **Keys** tab, create a JSON key; copy its entire content into `FIREBASE_SERVICE_ACCOUNT`. Then securely delete the local downloaded copy. Never put JSON keys in a Git commit, `.env`, frontend code, GitHub variable, issue, or chat. Rotate a leaked key immediately.

The first commit can trigger Actions before the secret/variable are created and therefore fail deployment; configure the settings, then select **Re-run jobs** or push another commit. The workflow's built-in GitHub token is **not** the Firebase service account. For future hardening, replace long-lived JSON keys with GitHub OIDC/Workload Identity Federation and review Actions permissions.

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
