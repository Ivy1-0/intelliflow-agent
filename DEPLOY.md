# Deploying the DataPilot Agent Backend on Alibaba Cloud

This backend (`backend/main.py`) is what makes the real Alibaba Cloud calls:
- `POST /api/generate-report` → calls **DashScope (Qwen-Max)** to write the narrative report
- `POST /api/save-report` → archives the report to **Alibaba Cloud OSS**

The steps below get it running on a real Alibaba Cloud ECS instance, and tell
you exactly what to capture for the hackathon's "Proof of Alibaba Cloud
Deployment" requirement. Do these for real — the judges can and do check.

## 1. Get a DashScope API key

1. Go to the [Alibaba Cloud Model Studio / DashScope console](https://dashscope.console.aliyun.com/).
2. Create an API key under **API-KEY management**.
3. Keep it handy — you'll set it as an environment variable on the server.

## 2. Create an ECS instance

1. In the [ECS console](https://ecs.console.aliyun.com/), click **Create Instance**.
2. Cheapest option is fine: a `t5`/`t6` burstable instance, Ubuntu 22.04, 1–2 vCPU.
3. In the security group settings, open **port 8000** (or whatever port you run on) to `0.0.0.0/0` for the demo, and port 22 for SSH.
4. Note the instance's **public IP address** once it's running — you'll need it both for testing and for your proof recording.

## 3. Deploy the backend

SSH into the instance, then:

```bash
sudo apt update && sudo apt install -y python3-pip python3-venv git
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DASHSCOPE_API_KEY=sk-xxxxxxxx     # your real key from step 1
uvicorn main:app --host 0.0.0.0 --port 8000
```

(For something more durable than a foreground process, wrap this in a
`systemd` service or just run it in `screen`/`tmux` for the demo period —
either is fine for a hackathon submission.)

Alternative: build and run the Docker image instead:

```bash
cd backend
docker build -t datapilot-backend .
docker run -d -p 8000:8000 -e DASHSCOPE_API_KEY=sk-xxxxxxxx datapilot-backend
```

## 4. Verify it's actually working

From your **local machine** (not the server), hit the public IP:

```bash
curl http://<ECS_PUBLIC_IP>:8000/api/health
```

You should see `"dashscope_configured": true`. Then test the real Qwen call:

```bash
curl -X POST http://<ECS_PUBLIC_IP>:8000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_label": "Monthly Sales",
    "metric": "units",
    "trend_direction": "upward",
    "slope": 3151.76,
    "metric_mean": 456.4,
    "metric_std": 12.1,
    "correlations": [{"a":"revenue","b":"units","r":0.11}],
    "anomalies": [{"row":6,"value":900000,"z":3.3}],
    "ingest_fixes": [],
    "profile_fixes": ["Column \"revenue\": imputed 1 missing value with the column mean."],
    "self_heal_count": 0
  }'
```

A real narrative written by Qwen-Max should come back in the response.

## 5. Record your Proof of Deployment video

This must be a **separate recording** from your 3-minute demo video. Show, in one continuous take:

1. The Alibaba Cloud ECS console with the instance visibly **Running**, showing its public IP.
2. A terminal running the `curl` commands from step 4 against that same public IP, showing a live Qwen-generated response coming back.
3. (Optional but strong) The DashScope console's usage/logs page showing the request you just made.

Upload that recording and link it in your submission alongside a link to
`backend/main.py` in your repo (the code file that actually makes the
DashScope/OSS calls) — that satisfies the "link to a code file that
demonstrates use of Alibaba Cloud services and APIs" requirement.

## Notes

- The frontend (`index.html`/`script.js`) works fully offline for the main
  demo — it doesn't need this backend to run. The backend exists specifically
  to make good on the "real cloud deployment" and "real API calls" requirements
  without forcing every judge to configure cloud credentials just to see the
  core agent behavior.
- If you want the frontend to call the real backend instead of its local
  narrative generator, that's a small additional wiring step (a `fetch()` to
  `/api/generate-report` in `generateReport()` in `script.js`) — say so if
  you'd like that added.
