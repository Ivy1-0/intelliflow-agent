# DataPilot Agent — Submission Description

**Track:** Track 4 — Autopilot Agent

## What it does

DataPilot Agent is an autonomous data-analyst agent. Given a raw CSV dataset, it runs the entire analysis workflow start to finish with no human checkpoint required in the middle:

1. **Ingest** — parses the CSV, detects malformed rows and bad values, and repairs them automatically (padding/truncating misaligned rows, treating unparseable values as missing) instead of stopping to ask.
2. **Profile** — computes per-column statistics (mean, standard deviation, min/max, missing-value counts) and imputes any missing numeric values with the column mean, logging every decision it makes.
3. **Detect patterns** — identifies the dataset's primary metric, computes its trend via linear regression, finds correlations between numeric columns (Pearson's r), and flags statistical anomalies (z-score > 2.5).
4. **Verify** — independently recomputes its own headline statistic and checks it against what the pattern-detection stage produced. If they disagree, the agent does not escalate immediately — it re-runs the analysis stage itself and re-checks. Only if it exhausts a retry budget does it escalate to a human, with full diagnostic context attached.
5. **Visualize** — renders trend, distribution, and correlation charts as inline SVG, generated from the actual computed statistics.
6. **Report** — writes a plain-English narrative report summarizing the trend, the strongest correlation, any anomalies found, the data-quality repairs it made along the way, and concrete recommendations.

Every stage's outcome is streamed into a live execution timeline, and every autonomous decision — a data repair, a self-heal retry, an escalation — is written to a visible Autonomy Log, so a reviewer can see exactly what the agent did and why without it ever pausing for permission.

## Why this fits Track 4

Track 4 calls for an agent that autonomously completes a multi-step workflow start to finish, explicitly citing "an autonomous data analyst that ingests datasets, identifies patterns, generates visualizations, and writes reports" as an example. DataPilot Agent implements that exact pipeline, and its verification-and-self-heal loop is what makes it an *autopilot* rather than a workflow that simply pauses for approval at a decision point.

## How to try it

- **No install needed:** open `index.html` in any browser, pick a sample dataset (or paste your own CSV), and click **Run Autopilot**.
- Click **Run With Injected Fault** to force a verification mismatch on demand and watch the agent detect it and self-correct in real time, without any human input.
- The `backend/` directory contains a real FastAPI service that makes genuine Alibaba Cloud calls (DashScope Qwen-Max for report generation, OSS for archival) — see `DEPLOY.md` for how it's deployed and verified on Alibaba Cloud ECS.

## Tech stack

- Frontend: vanilla HTML/CSS/JavaScript, zero build step, zero dependencies.
- Backend: Python, FastAPI, DashScope SDK, OSS2 SDK.
- Deployment: Alibaba Cloud ECS, with DashScope (Qwen-Max) and OSS as the real cloud services in use.
