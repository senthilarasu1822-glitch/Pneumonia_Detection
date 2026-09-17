# ─── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Empty VITE_API_URL = same-origin calls (frontend + backend on same inblitz.cloud domain)
RUN echo "VITE_API_URL=" > .env && npm run build


# ─── Stage 2: Python backend ──────────────────────────────────────────────────
FROM python:3.11-slim

# Install system libraries required by OpenCV and TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# ─── Install Python dependencies ──────────────────────────────────────────────
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


# ─── Copy backend files ───────────────────────────────────────────────────────
COPY app.py .
COPY gradcam.py .
COPY model/ ./model/


# ─── Copy React production build ──────────────────────────────────────────────
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist


# ─── inblitz.cloud port (Blitz Cloud uses 8080) ───────────────────────────────
ENV PORT=8080

EXPOSE 8080


# ─── Health check ─────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/')" || exit 1


# ─── Start FastAPI ────────────────────────────────────────────────────────────
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]