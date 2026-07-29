<div align="center">

# 🗺️ GitCharta

**Every follower, stargazer, fork, and PR is a country you've reached. GitCharta turns your GitHub footprint into a map of exactly how far your work travels.**

An interactive world map that visualizes the geographic reach of your GitHub network : who's actually there, who's just noise, and who might be the first person from their country to show up on your map.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://gitcharta.vercel.app/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#-roadmap)
[![Status](https://img.shields.io/badge/status-active--development-success.svg)](#-roadmap)
[![Token](https://img.shields.io/badge/PAT-optional-blue.svg)](#-prerequisites)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](#-license)

**🔗 [Try it live](https://gitcharta.vercel.app/) : no token required to start, bring your own PAT any time to skip the shared demo limit.**

[Live Demo](https://gitcharta.vercel.app/) • [The Idea](#-the-idea) • [Categories](#-the-four-categories) • [Security](#-security--privacy) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Architecture](#-how-it-works) • [Get in Touch](#-get-in-touch)

</div>

<br>

<p align="center">
  <img src="./public/presentation-map.png" alt="GitCharta : interactive world map preview" width="1000">
</p>

---

## 📖 Table of Contents

- [The Idea](#-the-idea)
- [The Four Categories](#-the-four-categories)
- [Security & Privacy](#-security--privacy)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Get in Touch](#-get-in-touch)

---

## 💡 The Idea

A follower count is just a number. GitCharta asks a different question: **how many places on Earth has your work actually reached?**

Point it at any GitHub account and every follower, every account you follow, every star, fork, or PR stops being a row in a list and becomes a pin on a map. Somewhere in that list, someone might be the very first person from their country to show up on your profile : and a raw count will never tell you that.

Today, GitCharta maps your **followers** and **following**. Stars, forks, and PRs are next (see the [Roadmap](#-roadmap)) so your whole footprint, not just your social graph, counts toward your reach.

---

## 🧭 The Four Categories

Not every connection is equal, and not every connection is even real. GitCharta sorts every account into one of four buckets:

| Category           | Icon | What it means                                                                                                                              |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Follower**       | 👥   | Someone who follows you : part of your confirmed audience.                                                                                 |
| **Following**      | 🔭   | Someone you follow : the people and projects you learn from.                                                                               |
| **Non-reciprocal** | ↗️   | You follow them, they don't follow you back. Still a real account, just a one-way relationship.                                            |
| **Possible spam**  | 👻   | Accounts that look automated or inactive : no bio, no avatar, no repos, lopsided follow ratios. These don't get counted toward your reach. |

Splitting "one-way follow" from "likely-not-a-real-person" was the single most requested change from early users, and it's the whole reason for this rebrand : a non-reciprocal follow from a real developer is a lead worth knowing about, a spam account is just noise skewing your numbers.

> **How "possible spam" is flagged:** GitCharta uses simple public-profile heuristics (empty bio, no avatar, zero public repos, extreme following-to-follower ratios) to flag likely bots or throwaway accounts. It's a heuristic, not a verdict : you can always inspect any flagged account yourself.

---

## 🔒 Security & Privacy

> **TLDR:** Bring your own token and it never leaves your browser : no backend involved, full stop. Skip the token and you're using a shared, rate-limited demo token relayed through GitCharta's backend instead, since you haven't given us anything to protect in the first place.

Pasting a token into a random website is normally bad advice, so here's exactly how each mode works, and how to check it yourself instead of taking our word for it.

### If you bring your own PAT

| Claim                   | What it means                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No backend involved** | Requests go straight from your browser to `api.github.com` and `api.github.com/graphql`. GitCharta's backend is never called on this path.                         |
| **In-memory only**      | Your PAT lives in JavaScript state for the current session : **not** persisted to `localStorage`, `sessionStorage`, or cookies. Discarded on refresh or tab close. |
| **Open source**         | Don't take this README's word for it : read the code, or fork it and run it locally.                                                                               |

### If you don't (demo mode)

| Claim                          | What it means                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No token needed**            | You can generate a map with just a GitHub username.                                                                                                |
| **Shared token, server-side**  | Your request is relayed through GitCharta's backend, which attaches one server-held token shared by every demo user. Expect throttling under load. |
| **Nothing personal to expose** | You haven't handed us any credentials in this mode, so there's no PAT of yours for the backend to leak.                                            |

You can switch modes at any point : paste a PAT mid-session and GitCharta drops the backend entirely for the rest of that session.

**Verify it yourself before pasting in any token:**

1. Open your browser's DevTools → **Network** tab.
2. Paste in a token (ideally a throwaway, `read:user`-scoped one) and generate a map.
3. Confirm every outgoing request with your token attached goes to `api.github.com` / `api.github.com/graphql`, and only there. Requests to GitCharta's own backend should disappear entirely once a PAT is present.

> **Best practice still applies.** Use a token scoped to just `read:user`, and revoke it afterward if you're only trying the tool out. This section describes how the app itself is built : it doesn't replace treating any PAT like a password.

---

## ✨ Key Features

> Actively evolving : see the [Roadmap](#-roadmap) for what's next.

| Category              | Description                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| 🌍 **World map**      | Every account plotted by country, so you see where you've actually reached : not just a number           |
| 👥 **Followers**      | Geographic distribution of the people who follow your work                                               |
| 🔭 **Following**      | Where the people and projects you learn from are based                                                   |
| ↗️ **Non-reciprocal** | Accounts you follow that don't follow back : real connections, one-way                                   |
| 👻 **Possible spam**  | Likely bot or inactive accounts, flagged and set aside so they don't inflate your reach                  |
| 📍 **Unlocated**      | A dedicated view for accounts without a usable public location, so nobody just vanishes from the picture |
| 📊 **Statistics**     | At-a-glance numbers: countries reached, category breakdown, top countries, and more                      |

---

## 🛠️ Tech Stack

> **Note:** The fields below are placeholders : replace them with your project's actual stack so contributors know what they're working with before they clone the repo.

| Layer                      | Technology                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                   | `React, Vite, TypeScript`                                                                                                                                        |
| Mapping / Visualization    | `Custom Geocoding & D3`                                                                                                                                          |
| Data Source                | [GitHub GraphQL API](https://docs.github.com/en/graphql) (primary) + [GitHub REST API](https://docs.github.com/en/rest) (fallback for fields GraphQL leaves out) |
| Backend (demo-token proxy) | `TBD` : a small serverless function that holds the shared token server-side only                                                                                 |
| Hosting / Deployment       | `Vercel` : static frontend, plus a serverless function for the demo-token backend                                                                                |
| Package Manager            | `npm`                                                                                                                                                            |

---

## ✅ Prerequisites

Nothing, to start. GitCharta ships with a shared demo token, so pointing it at a GitHub username works with zero setup on your end : it's just rate-limited across every demo user.

Optional, if you want higher limits or to skip the backend entirely:

- A **GitHub Personal Access Token (PAT)** : see below.

### Generating a Personal Access Token (optional)

1. Go to **GitHub → Settings → Developer settings → Personal access tokens**.
2. Generate a new token with the following scope:

   | Scope       | Why it's needed                               |
   | ----------- | --------------------------------------------- |
   | `read:user` | Read your profile and follower/following data |

> **🔒 Security Note**
> Treat your PAT like a password regardless of where you paste it. See [Security & Privacy](#-security--privacy) for exactly how this app handles your token (spoiler: with your own PAT, it never leaves your browser or touches our backend).

> **📌 Looking ahead:** the planned "Direct Unfollow" feature (see [Roadmap](#-roadmap)) will require the additional `user:follow` scope. You don't need it today.

---

## 🚀 Quick Start

### Option A : Use the Live App (fastest)

No install, no token required. Open **[gitcharta.vercel.app](https://gitcharta.vercel.app/)**, enter a username, and go straight to [Usage](#-usage). Add your own PAT any time to skip the shared demo limit : see [Security & Privacy](#-security--privacy) for exactly how that changes what leaves your browser.

### Option B : Run It Locally

```bash
# 1. Clone the repository
git clone https://github.com/ThierryRakotomanana/github-audience-atlas.git
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Start the app
npm run dev
```

Running it this way puts you in BYO-PAT mode by default : since there's no shared token configured locally, you'll paste your own in the UI. To also exercise the demo/shared-token flow locally, set `DEMO_GITHUB_TOKEN` below.

### Environment Variables

| Variable            | Used by      | Required                                                   | Description                                                                                                                          |
| ------------------- | ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DEMO_GITHUB_TOKEN` | Backend only | Only if you want to run the shared demo-token flow locally | A token the backend uses to serve requests from visitors who haven't supplied their own PAT. Never bundled or exposed to the client. |

```bash
# .env.example
DEMO_GITHUB_TOKEN=your_shared_token_here
```

> ⚠️ Add `.env` to your `.gitignore` : never commit real tokens, shared or personal.
> Your own PAT is entered in the UI at runtime and is never read from `.env` : keeping it out of any file that could end up committed is the whole point.

---

## 💻 Usage

1. **Launch** the app : open the [live version](https://gitcharta.vercel.app/), or run it locally with `npm run dev`.
2. **Enter** the GitHub username you want to map.
3. _(Optional)_ **Paste** your own Personal Access Token to skip the shared demo limit.
4. Click **Generate Map** and explore your reach on the interactive globe, broken down into followers, following, non-reciprocal, and possible spam.

---

## 🧩 How It Works

At a high level, the app follows this pipeline:

```mermaid
flowchart LR
    A[Username + optional PAT] --> B{PAT provided?}
    B -->|Yes| C[Browser calls GitHub API directly]
    B -->|No| D[Browser calls GitCharta backend]
    D --> E[Backend attaches shared token]
    C --> F[GraphQL : bulk fetch followers / following]
    E --> F
    F --> G{Fields missing?}
    G -->|Yes| H[REST fallback fills the gaps]
    G -->|No| I[Categorize: Follower / Following / Non-reciprocal / Possible spam]
    H --> I
    I --> J[Resolve location per profile]
    J --> K[Render map + stats]
```

1. **Input** : You provide a GitHub username to map, and optionally your own PAT.
2. **Route** : With a PAT, your browser talks to GitHub directly. Without one, the request goes through GitCharta's backend, which attaches a shared, rate-limited token : your own credentials are never part of this path, since you didn't provide any.
3. **Fetch** : The GitHub GraphQL API is queried first, since it can pull followers, following, and profile fields in far fewer round trips than REST. Anything GraphQL leaves out is recovered with targeted REST calls.
4. **Categorize** : Accounts are cross-referenced and heuristically screened to sort them into followers, following, non-reciprocal, and possible spam.
5. **Resolve** : Each account's public location field is used to place it on the map; accounts without one land in the dedicated unlocated view instead of disappearing.
6. **Render** : Results are plotted on an interactive, explorable world map, alongside the statistics panel.

---

## 🗺️ Roadmap

Planned for upcoming releases:

| Status | Feature                   | Description                                                              | Notes                            |
| ------ | ------------------------- | ------------------------------------------------------------------------ | -------------------------------- |
| ⬜     | **Stargazer maps**        | Map the people starring your repos : reach beyond your social graph      |                                  |
| ⬜     | **Fork maps**             | See where the people forking your projects are based                     |                                  |
| ⬜     | **Contributor / PR maps** | Plot everyone who's opened a PR against your repos or org                |                                  |
| ⬜     | **Map screenshots**       | Export your map as an image to share or drop into a README               |                                  |
| ⬜     | **Zoom & pan**            | Get in close on any region instead of squinting at the whole world       |                                  |
| ⬜     | **GitHub profile badge**  | Embed a live badge of your map straight into your GitHub profile README  |                                  |
| ⬜     | **Coverage badge**        | A badge showing what percentage of the world your reach covers           |                                  |
| ⬜     | **Direct Unfollow**       | Unfollow non-reciprocal or spam accounts straight from the map interface | Requires `user:follow` PAT scope |
| ⬜     | **Advanced Color Modes**  | Heatmap, radar view, and a "Contribution Green" theme                    |                                  |
| ⬜     | **UI/UX Overhaul**        | Ongoing improvements to interface and user flow                          |                                  |

Have an idea? [Open an issue](../../issues) to suggest a feature.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. **Fork** the repository.
2. **Create a branch** for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit with a clear message:
   ```bash
   git commit -m "feat: add heatmap rendering mode"
   ```
4. **Push** and open a **Pull Request** describing what you changed and why.

> **Good first issues** are a great place to start : check the [Issues tab](../../issues) for anything labeled `good first issue` or pick an unchecked item from the [Roadmap](#-roadmap).

---

## 📄 License

> Distributed under the **MIT License**. See `LICENSE` for details.

---

## 👤 Get in Touch

Hey, I'm **Thierry Rakotomanana** : I built and maintain GitCharta. I'm actively looking to grow my own network with people building interesting things, so if this project is useful to you, resonates with you, or you just want to talk shop, don't be a stranger.

- 💬 Open an [issue](../../issues) or [pull request](#-contributing) : the fastest way to reach me about the project itself
- 🐙 Follow or connect on [GitHub @ThierryRakotomanana](https://github.com/ThierryRakotomanana)
- 🐦 Say hi on [Twitter/X @ThieryRakt](https://twitter.com/ThieryRakt)

If you find GitCharta useful, a follow, a star, or just a message goes a long way : and who knows, you might be the pin that puts a new country on my own map.

[![GitHub](https://img.shields.io/badge/GitHub-ThierryRakotomanana-181717?style=for-the-badge&logo=github)](https://github.com/ThierryRakotomanana)

[![Twitter](https://img.shields.io/badge/Twitter-@ThieryRakt-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/ThieryRakt)
