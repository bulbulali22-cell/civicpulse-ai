<div align="center">

# 🏙️ CivicPulse AI

### AI-powered Civic Complaint Intelligence & Monitoring Platform

*Smarter civic systems. Stronger communities.*

![React](https://img.shields.io/badge/React-Vite_SPA-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Typed-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

[**Live Demo**](#) · [**Report a Bug**](https://github.com/bulbulali22-cell/civicpulse-ai/issues) · [**Request a Feature**](https://github.com/bulbulali22-cell/civicpulse-ai/issues)

</div>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [How the AI Analysis Works](#-how-the-ai-analysis-works)
- [Roadmap](#-roadmap)
- [Market Positioning](#-market-positioning)
- [Sustainable Development Goals](#-sustainable-development-goals)
- [Team](#-team)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 About the Project

**CivicPulse AI** connects citizens with local authorities to report, track, and resolve civic issues efficiently. A citizen uploads a photo of a problem (a pothole, overflowing garbage, a broken streetlight), the app captures the GPS location, and **Google Gemini** analyses the image to identify the issue category, assign a **severity score (1-10)**, and generate a title and description.

Every complaint is stored with a reference ID (like `CP-1001`) and appears on a **public issue map with severity markers and a heatmap**. Officials get an **admin console** with stats and a priority queue to assign complaints and update their status, while citizens can follow progress on a **status timeline**.

> Built by **Team God's Favourite** with Mathura, Uttar Pradesh as the pilot context.

---

## 🚨 The Problem

India already has large-scale grievance systems, but monitoring them is still hard.

| Figure | Metric | Source |
|---|---|---|
| **2.39 Cr** | Civic complaints registered | Swachhata App |
| **2.24 Cr** | Complaints resolved | Swachhata App |
| **93.72%+** | Reported resolution rate | Government programme data |
| **3,454** | ULBs with ≥90% SWM grievance resolution | Swachh Survekshan 2024-25 |

> ⚠️ *These are national-level figures, not Mathura-specific. Swachhata figures are cumulative programme statistics, not annual complaint totals.*

**The gap:** Mathura district provides access to the **UP IGRS** public grievance system for complaint registration and tracking, but there is room to strengthen civic monitoring through **image-based reporting, structured issue assessment, and location-based visualisation**. That is where CivicPulse AI fits in.

---

## 💡 Our Solution

From citizen report to real-time civic visibility, in four steps:

| Step | Stage | What happens |
|:---:|---|---|
| **01** | **Report** | Upload an image of the civic issue → capture GPS location → submit the complaint |
| **02** | **Analyse** | Gemini identifies the issue → extracts structured metadata → generates an issue score |
| **03** | **Synchronise** | Complaint is stored in PostgreSQL → updates sync through Supabase Realtime |
| **04** | **Visualise** | Complaint locations are mapped → geographic hotspots are highlighted |

---

## ✨ Key Features

### 👥 For Citizens
- 📸 **Image-based reporting**: upload a photo of the issue from the Citizen Portal
- 📍 **GPS-enabled submissions** with reverse geocoding (lat/lng → readable address) via Nominatim
- 🤖 **AI diagnostic panel**: see the detected category, severity, and generated title before submitting
- ⚠️ **Duplicate warning**: a database check (`find_nearby_duplicates()`) flags similar complaints nearby
- 🔎 **Track Complaint**: look up status by reference ID (e.g. `CP-1001`) and view a status timeline
- 🗺️ **Public Issue Map**: Leaflet map with severity markers and a heatmap layer

### 🏛️ For Authorities
- 🗂️ **Centralised complaint records** in PostgreSQL
- 📊 **Admin Console**: stats, priority queue, assign complaints, update status
- 🎯 **Issue-score visibility** to triage the most severe problems first
- 🌡️ **Geographic hotspot monitoring**
- ⏱️ **Department SLA hours** stored per department

### ⚙️ Under the Hood
- 🔐 Email + password authentication with JWT (Supabase Auth)
- 🛡️ **Row Level Security (RLS)**: the browser uses only the publishable `anon` key, and all reads/writes go through `supabase-js` under RLS
- 🕒 **Database triggers** automatically append a timeline row whenever a complaint's status changes
- 🔑 **The Gemini API key never reaches the browser**: analysis runs in a Vercel serverless function

---

## 📸 Screenshots

> 📌 *Add your screenshots to a `docs/screenshots` folder and update the paths below.*

| Citizen Portal | Public Issue Map |
|:---:|:---:|
| ![Citizen Portal](docs/screenshots/citizen-portal.png) | ![Issue Map](docs/screenshots/issue-map.png) |

| Track Complaint | Admin Console |
|:---:|:---:|
| ![Track Complaint](docs/screenshots/track.png) | ![Admin Console](docs/screenshots/admin.png) |

---

## 🏗️ System Architecture

![CivicPulse System Architecture](docs/CivicPulse_Architecture.png)

**Runtime flow: what happens when a complaint is filed, tracked and resolved**

| # | Step |
|:---:|---|
| **1** | The citizen submits a photo + GPS location through the **Citizen Portal** |
| **2** | The browser sends image + text to **`POST /api/analyze`** (Vercel serverless function, Node.js). It validates the input, holds `GEMINI_API_KEY`, calls the **Gemini API**, and returns `category · severity · title` as JSON |
| **3** | A **duplicate check** runs via `rpc()` on Supabase, then the complaint is **INSERT**ed through the PostgREST API (RLS enforced) |
| **4** | The photo is saved to **Supabase Storage** (bucket: `complaint-images`) |
| **5** | A database **trigger appends a timeline row** to `complaint_updates` |
| **6** | The **admin/official** updates the status from the Admin Console |

**Client modules (React + Vite SPA):** Citizen Portal · Public Issue Map · Track Complaint · Admin Console, all talking to the backend through a single `supabase-js` client.

**External services:** Gemini API (image + text analysis) · Nominatim (reverse geocoding) · OpenStreetMap (base-map tiles).

**Database (PostgreSQL):**

| Table / Object | Purpose |
|---|---|
| `complaints` | `ref_id`, `status`, `lat`/`lng`, `severity` |
| `complaint_updates` | Timeline rows for each status change |
| `departments` | Department info including SLA hours |
| `find_nearby_duplicates()` | Duplicate-detection function |
| status triggers | Auto-append timeline entries |
| `complaint_stats` | View powering admin stats |

---

## 🧰 Tech Stack

![CivicPulse Technology Stack](docs/CivicPulse_TechStack.png)

| Layer | Technologies |
|---|---|
| **01 · Presentation** (UI + maps) | HTML · CSS · JS, React + Vite (component SPA), TypeScript, Tailwind CSS, Leaflet.js (interactive map + heatmap), OpenStreetMap (free base-map tiles) |
| **02 · Client & API** (access layer) | Environment config (`VITE_SUPABASE_URL`, publishable key only), `supabase-js` (queries · rpc() · auth · storage upload), Vercel Function `/api/analyze` (keeps Gemini key private) |
| **03 · Backend** (Supabase BaaS) | Auth (email login · JWT), PostgreSQL (complaints · updates · departments), Storage (`complaint-images`), RLS + SQL (duplicate check · status triggers) |
| **04 · AI** (Google Gemini) | Output schema (category · severity 1-10 · title · description) → Prompt template (photo + text + allowed categories) → Gemini API |

### 🔄 Development & Deployment Pipeline

```
VS Code  →  Git  →  GitHub  →  Vercel  →  Production
(source)   (commits)  (team collab)  (CI/CD · vite build · env vars)  (live site · CDN + functions)
```

Every `git push` to GitHub triggers a Vercel webhook, which builds the Vite app, deploys the SPA and the serverless function, and releases to production.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or newer
- **npm** (comes with Node)
- A free **[Supabase](https://supabase.com)** project
- A **[Google Gemini API key](https://aistudio.google.com/app/apikey)**
- *(Optional)* **[Vercel CLI](https://vercel.com/docs/cli)** to run the serverless function locally

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bulbulali22-cell/civicpulse-ai.git
cd civicpulse-ai

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# then fill in the values (see the next section)

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

> 💡 The `/api/analyze` function runs on Vercel. To test AI analysis locally, use `vercel dev` instead of `npm run dev`.

### Supabase Setup

1. Create a new Supabase project.
2. Create a **Storage bucket** named `complaint-images`.
3. Create the tables: `complaints`, `complaint_updates`, `departments`.
4. Add the database logic: `find_nearby_duplicates()`, the status triggers, and the `complaint_stats` view.
5. Enable **Row Level Security** and add policies for citizens and admins.
6. Create an admin user in **Auth** (email + password) for the Admin Console.

> 📌 *Tip: export your SQL schema to `/supabase/schema.sql` so teammates and judges can recreate the database in one step.*

### Build for Production

```bash
npm run build     # outputs to /dist
npm run preview   # preview the production build locally
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Client (safe to expose: publishable/anon key only)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key

# Server only (set in Vercel → Project Settings → Environment Variables)
GEMINI_API_KEY=your-gemini-api-key
```

> ⚠️ **Never commit `.env` or any secret key.** `GEMINI_API_KEY` must only live on the server (Vercel). It is never sent to the browser.

---

## 📂 Project Structure

> 📌 *Adjust this to match your actual folders.*

```
civicpulse-ai/
├── api/                  # Vercel serverless function (POST /api/analyze)
├── public/               # Static assets
├── src/                  # React + TypeScript source
│   ├── components/       # Reusable UI components
│   ├── pages/            # Citizen Portal, Public Map, Track, Admin Console
│   └── lib/              # Supabase client, helpers
├── docs/                 # Diagrams & screenshots
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

## 🤖 How the AI Analysis Works

The serverless function receives the photo and the citizen's text, builds a **prompt template** (photo + text + allowed categories), sends it to Gemini, and returns a fixed **output schema**:

```json
{
  "category": "Garbage / Sanitation",
  "severity": 7,
  "title": "Overflowing garbage bin near market road",
  "description": "A large pile of uncollected waste is blocking part of the roadside..."
}
```

| Field | Description |
|---|---|
| `category` | One of the allowed civic issue categories |
| `severity` | Integer **1-10**, used for map markers and the admin priority queue |
| `title` | Short, auto-generated complaint title |
| `description` | Structured description of what the image shows |

> 🔒 The citizen sees the AI diagnostic panel before submitting, and authorities make the final decision on action.

---

## 🗺️ Roadmap

- [x] Image-based reporting with GPS capture and reverse geocoding
- [x] Gemini-powered issue analysis and severity scoring
- [x] Duplicate complaint warning (`find_nearby_duplicates()`)
- [x] Public issue map with severity markers and heatmap
- [x] Complaint tracking by reference ID with status timeline
- [x] Admin console with stats, priority queue, assignment and status updates
- [ ] Multilingual voice reporting
- [ ] Automated department-wise assignment
- [ ] Predictive civic analytics
- [ ] Integration pathways with existing channels (Swachhata, UP IGRS)

> 📌 *Tick or untick items so this reflects what is actually built right now.*

---

## 📊 Market Positioning

CivicPulse AI is designed to **complement existing grievance channels**, not replace them.

| | Swachhata-MoHUA | UP Jansunwai / IGRS | **CivicPulse AI** |
|---|:---:|:---:|:---:|
| Photo + geolocation reporting | ✅ | ❌ | ✅ |
| Municipal / department complaint routing | ✅ | ✅ | 🔜 |
| Status updates and tracking | ✅ | ✅ | ✅ |
| **AI-extracted issue metadata** | ❌ | ❌ | ✅ |
| **Issue scoring** | ❌ | ❌ | ✅ |
| **Real-time complaint database sync** | ❌ | ❌ | ✅ |
| **Geospatial map and hotspots** | ❌ | ❌ | ✅ |

> *n/a: not a headline capability in how these platforms are described in our research; this is not a claim that the feature is absent.*

---

## 🌍 Sustainable Development Goals

| SDG | Contribution |
|---|---|
| **SDG 11**: Sustainable Cities & Communities | Better civic issue visibility, citizen participation, improved urban monitoring |
| **SDG 9**: Industry, Innovation & Infrastructure | Digital civic infrastructure, AI-assisted issue analysis, technology-driven governance |

---

## 👨‍💻 Team

**Team God's Favourite**

| Name | GitHub |
|---|---|
| Teeya Saraswat | [@username](https://github.com/) |
| Bulbul Ali | [@bulbulali22-cell](https://github.com/bulbulali22-cell) |
| Ariktha Upmanyu | [@arikthaupmanyu](https://github.com/arikthaupmanyu) |
| Mahi Garg | [@username](https://github.com/) |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com), [Google Gemini](https://ai.google.dev), [Leaflet](https://leafletjs.com), [OpenStreetMap](https://www.openstreetmap.org), [Nominatim](https://nominatim.org), [Vercel](https://vercel.com)
- Swachhata-MoHUA and the UP IGRS / Jansunwai portal, for the context that inspired this project

<div align="center">

**Smarter civic systems. Stronger communities.** 🏙️

⭐ If you like this project, give it a star!

</div>



