# Demo Video Script (~3 minutes)

Record your screen with `index.html` open in a browser. This is the general
demo video — separate from the Alibaba Cloud "proof of deployment" recording
described in `DEPLOY.md`.

---

**0:00–0:15 — Hook + framing**
Say: "This is DataPilot Agent, an autonomous data analyst built for Track 4,
Autopilot Agent. Give it a raw dataset and it runs the entire analysis
end-to-end with no human input — and if it catches itself making a mistake,
it fixes itself instead of stopping."

Show: the loaded page, dataset dropdown, CSV textarea already populated with
the default "Monthly Sales" sample.

**0:15–0:35 — Kick off a normal run**
Click **Run Autopilot**. Narrate each stage as it appears in the timeline:
"Ingest — it just found and repaired a bad row on its own. Profile — computing
stats per column. Detect Patterns — trend, correlations, anomalies, all
computed live from this data, not hardcoded."

**0:35–0:55 — Verification stage**
Point at the "Verify Findings" step completing cleanly: "Before it trusts its
own numbers, it independently recomputes the key statistic and checks itself.
This time it matched, so it moved straight on."

**0:55–1:15 — Visualizations + report**
Show the generated charts (trend line, bar chart, correlation chart) appearing,
then the final report panel: "All of this — the charts and this report — were
generated from the actual numbers it computed two seconds ago, and it archived
the report without me touching anything."

**1:15–1:50 — The self-healing moment (the core Track 4 proof point)**
Click **Run With Injected Fault**. Narrate live as it happens: "Now I'm
forcing it to produce a bad number on purpose. Watch — Verify Findings just
failed. Look at the Autonomy Log: it detected the mismatch, recomputed the
analysis stage itself, and re-verified — no popup, no approval button, no
human in the loop. That retry-until-correct behavior is what makes this an
autopilot agent instead of a workflow with a pause button."

**1:50–2:15 — Try a different dataset**
Switch the dropdown to "Server Response Metrics" or "Website Traffic Log" and
run again quickly: "Same six-stage pipeline, different dataset, same
autonomy — it adapts its analysis to whatever's actually in the data."

**2:15–2:40 — Real cloud integration**
Show the "Backend URL" field: "If I point this at my Alibaba Cloud backend
instead of leaving it blank, the report is written by a live DashScope
Qwen-Max call instead of the local generator — that's covered in the separate
deployment proof video and in backend/main.py." (You can either actually
demo this live if your backend is running, or just show the field and refer
to the separate proof video.)

**2:40–3:00 — Close**
Show the architecture diagram (`architecture.svg`) or the Alibaba Cloud
architecture bar at the bottom of the page: "Track 4 asks for an agent that
completes a multi-step workflow autonomously, start to finish. DataPilot
Agent does that, and it can catch and correct its own mistakes along the
way, which is the part that makes it an autopilot, not just a pipeline."

---

## Tips
- Keep your cursor moving to what you're narrating — judges skim fast.
- The fault-injection moment (1:15–1:50) is the single most important 30
  seconds in this video. Don't rush it.
- Upload to YouTube/Vimeo/Facebook Video as **public** (not unlisted-only if
  the rules require public — double check the submission portal's exact
  wording) before you paste the link into your submission form.
