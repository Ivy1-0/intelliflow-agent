# IntelliFlow Agent

An interactive front-end demo of an end-to-end business-workflow agent: a customer inquiry comes in, the agent classifies intent (including ambiguous, multi-intent messages), pulls customer context, checks it against approval thresholds, and either auto-completes the workflow or routes it to a human reviewer who can approve, reject, or escalate — with every decision recorded to an auditable log.

**Track:** Track 2 — Enterprise Workflow Automation

## What this is (and isn't)

This repository currently contains a **static front-end** (`index.html`, `style.css`, `script.js`) that runs the full workflow logic — intent classification, entity lookup, threshold-based approval routing, and decision logging — client-side in the browser, so you can see and interact with the agent's decision-making without standing up infrastructure first.

It is **not**, by itself, proof of a live backend or a live Alibaba Cloud deployment. The in-app "Architecture & Links" button (bottom toolbar) opens a panel that is explicit about this and gives you a place to record:

- a link to the actual source file in this repo that calls Alibaba Cloud APIs/SDKs (e.g. a DashScope client, an ECS/RDS/OSS integration script),
- a link to the real screen recording proving the backend is deployed and running on Alibaba Cloud,
- a link to your ~3 minute functional demo video,
- a link to the architecture diagram.

Fill these in via the `DEPLOYMENT_LINKS` object near the top of `script.js` before submitting. Do not present simulated output as if it were a live system check — judges will be looking for genuine evidence.

## Features

- **Multi-intent classification** — detects when a single customer message contains several distinct requests (e.g. a quote request *and* a complaint about a past order) and flags it as ambiguous rather than silently picking one.
- **Entity extraction / customer lookup** — resolves the inquiry against a customer record (new vs. returning, credit limit, purchase history) to inform downstream decisions.
- **Threshold-based approval routing** — quote amount, discount percentage, refund amount, and new-customer credit limit are all configurable thresholds (`CONFIG.approvalThresholds` in `script.js`). Inquiries that exceed them are routed to a human reviewer instead of being auto-completed.
- **Human-in-the-loop console** — pending approvals appear in a queue with the specific reason(s) they were flagged; a reviewer can Approve, Reject, or Escalate, and the workflow resumes accordingly.
- **Decision log** — every approval/rejection/escalation is timestamped and recorded for auditability.
- **Live stats** — total processed, auto-approval rate, and average processing time update as you run workflows.
- **Test scenarios** — "Test Ambiguous" and "Test Auto-Approval" buttons pre-fill realistic inputs so reviewers can see both code paths without typing.

## Project structure

```
index.html               Page markup
style.css                 Styling
script.js                 Workflow engine, approval logic, UI wiring
architecture-diagram.svg  System architecture diagram
LICENSE                   Apache 2.0
README.md                 This file
```

## Running locally

No build step or dependencies — it's plain HTML/CSS/JS.

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser.

## Intended production architecture

See `architecture-diagram.svg`. In production, the browser talks to an API Gateway in front of an ECS-hosted agent orchestrator, which calls DashScope (Qwen-Max) for intent classification and response drafting, ApsaraDB RDS for customer/order records, ApsaraDB Redis for workflow/session state, and OSS for attachments and audit-log archival.

## Configuration

Approval thresholds and other agent settings live in the `CONFIG` object at the top of `script.js`:

```js
const CONFIG = {
  qwenModel: 'qwen-max-2024-09-19',
  approvalThresholds: {
    quoteAmount: 5000,
    discountPercentage: 15,
    refundAmount: 1000,
    newCustomerCredit: 50000
  }
};
```

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

## Submission checklist

- [ ] Public repo with this README, source, and LICENSE
- [ ] License visible in the repo's "About" section
- [ ] Real Alibaba Cloud deployment-proof recording linked (see `DEPLOYMENT_LINKS.proofVideoUrl`)
- [ ] Link to the repo source file demonstrating Alibaba Cloud SDK/API usage (`DEPLOYMENT_LINKS.proofCodeFileUrl`)
- [ ] Architecture diagram included (`architecture-diagram.svg`)
- [ ] ~3 minute public demo video (YouTube/Vimeo/Facebook) linked (`DEPLOYMENT_LINKS.demoVideoUrl`)
- [ ] Track identified (Track 2 — Enterprise Workflow Automation)
- [ ] (Optional) Blog/social post link for the Blog Post Prize
