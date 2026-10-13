# ReverseEngineer

Project layout:

- `frontend/` — Vite + React interface
- `backend/` — FastAPI source-analysis API

Run the backend using `backend/README-backend.md`. In a second terminal, run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal (usually <http://localhost:5173>). The frontend proxies `/api` requests to the API on `127.0.0.1:8000`.