# ─── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Point the API to the same origin (empty string = relative URL /predict etc.)
RUN echo "VITE_API_URL=" > .env && npm run build


# ─── Stage 2: Python backend (serves frontend + API) ─────────────────────────
FROM python:3.11-slim

# Install system libs needed by OpenCV and TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY app.py .
COPY gradcam.py .
COPY model/ ./model/
COPY appointments.json .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Oracle Cloud deployment — standard port 8000
ENV PORT=8000
EXPOSE 8000

# Health check so Docker / orchestrators know when the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run FastAPI (serves both the React SPA and API endpoints)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]