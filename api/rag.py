"""
RAG File Upload API — accepts files, extracts text, stores as context.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rag", tags=["rag"])

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".csv", ".json", ".py", ".js", ".html", ".xml"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _extract_text(file_path: Path) -> str:
    """Extract text from uploaded file."""
    ext = file_path.suffix.lower()
    try:
        if ext == ".pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(str(file_path))
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                return "[PDF support requires pypdf: pip install pypdf]"
        elif ext == ".csv":
            import csv
            lines = []
            with open(file_path, newline="", encoding="utf-8", errors="ignore") as f:
                reader = csv.reader(f)
                for row in reader:
                    lines.append(", ".join(row))
            return "\n".join(lines[:200])  # Limit rows
        else:
            # Plain text, markdown, code files etc.
            return file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        logger.error("Text extraction failed for %s: %s", file_path, e)
        return f"[Failed to extract text: {e}]"


@router.post("/upload", summary="Upload a file for RAG context")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file. Returns extracted text to use as RAG context in chat."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Save file
    safe_name = Path(file.filename).name.replace(" ", "_")
    dest = UPLOAD_DIR / safe_name
    dest.write_bytes(content)

    # Extract text
    text = _extract_text(dest)
    # Limit context size to avoid overwhelming the LLM
    if len(text) > 8000:
        text = text[:8000] + "\n\n[... content truncated ...]"

    logger.info("Uploaded file: %s (%d bytes, %d chars extracted)", safe_name, len(content), len(text))

    return {
        "filename": file.filename,
        "size": len(content),
        "ext": ext,
        "chars_extracted": len(text),
        "text": text,
    }


@router.get("/uploads", summary="List uploaded files")
async def list_uploads():
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file():
            files.append({"name": f.name, "size": f.stat().st_size})
    return {"files": files}
