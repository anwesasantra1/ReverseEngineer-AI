from __future__ import annotations

import hashlib
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RE//LAB Analysis API",
    version="0.1.0",
    description="Basic static file triage for reverse-engineering workflows.",
)

# Local development defaults. Restrict this list to your deployed frontend origin(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MAX_UPLOAD_BYTES = 32 * 1024 * 1024
READ_CHUNK_BYTES = 1024 * 1024
PRINTABLE_RUN = re.compile(rb"[\x20-\x7e]{4,}")


def identify(data: bytes) -> dict[str, str]:
    """Return conservative format hints from common magic bytes."""
    if data.startswith(b"\x7fELF"):
        bits = "64-bit" if len(data) > 4 and data[4] == 2 else "32-bit" if len(data) > 4 and data[4] == 1 else "unknown bitness"
        endian = "little-endian" if len(data) > 5 and data[5] == 1 else "big-endian" if len(data) > 5 and data[5] == 2 else "unknown endianness"
        machine = "unknown"
        if len(data) >= 20:
            byteorder = "little" if data[5] == 1 else "big"
            arch_id = int.from_bytes(data[18:20], byteorder)
            machine = {3: "x86", 8: "MIPS", 20: "PowerPC", 40: "ARM", 62: "x86_64", 183: "AArch64", 243: "RISC-V"}.get(arch_id, f"machine-{arch_id}")
        return {"format": "ELF", "architecture": f"{machine} ({bits})", "endianness": endian}
    if data.startswith(b"MZ"):
        return {"format": "PE", "architecture": "see PE header", "endianness": "little-endian"}
    if data.startswith((b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe", b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe", b"\xca\xfe\xba\xbe")):
        return {"format": "Mach-O", "architecture": "see Mach-O header", "endianness": "header-dependent"}
    if data.startswith(b"\x00asm"):
        return {"format": "WebAssembly", "architecture": "wasm", "endianness": "little-endian"}
    return {"format": "Unknown / raw", "architecture": "unknown", "endianness": "unknown"}


def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = Counter(data)
    length = len(data)
    return round(-sum((count / length) * math.log2(count / length) for count in counts.values()), 3)


def extract_strings(data: bytes, limit: int = 100) -> list[str]:
    found: list[str] = []
    for match in PRINTABLE_RUN.finditer(data):
        found.append(match.group().decode("ascii", errors="replace"))
        if len(found) >= limit:
            break
    return found


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "re-lab-analysis-api"}


@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)) -> dict[str, Any]:
    """Analyze one uploaded file in memory; never execute or persist it."""
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(READ_CHUNK_BYTES)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit")
        chunks.append(chunk)
    data = b"".join(chunks)
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    profile = identify(data)
    return {
        "filename": Path(file.filename or "upload.bin").name,
        "size_bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        **profile,
        "entropy": shannon_entropy(data),
        "printable_strings": extract_strings(data),
        "analysis_note": "Static triage only. This API does not execute or fully disassemble the uploaded file.",
    }

