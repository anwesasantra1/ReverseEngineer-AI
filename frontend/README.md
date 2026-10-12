# RE//LAB React frontend

## Run the frontend

In a terminal, from this folder:

```powershell
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Start the FastAPI backend from the `outputs` folder separately:

```powershell
py -m uvicorn backend:app --reload --host 127.0.0.1 --port 8000
```

The frontend sends uploads to `http://127.0.0.1:8000/api/analyze`. To use another API address, create a `.env` file here with:

```text
VITE_API_URL=http://127.0.0.1:8000
```

The API currently performs static triage only. It does not execute or fully disassemble uploaded files.
