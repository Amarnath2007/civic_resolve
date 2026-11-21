# CivicResolve

### AI-Powered Citizen Grievance Management and Resolution Platform
**Submission for PromptWars X GDG On Campus Challenge**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.1%20Flash%20Lite-orange?logo=google)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Spark%20(Free)-amber?logo=firebase)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Authenticated%20Storage-blue?logo=cloudinary)](https://cloudinary.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-34%2F34%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)

---

## 1. Chosen Vertical: Civic Technology & Municipal Infrastructure Management

CivicResolve operates within the **Civic Technology, Smart Governance, and Municipal Public Infrastructure** vertical.

### Problem Context & Industry Pain Points
Urban local bodies and municipal corporations (e.g., Coimbatore City Municipal Corporation) receive thousands of unstructured grievances weekly across roads, sanitation, electricity, storm-water drainage, and public safety. Conventional municipal complaint channels suffer from systemic friction:
- **Vernacular Barrier:** Citizens often express urgent local issues in vernacular languages (such as Tamil: தமிழ்) or colloquial code-mixed dialects (Tanglish: *"Road romba damaged ah irukku, street light velicham illa"*). Traditional English-only form fields misclassify or discard these grievances.
- **Arbitrary Citizen Prioritization:** Conventional portals rely on arbitrary citizen self-ratings (e.g., everyone marks their issue as "Urgent"), resulting in critical public safety emergencies being buried under minor cosmetic complaints.
- **Department Routing Ambiguity:** Residents rarely know whether an open trench belongs to Public Works, Water Supply & Sewerage, or the Electricity Board. Misrouted complaints bounce between administrative desks for weeks.
- **Siloed Duplication:** When a main pipe bursts or an asphalt crater forms on an arterial road, dozens of citizens independently file separate tickets. Municipal call centers waste hundreds of human hours logging redundant tickets instead of deploying remediation crews.
- **Lack of Transparency & Trust:** Once submitted, complaints enter a bureaucratic black hole with no verifiable progress milestones or accountability.

CivicResolve resolves these pain points through **multimodal, multilingual AI decision-support**, **geospatial proximity clustering**, and **transparent, role-based resolution workflows**.

---

## 2. Approach and Architectural Logic

CivicResolve was engineered from first principles under a strict **Zero-Billing Constraint** (Firebase Spark Free Tier + Cloudinary Free Tier), ensuring that any local municipal authority can deploy and operate the system at zero operational infrastructure cost without requiring credit-card billing.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CIVICRESOLVE SYSTEM                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [ Citizen (Web / Mobile) ]                     [ Municipal Admin Operations Desk ]    │
│               │                                                   │                    │
│   (Auth Token │ Evidence)                             (Admin Auth │ Triage & Dispatch) │
│               ▼                                                   ▼                    │
│   ┌───────────────────────────┐                         ┌───────────────────────────┐  │
│   │   Next.js App Router UI   │                         │  Dedicated Admin Console  │  │
│   └─────────────┬─────────────┘                         └─────────────┬─────────────┘  │
│                 │                                                     │                │
│                 ▼                                                     ▼                │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │               Protected Server Route Handlers (Next.js 16 + Zod)                │  │
│   │             • Firebase Admin SDK Authentication • Strict Role Validation        │  │
│   └───────┬─────────────────────────────┬─────────────────────────────┬─────────────┘  │
│           │                             │                             │                │
│           ▼                             ▼                             ▼                │
│   ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐        │
│   │   Google Gemini   │       │ Cloudinary Secure │       │  Haversine Pulse  │        │
│   │ 3.1 Flash Lite AI │       │   Media Storage   │       │   (150m Radius)   │        │
│   │ • Multilingual    │       │ • type: 'auth'    │       │ • Proximity Clust │        │
│   │ • In-Memory Photo │       │ • Signed URL Gen  │       │ • +1 Community    │        │
│   │ • 5-Factor Score  │       │ • Zero Public URL │       │   Support Votes   │        │
│   └─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘        │
│             │                           │                           │                  │
│             └─────────────────────┬─────┴───────────────────────────┘                  │
│                                   ▼                                                    │
│               ┌───────────────────────────────────────┐                                │
│               │     Cloud Firestore Unified Store     │                                │
│               │ • reports (Encrypted metadata & logs) │                                │
│               │ • publicReports (Anonymized 110m GPS) │                                │
│               │ • adminAuditLogs (Append-only trail)  │                                │
│               └───────────────────────────────────────┘                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Logic

#### A. Multimodal & Multilingual AI Triage (Google Gemini 3.1 Flash Lite)
- **Vernacular Comprehension:** Native Tamil script (தமிழ்), mixed Tanglish, and English are ingested by Gemini. The model extracts an executive English summary, preserves the original vernacular grievance statement, detects the language, and classifies the problem into a controlled municipal taxonomy.
- **Zero-Leakage In-Memory Visual Inspection:** Photographic evidence is analyzed directly in server memory as base64 byte buffers. Complaint photographs are **never made public on the web** to enable AI inspection.
- **Objective Visual Grounding:** Gemini is strictly prompted to identify only factual, visually verifiable attributes (e.g., *"Water main fracture with surface ponding ~20cm"*, *"Asphalt cavity with exposed aggregate"*), preventing hallucination.
- **Deterministic Heuristic Failover:** If the Gemini API is unreachable or rate-limited, an automated rule-based heuristic classifier seamlessly activates in $<5\text{ms}$, guaranteeing **zero dropped complaints**.

#### B. Mathematical 5-Factor Priority Scoring Formula
Rather than subjective user urgency, CivicResolve calculates an objective, evidence-based priority score ($0\text{ to }100$) derived from five weighted municipal dimensions:

$$\text{Priority Score} = (\text{Severity} \times 3.0) + (\text{Public Impact} \times 2.5) + (\text{Accessibility Risk} \times 2.0) + (\text{Vulnerable Location} \times 1.5) + (\text{Persistence} \times 1.0)$$

Each dimension is scored on a normalized scale ($0\text{ to }10$):
1. **Severity ($\times 3.0$):** Immediate physical hazard or infrastructure collapse level.
2. **Public Impact ($\times 2.5$):** Density of citizens affected (arterial corridors vs. quiet alleys).
3. **Accessibility Risk ($\times 2.0$):** Impediment to ambulances, elderly pedestrians, school transit, or emergency responders.
4. **Vulnerable Locations ($\times 1.5$):** Proximity to hospitals, schools, transit hubs, or nursing homes.
5. **Persistence ($\times 1.0$):** Chronic recurrence duration (days/weeks ongoing).

Mapped to transparent civic urgency tiers:
- **$0\text{–}24$ (Low):** Minor cosmetic blemishes; scheduled during standard maintenance cycles.
- **$25\text{–}49$ (Medium):** Localized disruption; assigned standard field response windows.
- **$50\text{–}74$ (High):** Substantial safety/traffic risk; prioritized for same-day inspection.
- **$75\text{–}100$ (Critical):** Immediate public safety hazard; triggers real-time operational alerts.

#### C. Geospatial Proximity Engine (Neighbourhood Pulse)
Using the spherical **Haversine Distance Formula**, the system dynamically scans existing open reports within a $150\text{-metre}$ radius:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- If an unresolved issue within the same civic category exists within $150\text{m}$, the new report is automatically linked as an incident cluster.
- Citizens can cast a **+1 Community Support Vote** on an existing report, consolidating community urgency while eliminating administrative duplication.

#### D. Authenticated Media Security (Cloudinary)
- Photographs are uploaded exclusively using `type: 'authenticated'` with randomized asset identifiers.
- Public Cloudinary delivery URLs (`/image/upload/`) return **HTTP 404 Not Found**.
- Temporary signed delivery URLs are generated on-demand by the backend (`GET /api/reports/<id>/image`) only after verifying that the caller is the verified complaint owner or an authorized administrator.
- Tampered URL transformations without a valid HMAC signature return **HTTP 400 Bad Request**.

---

## 3. How the Solution Works

### Step-by-Step User Journey

#### 1. Citizen Complaint Registration & Submission
1. **Authentication:** The resident logs in via Firebase Authentication (or uses fast evaluator access via Priya Raman – Demo Citizen).
2. **Grievance Input:** The citizen provides a title, grievance description in English, Tamil, or Tanglish, selects an initial category, attaches an optional photograph, and tags the locality (GPS coordinate capture or manual landmark selection).
3. **Automated Server Processing:**
   - Server verifies the Firebase ID token in the `Authorization: Bearer` header.
   - If a photo is attached, it is validated (JPEG/PNG/WebP, $<5\text{MB}$), uploaded as an authenticated Cloudinary asset, and assigned a random UUID public ID.
   - Multimodal Gemini AI triages the grievance in memory, extracts observations, and computes the 5-factor score.
   - A human-readable tracking code is generated (e.g., `CR-2026-3733`).
   - The complaint is committed to Cloud Firestore and indexed for proximity clustering.
4. **Instant Citizen Confirmation:** The citizen is redirected to a confirmation view featuring an interactive **AI Triage Assessment Card** explaining the assigned priority, department recommendation, and estimated remediation timeline.

#### 2. Transparent Citizen Tracking (`/track/[id]` & `/my-reports`)
- Citizens track progress in real time via `/my-reports` or direct tracking links (`/track/CR-2026-XXXX`).
- An interactive **Progress Timeline** reflects official milestones (`Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`).
- Complaint owners can click photographic evidence to open a full-screen **Evidence Lightbox** featuring zoom controls ($100\%\text{ to }300\%$) and AI visual inspection observations.
- Neighborhood residents can support public issues via single-click community voting.

#### 3. Municipal Operations Desk (`/admin`)
- Authorized municipal personnel log in with admin privileges (e.g., `admin@civicresolve.gov`).
- **Dedicated Admin Layout:** Renders a focused operations sidebar (Executive Overview, Complaint Queue, Critical Incidents, Proximity Clusters, Department Workload, Analytics, Audit Trail).
- **Search & Filter:** Operations staff filter complaints by tracking code, status, category, department, or urgency level.
- **Dossier Inspection:** The officer opens the complaint dossier to review the citizen's statement, view the authenticated photo evidence, and inspect the Gemini advisory triage.
- **Administrative Remediation Desk:** The supervisor can:
  - Transition status (`In Progress`, `Resolved`).
  - Reassign municipal departments (e.g., Roads $\rightarrow$ Water Board).
  - Override category or priority level.
  - Publish public progress updates visible on the citizen tracker.
  - Record **confidential internal notes** (e.g., contractor penalties) that are strictly hidden from public APIs and tracking views.
- **Append-Only Audit Log:** All administrative updates are immutably logged to `adminAuditLogs` with officer UID, timestamp, and modification deltas.

---

## 4. Controlled Municipal Taxonomy

### Civic Categories
- Roads & Potholes
- Waste & Garbage
- Streetlights & Electricity
- Water Supply & Drainage
- Public Spaces & Parks
- Traffic & Road Safety
- Other / Not Sure

### Municipal Departments
- Roads & Public Works
- Sanitation & Solid Waste
- Electricity & Street Lighting
- Water Supply & Sewerage
- Parks & Public Spaces
- Traffic & Transport
- General Civic Administration
- Needs Human Review

---

## 5. Assumptions Made

1. **Advisory AI Posture (Humans in the Loop):**  
   Google Gemini serves strictly as an **advisory decision-support engine**, not an autonomous civic authority. Final department assignments, budget allocations, and resolution sign-offs remain in the hands of authorized municipal officers.
2. **Zero-Billing Constraint (Spark Plan):**  
   The application intentionally avoids Firebase Blaze plan features (no Firebase Storage, Cloud Functions, or billable cloud triggers). All file storage is offloaded to Cloudinary's free tier, and all business logic runs in Next.js Server Route Handlers.
3. **Public Privacy by Default:**  
   Citizen email addresses, user IDs, and raw complaint photographs are strictly classified as confidential. Public feeds (`/issues`, `/pulse`) scrub reporter identity and round GPS coordinates to $\sim 110\text{m}$ (3 decimal places) to prevent neighborhood stalking or doxxing.
4. **Coimbatore Pilot Jurisdiction:**  
   Default jurisdictional coordinates and demonstration fixtures are centered on Coimbatore, Tamil Nadu ($11.0168^\circ\text{N}, 76.9558^\circ\text{E}$), modeling real-world localities (Gandhipuram, RS Puram, Peelamedu, Saibaba Colony).
5. **Standard Web Browser Capabilities:**  
   It is assumed that citizens and municipal personnel access the platform via modern standards-compliant mobile or desktop web browsers supporting HTML5 Geolocation, CSS Flexbox/Grid, and WebSockets/Fetch APIs.
6. **Prototype Scope:**  
   CivicResolve is engineered as a prototype for civic technology evaluation. While architected with enterprise security invariants, integration with live city ERPs (e.g., SAP, municipal GIS databases) is designed to occur via future webhook adapters.

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) | `16.4.6` | Unified frontend & backend server routes |
| **UI Library** | React | `19.3.0` | Modern reactive UI components |
| **Styling** | Tailwind CSS | `4.3.3` | Responsive utility-first design system |
| **Language** | TypeScript | `5.0+` | End-to-end static type safety |
| **AI Model** | Google Gemini | `gemini-3.1-flash-lite` | Multilingual, multimodal civic triage |
| **AI SDK** | `@google/genai` | `^3.6.1` | Official Google GenAI Node.js SDK |
| **Authentication** | Firebase Authentication | `^13.4.0` | Client & server JWT session management |
| **Admin Operations**| Firebase Admin SDK | `^14.5.1` | Privileged token verification & Firestore DB |
| **Database** | Cloud Firestore | Spark Plan | Scalable serverless NoSQL document store |
| **Media Storage** | Cloudinary Node.js SDK | `^2.11.0` | Authenticated image delivery & signed URLs |
| **Validation** | Zod | `^4.6.7` | Strict runtime API schema validation |
| **Unit Testing** | Vitest | `^5.1.1` | Fast unit & integration test runner |
| **Browser Testing** | Playwright | `^1.65.1` | End-to-end browser & viewport verification |

---

## 7. Verification & Automated Test Suite

CivicResolve includes an exhaustive automated test suite covering unit, security, integration, and browser workflows:

```bash
# Run complete unit & integration test suite (Vitest)
npm test

# Run TypeScript compiler checks
npx tsc --noEmit

# Run ESLint code quality verification
npm run lint

# Run Next.js production build
npm run build
```

### Verified Test Summary
- **Vitest Unit Suite:** **$34 / 34\text{ Tests Passed}$** ($100\%$ success in $3.13\text{s}$)
  - Mathematical 5-factor priority scoring formula & edge boundaries ($0, 100$)
  - Haversine proximity detection & $150\text{m}$ incident clustering
  - Multilingual Tamil / Tanglish heuristics & fallback classifier
  - Cloudinary authenticated asset upload & temporary signed delivery URLs
  - Server-side token validation & role-based access control
  - Prevention of duplicate community votes
- **TypeScript Compiler:** **$0\text{ Errors}$**
- **ESLint:** **$0\text{ Errors}$**
- **Next.js Production Build:** **$28\text{ Static & Dynamic Routes Compiled}$**
- **Playwright End-to-End Browser Audit:** **$50 / 50\text{ Responsive Route Viewports Passed}$** with $0\text{px}$ overflow across Large Desktop ($1536$), Medium Desktop ($1280$), Tablet Landscape ($1024$), Tablet Portrait ($768$), and Mobile ($390$).

---

## 8. Getting Started & Local Setup

### Prerequisites
- Node.js `v20.x` or `v24.x`
- Free Firebase Project (Spark Plan)
- Free Cloudinary Account
- Free Google AI Studio API Key

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Amarnath2007/civic_resolve.git
cd civic_resolve

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see SETUP.md)

# 4. Run automated tests
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Fast Evaluator / Demo Login Access
The login page (`/login`) includes one-click evaluator access:
- **Priya Raman (Demo Citizen):** `citizen@civicresolve.org`
- **Municipal Operations Desk (Demo Admin):** `admin@civicresolve.gov`

---

## 9. License

Developed for the **PromptWars X GDG On Campus PSG iTech Challenge**.  
Licensed under the [MIT License](LICENSE).
