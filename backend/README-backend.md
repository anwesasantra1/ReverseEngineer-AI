# ReverseEngineer backend

## Setup

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirement.txt
uvicorn backend:app --reload --host 127.0.0.1 --port 8000
```

API docs: <http://127.0.0.1:8000/docs>. Health check: `GET /api/health`. Analyze one source file with `POST /api/analyze` and JSON `{ "filename": "example.py", "source": "..." }`.

The current analyzer uses local source patterns. It does not run code, call a hosted AI model, or trace multi-file/runtime behavior. No API key is required. Never put real secrets in `.env.example`.