"""
DataPilot Agent — Backend
==========================
This is the real Alibaba Cloud integration layer for DataPilot Agent.
Unlike the frontend's local narrative generator (used for the offline/
no-install demo), this service makes a genuine call to Alibaba Cloud's
DashScope API (Qwen-Max) to write the analysis narrative, and optionally
archives the resulting report to Alibaba Cloud OSS.

Run locally:
    pip install -r requirements.txt
    export DASHSCOPE_API_KEY=sk-xxxx
    uvicorn main:app --host 0.0.0.0 --port 8000

Deploy on Alibaba Cloud: see ../DEPLOY.md
"""

import os
import json
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import dashscope
from dashscope import Generation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("datapilot-backend")

DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
dashscope.api_key = DASHSCOPE_API_KEY

OSS_ACCESS_KEY_ID = os.environ.get("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.environ.get("OSS_ACCESS_KEY_SECRET", "")
OSS_ENDPOINT = os.environ.get("OSS_ENDPOINT", "https://oss-cn-hangzhou.aliyuncs.com")
OSS_BUCKET_NAME = os.environ.get("OSS_BUCKET_NAME", "")

app = FastAPI(title="DataPilot Agent Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


class Correlation(BaseModel):
    a: str
    b: str
    r: float


class Anomaly(BaseModel):
    row: int
    value: float
    z: float


class AnalysisPayload(BaseModel):
    dataset_label: str
    metric: str
    trend_direction: str
    slope: float
    metric_mean: float
    metric_std: float
    correlations: list[Correlation] = []
    anomalies: list[Anomaly] = []
    ingest_fixes: list[str] = []
    profile_fixes: list[str] = []
    self_heal_count: int = 0


@app.get("/api/health")
def health():
    """Basic liveness probe — also confirms whether a DashScope key is configured."""
    return {
        "status": "ok",
        "service": "datapilot-agent-backend",
        "dashscope_configured": bool(DASHSCOPE_API_KEY),
        "oss_configured": bool(OSS_ACCESS_KEY_ID and OSS_BUCKET_NAME),
        "time": datetime.now(timezone.utc).isoformat(),
    }


def _build_prompt(payload: AnalysisPayload) -> str:
    corr_lines = "\n".join(
        f"- {c.a} vs {c.b}: r={c.r:.2f}" for c in payload.correlations[:5]
    ) or "- none found"
    anomaly_lines = "\n".join(
        f"- row {a.row + 1}: value={a.value:.2f} (z={a.z:.2f})" for a in payload.anomalies[:5]
    ) or "- none found"
    fixes = "\n".join(f"- {f}" for f in (payload.ingest_fixes + payload.profile_fixes)) or "- dataset was clean, no repairs needed"

    return f"""You are a data analyst agent writing a short, plain-English report for a
business audience. Be concise and concrete. Do not repeat these instructions.

Dataset: {payload.dataset_label}
Primary metric: {payload.metric}
Trend: {payload.trend_direction} (slope {payload.slope:.2f} per observation)
Metric mean: {payload.metric_mean:.2f}, std dev: {payload.metric_std:.2f}

Correlations found:
{corr_lines}

Anomalies flagged (|z| > 2.5):
{anomaly_lines}

Autonomous data-quality repairs made during this run:
{fixes}

Self-healing verification retries this run: {payload.self_heal_count}

Write a 3-paragraph report: (1) summary of the trend and headline metric,
(2) the most important correlation and anomaly findings and what they might
mean, (3) one or two concrete recommendations. Mention that data-quality
issues were repaired autonomously if any were found."""


@app.post("/api/generate-report")
def generate_report(payload: AnalysisPayload):
    """
    Real Alibaba Cloud call: sends the agent's computed statistics to
    DashScope's Qwen-Max model and returns the generated narrative.
    """
    if not DASHSCOPE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="DASHSCOPE_API_KEY is not configured on this server.",
        )

    prompt = _build_prompt(payload)

    try:
        response = Generation.call(
            model="qwen-max",
            prompt=prompt,
            result_format="text",
        )
    except Exception as exc:  # network/SDK errors surface as 502
        logger.exception("DashScope call failed")
        raise HTTPException(status_code=502, detail=f"DashScope call failed: {exc}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"DashScope returned status {response.status_code}: {response.message}",
        )

    narrative = response.output.text

    return {
        "narrative": narrative,
        "model": "qwen-max",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/save-report")
def save_report(payload: dict):
    """
    Real Alibaba Cloud call: archives the final report text to an OSS bucket.
    Requires OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET_NAME to be set.
    """
    if not (OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET and OSS_BUCKET_NAME):
        raise HTTPException(
            status_code=503,
            detail="OSS credentials are not configured on this server.",
        )

    import oss2  # imported lazily so the app still runs without the package configured

    text = payload.get("report_text", "")
    if not text:
        raise HTTPException(status_code=400, detail="report_text is required")

    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)

    key = f"reports/datapilot-report-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.txt"
    bucket.put_object(key, text.encode("utf-8"))

    return {"stored_key": key, "bucket": OSS_BUCKET_NAME}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
