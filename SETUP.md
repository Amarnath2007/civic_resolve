# CivicResolve — Local & Production Setup Guide

Welcome to **CivicResolve**, the AI-Powered Citizen Grievance Management and Resolution Platform built for the PromptWars X GDG On Campus PSG iTech Challenge.

This guide provides step-by-step instructions for configuring Firebase, Google Gemini AI, and launching the application in local and production environments.

---

## ⚡ Instant Evaluation (Zero-Config Demo Mode)

CivicResolve is built with a **graceful fallback architecture**:
If you run the application before configuring live Firebase or Gemini credentials:
- The system automatically loads a **realistic demonstration dataset** for **Coimbatore, Tamil Nadu**.
- Deterministic fallback AI triage activates seamlessly if `GEMINI_API_KEY` is not yet set.
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
5. In your project root, set this in your `.env.local`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```

---

## 3. Setting Up Firebase

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

### D. Enable Firebase Cloud Storage
1. Navigate to **Build > Storage**.
2. Click **"Get started"**.
3. Select the default bucket location and click **Done**.

### E. Obtain Client Configuration
1. Click the **Gear icon (Project settings)** in the top left sidebar.
2. In the **General** tab, scroll to **Your apps** and click the **Web (</>) icon**.
3. Register the app name (e.g. `CivicResolve Web`).
4. Copy the values from the `firebaseConfig` object and populate `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=civicresolve.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=civicresolve
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=civicresolve.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
   ```

### F. Create Firebase Admin SDK Service Account
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

## 4. Configuring Administrator Access

Administrators are verified server-side through the `ADMIN_EMAILS` environment variable.

1. Specify one or more comma-separated administrator emails in `.env.local`:
   ```env
   ADMIN_EMAILS=admin@civicresolve.gov,commissioner@coimbatore.gov.in
   ```
2. When any citizen registers or logs in with this email, the server automatically recognizes them as an administrator.
3. Non-allowlisted users cannot modify complaint statuses, re-route departments, or view private staff notes.

---

## 5. Running the Application Locally

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

## 6. Testing the Demonstration Workflow

1. **Citizen Reporting**:
   - Open `/report`.
   - Enter title: `Large crater pothole on 100 Feet Road`.
   - Description (try English, Tamil, or Tanglish): `Road romba damaged ah iruku, two-wheeler riders fall down during night time.`
   - Select locality: `Gandhipuram`.
   - Click "Submit Complaint".
   - Observe Gemini categorize the problem under **Roads & Potholes**, route to **Roads & Public Works**, and calculate an evidence-based priority score (e.g. 82/100, Critical).
   - Copy the tracking code (e.g., `CR-2026-XXXX`).

2. **Tracking Progress**:
   - Navigate to `/track` and paste the tracking ID.
   - Review the resolution timeline (Reported ➔ Under Review ➔ In Progress ➔ Resolved).

3. **Administrator Triage & Resolution**:
   - Click **Admin Portal** or use the **Demo Switcher** to switch to "Operations Desk".
   - Navigate to `/admin`.
   - Locate the complaint in **All Reports** or the **Critical Alerts** queue.
   - Click **Inspect**.
   - Review AI observations and evidence scores.
   - Update status to **In Progress** or **Resolved**.
   - Enter a public progress note: `Field road crew patched pothole with cold-mix bitumen.`
   - Click **Save Official Decision & Publish Update**.

4. **Neighbourhood Pulse**:
   - Visit `/issues`.
   - Observe nearby related reports within a 150m radius.
   - Click **Support This Issue** to increment the community counter (+1).

---

## 7. Deploying to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
3. Under **Environment Variables**, add all keys from your `.env.local`:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `NEXT_PUBLIC_FIREBASE_*`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `ADMIN_EMAILS`
   - `DEFAULT_JURISDICTION`
4. Deploy! The app builds cleanly using `npm run build`.
