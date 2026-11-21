# CivicResolve — Local & Production Setup Guide

Welcome to **CivicResolve**, the AI-Powered Citizen Grievance Management and Resolution Platform built for the PromptWars X GDG On Campus PSG iTech Challenge.

> [!NOTE]
> **Firebase Spark (Free) Plan Compatible:** CivicResolve is engineered to run 100% on Firebase's free **Spark plan** without requiring billing or upgrading to the Blaze plan. Cloud Firestore and Firebase Authentication handle all database and auth operations, while the free tier of **Cloudinary** handles secure photograph storage via authenticated asset delivery.

---

## ⚡ Instant Evaluation (Zero-Config Demo Mode)

CivicResolve is built with a **graceful fallback architecture**:
If you run the application before configuring live Firebase, Cloudinary, or Gemini credentials:
- The system automatically loads a **realistic demonstration dataset** for **Coimbatore, Tamil Nadu**.
- Deterministic fallback AI triage activates seamlessly if `GEMINI_API_KEY` is not yet set.
- Text-only complaint reporting continues working smoothly even if Cloudinary is not configured.
- One-click demo roles ("Demo Citizen" & "Demo Admin") in the navigation bar allow instant testing of the entire complaint lifecycle without creating accounts.

---

## 1. Prerequisites

- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9+ or compatible package manager
- **Git**

---

## 2. Setting Up Google Gemini API

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** and select or create a Google Cloud project.
4. Copy the generated API key.
5. In your project root, add to `.env.local`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```

---

## 3. Setting Up Firebase (Free Spark Plan)

No credit card or billing upgrade is required. Stay on the free Spark plan.

### A. Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and name it (e.g., `civicresolve-prod`).
3. Complete the setup wizard (Google Analytics is optional).

### B. Enable Email/Password Authentication
1. In the Firebase console left sidebar, navigate to **Build > Authentication**.
2. Click **"Get started"**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Toggle **Enable** for Email/Password and click **Save**.

### C. Create Cloud Firestore Database
1. In the left sidebar, navigate to **Build > Firestore Database**.
2. Click **"Create database"**.
3. Select a database location closest to your users (e.g., `asia-south1` for India).
4. Choose **Start in production mode** (or test mode for quick prototyping) and click **Enable**.

*(Note: Do NOT enable Firebase Storage. Firebase Storage is not needed or used.)*

### D. Obtain Client Configuration
1. Click the **Gear icon (Project settings)** in the top left sidebar.
2. In the **General** tab, scroll to **Your apps** and click the **Web (</>) icon**.
3. Register the app name (e.g. `CivicResolve Web`).
4. Copy the values from the `firebaseConfig` object and populate `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=civicresolve.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=civicresolve
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
   ```

### E. Create Firebase Admin SDK Service Account
1. In Firebase Console, go to **Project settings > Service accounts**.
2. Click **"Generate new private key"**, then confirm **"Generate key"**.
3. A JSON file will download to your computer. Open it and extract:
   - `project_id` ➔ `FIREBASE_PROJECT_ID`
   - `client_email` ➔ `FIREBASE_CLIENT_EMAIL`
   - `private_key` ➔ `FIREBASE_PRIVATE_KEY`
4. Add these into `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=civicresolve
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@civicresolve.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```
   > **Note on Private Keys:** Ensure newlines are represented as `\n` if storing on a single line in environment variables. CivicResolve automatically replaces `\\n` with real newline characters.

---

## 4. Setting Up Cloudinary (Free Plan)

CivicResolve uses Cloudinary's generous free tier for secure, authenticated complaint evidence storage.

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/users/register_free).
2. Once logged in, navigate to the **Dashboard** / **API Keys** section.
3. You will find:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
4. Add these server-side environment variables to `.env.local`:
   ```env
   CLOUDINARY_CLOUD_NAME=CivicResolve
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```
5. **Security Details:**
   - Uploaded complaint photographs are designated with `type: 'authenticated'` and random asset identifiers.
   - Images are **never publicly browsable**.
   - Temporary cryptographically signed delivery URLs are generated only when verified by the complaint owner or an authorized administrator.
   - Original photographs are never exposed on public community feeds.

---

## 5. Configuring Administrator Access

Administrators are verified server-side through the `ADMIN_EMAILS` environment variable.

1. Specify one or more comma-separated administrator emails in `.env.local`:
   ```env
   ADMIN_EMAILS=admin@civicresolve.gov,commissioner@coimbatore.gov.in
   ```
2. When any citizen registers or logs in with this email, the server automatically recognizes them as an administrator.
3. Non-allowlisted users cannot modify complaint statuses, re-route departments, or view private staff notes.

---

## 6. Running the Application Locally

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run the automated test suite:
   ```bash
   npm test
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 7. Testing the Demonstration Workflow

1. **Citizen Reporting with Photo**:
   - Use the **Demo Switcher** to select **"Citizen (Priya Raman)"** or log in.
   - Open `/report`.
   - Enter title: `Severe crater-like pothole near 100 Feet Road`.
   - Description (in English or Tanglish): `Road romba damaged ah iruku, two-wheeler riders fall down during night time.`
   - Select locality: `Gandhipuram`.
   - Upload a sample photograph (JPEG, PNG, or WebP $\le$ 5 MB).
   - Toggle **"Share a privacy-safe summary in Neighbourhood Pulse"**.
   - Click **"Submit Complaint"**.
   - Observe Gemini analyze image bytes in memory, classify the issue under **Roads & Potholes**, assign it to **Roads & Public Works**, and calculate a transparent priority score (e.g. 82/100, Critical).
   - The photo is securely saved to Cloudinary under authenticated delivery and only image metadata (public ID, asset ID, format, timestamp) is recorded in Firestore.
   - Copy the tracking code (e.g., `CR-2026-XXXX`).

2. **Text-Only Complaint Submission**:
   - Submit another complaint on `/report` without attaching an image.
   - Verify that text-only complaints succeed immediately, with full Gemini triage and priority scoring.

3. **Restricted Photo Access Verification**:
   - As the report owner, visit `/track/[id]` and verify that the photo is displayed with a signed delivery badge.
   - Open an incognito browser window or log out, then visit the public tracking page for that complaint.
   - Notice that the original photograph is **not exposed**; only the objective AI visual observations are visible to public visitors.

4. **Administrator Triage & Resolution (`/admin`)**:
   - Use the **Demo Switcher** to select **"Operations Desk"** (or sign in as `admin@civicresolve.gov`).
   - Navigate to `/admin`.
   - Locate your complaint in **All Reports** and click **"Inspect"**.
   - Verify that the administrator can view the verified photographic evidence via the temporary signed delivery URL.
   - Update the status to **"In Progress"** or **"Resolved"** and publish an official update.

5. **Neighbourhood Pulse (`/issues`)**:
   - Visit `/issues`.
   - Notice nearby related complaints within a 150m radius in Gandhipuram.
   - Click **"Support This Issue"** to record community support (+1).

---

## 8. Deploying to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
3. Under **Environment Variables**, add the keys from your `.env.local`:
   - `GEMINI_API_KEY`, `GEMINI_MODEL`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `ADMIN_EMAILS`, `DEFAULT_JURISDICTION`
4. Deploy! The app builds cleanly using `npm run build`.
