# ==============================================================================
# RESUMIO ML SERVICE DOCKERFILE
# Phase 11: Production Hardening, Security, Privacy and Operations
# Dedicated container host with min 4GB RAM for SentenceTransformers / PyTorch
# ==============================================================================

FROM python:3.11-slim AS runtime

# System security updates & minimal build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create unprivileged non-root user
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser

# Copy dependency specifications
COPY ml/requirements.txt* ./

# Install python dependencies if requirements exist, or lightweight core
RUN if [ -f "requirements.txt" ]; then pip install --no-cache-dir -r requirements.txt; else pip install --no-cache-dir fastapi uvicorn pydantic numpy torch sentence-transformers; fi

# Copy ML package source
COPY ml /app/ml

# Create cache and model registry directories with correct ownership
RUN mkdir -p /app/ml/registry /app/.cache && \
    chown -R appuser:appgroup /app

USER appuser

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV OMP_NUM_THREADS=4
ENV MALLOC_ARENA_MAX=2

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "ml.src.api:app", "--host", "0.0.0.0", "--port", "8000"]
