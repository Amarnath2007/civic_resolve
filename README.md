# CivicResolve

### AI-Powered Citizen Grievance Management and Resolution Platform
**PromptWars X GDG On Campus PSG iTech Challenge Submission**

CivicResolve is a modern, end-to-end civic technology platform designed to streamline municipal complaint reporting, automate grievance triage with Google Gemini AI, and empower communities through neighborhood-level issue clustering.

> **Zero-Billing Architecture:** Fully compatible with the **Firebase Spark (Free) plan** without upgrading to Blaze. Cloud Firestore and Firebase Auth manage complaints and identity, while the free tier of **Cloudinary** securely stores photographic evidence using authenticated asset delivery.

---

## 1. Problem Statement

Every day, citizens encounter infrastructure breakdowns—potholes, overflowing garbage dumps, defunct streetlights, bursting water pipes, and broken public amenities. Despite living in connected cities:

- **Unclear Department Routing:** Citizens rarely know whether an issue belongs to Public Works, Sanitation, Electricity, or Water boards.
- **Arbitrary Urgency:** Complaints are submitted without evidence-based severity scoring, leading to critical hazards being lost in bureaucratic backlogs.
- **Duplicate Complaints:** Multiple residents report the exact same broken streetlamp or road depression independently, wasting administrative resources.
- **Lack of Transparency:** Citizens feel disconnected from the progress of their complaints and receive no status updates.

---

## 2. Proposed Solution

CivicResolve bridges the divide between citizens and municipal operations through three technological pillars:

1. **Intelligent Civic Triage:** Multimodal Google Gemini AI analyzes descriptions in English, Tamil (தமிழ்), or mixed Tanglish, inspects uploaded photographs, categorizes the issue into a controlled municipal taxonomy, and routes it to the responsible department.
2. **Evidence-Based Priority Assessment:** A transparent 5-factor scoring formula (0–100) evaluates Severity, Public Impact, Accessibility Risk, Vulnerable Location Impact, and Persistence, flagging critical hazards for immediate human review.
3. **Neighbourhood Pulse:** Uses geospatial proximity algorithms (150-metre radius) to detect recurring complaints, cluster related infrastructure issues, and allow citizens to support existing complaints instead of filing duplicates.

---

## 3. Target Users

- **Citizens & Residents:** Easy-to-use, mobile-friendly interface to report neighborhood issues in natural language (English/Tamil) with photos and GPS, track resolution milestones, and support community concerns.
- **Municipal Administrators & Field Supervisors:** A data-driven operations desk to view triaged complaints, inspect AI assessments, override categories or departments, manage status transitions, and publish official field updates.
- **Community Leaders & Ward Councilors:** High-level visibility into recurring problem clusters across localities like Gandhipuram, RS Puram, and Peelamedu.

---

## 4. Key Differentiators

| Capability | CivicResolve | Traditional Portals |
|---|---|---|
| **Language Understanding** | Full English, Tamil, and Tanglish comprehension via Gemini | English-only rigid forms |
| **Urgency Grading** | Mathematical 5-factor weighted score (0–100) with justification | Arbitrary citizen self-rating |
| **Department Routing** | Automated AI recommendation to controlled taxonomy | Manual citizen guessing |
| **Community Clustering** | 150m Haversine proximity detection for recurring problems | Siloed, duplicate complaints |
| **Secure Media Storage** | Authenticated Cloudinary delivery; signed temporary URLs | Unrestricted public asset URLs |
| **AI Transparency** | Advisory decision support; humans retain final authority | Black-box or non-existent AI |
| **Privacy Safeguards** | Zero personal data leakage on public feeds; coordinate rounding | Full reporter info often exposed |

---

## 5. How Google Gemini AI Is Used

CivicResolve integrates the official **`@google/genai`** SDK on the server:

- **Interactions API & Multimodal Input:** Ingests the citizen's title, description, location context, and in-memory base64 photographic evidence.
- **In-Memory Visual Processing:** Gemini receives image bytes directly in memory on the server—private image URLs are never made publicly accessible to allow analysis.
- **Multilingual Tamil & Tanglish Processing:** Understands vernacular complaints such as *"Road romba damaged ah iruku, street light velicham illa"* and produces a concise, standardized English executive summary for administrators while preserving the original statement.
- **Structured JSON Output:** Validated with **Zod** schema against a strictly controlled municipal taxonomy.
- **Objective Photographic Observation:** Identifies only reasonably visible factual elements (e.g. *"Asphalt cavity ~15cm deep", "Overflowing green dumper bin"*), preventing hallucinated claims.
- **Deterministic Fallback Triage:** If Gemini API credentials are not yet configured or network is interrupted, a rule-based heuristic classifier automatically activates to ensure **zero lost complaints**.

---

## 6. Evidence-Based Priority Formula

Priority is calculated mathematically across 5 weighted factors (each scored 0–10):

$$\text{Priority Score} = (\text{Severity} \times 3.0) + (\text{Public Impact} \times 2.5) + (\text{Accessibility Risk} \times 2.0) + (\text{Vulnerable Locations} \times 1.5) + (\text{Persistence} \times 1.0)$$

Mapped to transparent civic urgency tiers:
- **0–24 (Low):** Routine aesthetic or minor maintenance.
- **25–49 (Medium):** Standard localized repair with moderate disruption.
- **50–74 (High):** High-traffic or health hazard requiring priority scheduling.
- **75–100 (Critical):** Immediate public safety hazard flagged for urgent human review.

---

## 7. Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend:** Next.js Server Route Handlers, Zod schema validation.
- **Database & Auth:** Cloud Firestore & Firebase Authentication (Free Spark Plan), Firebase Admin SDK.
- **Media & Evidence Storage:** Cloudinary (Free Tier) with authenticated delivery and signed temporary URLs.
- **Resilience Layer:** In-memory fallback datastore pre-seeded with realistic Coimbatore data for instant offline evaluation.
- **AI Engine:** Google Gemini (`gemini-3.8-flash`) via `@google/genai` SDK.
- **Testing:** Vitest with 100% passing test coverage across 33 test cases.
- **Deployment:** Vercel-ready production runtime.

---

## 8. System Architecture

```
[ Citizen (Web / Mobile) ]
           │
           ▼
[ Next.js App Router (Client) ] ── (Firebase ID Token) ──┐
           │                                             │
           ▼                                             ▼
[ Protected Server Route Handlers ] <──> [ Firebase Admin SDK (Auth & Allowlist) ]
           │
           ├─► [ Google Gemini 3.8 Flash (Multimodal & Multilingual Triage in memory) ]
           │        │
           │        ▼ (Structured JSON & 5-Factor Scoring)
           │
           ├─► [ Cloudinary Secure Upload (type: 'authenticated') ]
           │        │
           │        ▼ (Metadata: publicId, assetId, format, timestamp)
           │
           ├─► [ Haversine Proximity Engine (150m Radius Clustering) ]
           │
           └─► [ Cloud Firestore / Unified Data Store ]
                    ├── reports (Full internal records with Cloudinary metadata & audit logs)
                    ├── publicReports (Privacy-safe community feed without photos)
                    └── reports/{id}/updates (Timeline milestones)
```

---

## 9. Complaint Lifecycle

1. **Submission:** Citizen inputs title, multilingual description, optional photo, and GPS/landmark location.
2. **AI Triage:** Gemini analyzes input in memory, recommends category & department, computes 5-factor priority score, and generates an official tracking ID (e.g. `CR-2026-8491`).
3. **Secure Photo Storage:** If attached, the photograph is uploaded to Cloudinary as an authenticated asset (`type: 'authenticated'`). Metadata is saved in Firestore; binary data is never stored in the database.
4. **Clustering:** System checks for unresolved reports of the same category within 150m for Neighbourhood Pulse.
5. **Administrative Review:** Officer inspects AI advisory recommendations in the Command Center (`/admin`), views the authorized evidence via a temporary signed delivery URL, modifies department or priority if needed, and updates status.
6. **Field Action & Tracking:** Status transitions (`Reported` ➔ `Under Review` ➔ `In Progress` ➔ `Resolved`) publish timestamped progress notes to the public timeline.
7. **Resolution:** Field unit finishes repair; administrator closes complaint with confirmation.

---

## 10. Database Schema

### `reports`
- `id`: string
- `trackingCode`: string (`CR-YYYY-XXXX`)
- `reporterUid`: string
- `reporterEmail`: string (confidential)
- `title`, `description`, `detectedLanguage`: string
- `citizenSelectedCategory`, `finalCategory`: CivicCategory
- `aiSuggestedDepartment`, `finalDepartment`: CivicDepartment
- `aiPriorityScore`: number (0–100)
- `finalPriority`: 'Low' | 'Medium' | 'High' | 'Critical'
- `aiConfidence`: number (0.0–1.0)
- `aiSummary`, `aiReason`, `recommendedAction`: string
- `scoreBreakdown`: `{ severity, publicImpact, accessibilityRisk, vulnerableLocationImpact, persistence }`
- `imageObservations`: string[]
- `imageMetadata`: `{ publicId, assetId, resourceType, format, uploadedAt, bytes }`
- `imageUrl`: undefined (only generated as a temporary signed URL upon authorized request)
- `location`: `{ locality, streetOrLandmark, latitude, longitude, jurisdiction }`
- `status`: 'Reported' | 'Under Review' | 'In Progress' | 'Resolved'
- `sharePublicly`: boolean
- `supportCount`: number
- `supportedByUids`: string[]
- `relatedReportIds`: string[]
- `triageMethod`: 'gemini' | 'fallback'
- `adminNotes`: string[] (internal staff log)
- `createdAt`, `updatedAt`, `resolvedAt`: ISO timestamp

### `publicReports`
Privacy-safe replica: strips `reporterUid`, `reporterEmail`, `adminNotes`, original complaint photos (`imageUrl` omitted), and rounds coordinates to ~110m resolution (3 decimals) to protect resident privacy.

---

## 11. Controlled Taxonomy

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

## 12. Verification & Automated Test Suite

CivicResolve includes an automated test suite powered by Vitest covering:
- Mathematical 5-factor priority scoring & boundary conditions
- Haversine distance & 150m proximity cluster detection
- Multilingual keyword heuristics (Tamil / Tanglish) & fallback classifier
- Gemini structured JSON schema validation with Zod
- Cloudinary mime type validation, 5MB threshold, authenticated upload, and signed URL generation
- Authenticated photograph upload enforcement (rejects unauthenticated upload with 401)
- Text-only complaint reporting preservation
- Image access restriction (only owner and admin receive signed URLs)
- Privacy sanitization of public reports
- Prevention of duplicate community support votes
- Administrative authorization & status transition enforcement

Run tests with:
```bash
npm test
```
Result: **6 test files, 33 tests passed (100% success)**.

---

## 13. Getting Started

Refer to [SETUP.md](./SETUP.md) for detailed step-by-step configuration of Firebase (Spark Plan), Cloudinary (Free Tier), and Google AI Studio credentials.

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run test suite
npm test

# 3. Start local server
npm run dev

# 4. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

---

## 14. Assumptions and Limitations

- **Advisory AI Role:** Google Gemini provides advisory decision support. It is not presented as an official government authority, and human municipal administrators maintain final decision-making control over all routing and remediation.
- **Prototype Status:** CivicResolve is a civic technology prototype engineered for the PromptWars X GDG On Campus Challenge and is not connected to a live municipal ERP or dispatch system.
- **Public Privacy Safeguards:** Citizen identities and original photographs are protected by default; public community sharing requires explicit opt-in and scrubs reporter metadata and photos.

---

## 15. Future Roadmap

1. **Citizen SMS / WhatsApp Alerts:** Automated notification delivery via Twilio / WhatsApp Business API when complaint status changes.
2. **Offline-First Progressive Web App (PWA):** Enable complaint caching and offline photo capture for rural and bandwidth-constrained regions.
3. **Automated Before/After Remediation Verification:** Use Gemini Vision to compare the initial report photo with the field crew's completed repair photo before closing the ticket.
