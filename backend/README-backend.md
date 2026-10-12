# RE//LAB backend

A small FastAPI service for basic, non-executing file triage. It identifies common file magic bytes, computes SHA-256 and Shannon entropy, and extracts printable ASCII strings.

## Run locally

```powershell
cd outputs
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py -m uvicorn backend:app --reload --host 127.0.0.1 --port 8000
```

- Health check: `GET http://127.0.0.1:8000/api/health`
- Analyze: `POST http://127.0.0.1:8000/api/analyze` with multipart form field `file`
- Interactive API docs: `http://127.0.0.1:8000/docs`

Uploads are held in memory, limited to 32 MB, and are not saved or executed. Update the CORS allow-list in `backend.py` to match the origin used to serve the frontend. The current frontend is still a visual mockup and does not call this API yet.
