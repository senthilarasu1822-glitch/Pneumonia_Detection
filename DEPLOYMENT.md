# 🚀 inblitz.cloud Deployment Guide
## PneumoAI — Full Stack on a Single Docker Container

---

## Architecture

```
https://inblitz.cloud
        │
        ▼
  Your Server (VPS / VM)
  ┌────────────────────────────────────┐
  │  Nginx (port 80/443 → 8080)        │  ← SSL termination + reverse proxy
  │                                    │
  │  Docker Container: pneumoai        │
  │  ┌──────────────────────────────┐  │
  │  │  FastAPI (port 8080)         │  │
  │  │  ├── /predict  (AI model)    │  │
  │  │  ├── /appointments           │  │
  │  │  └── /*  (React SPA)         │  │
  │  └──────────────────────────────┘  │
  └────────────────────────────────────┘
```

**Single container serves everything.** Frontend calls go to the same origin — no CORS issues.

---

## Prerequisites

- A Linux server (Ubuntu 22.04 recommended) — VPS, Oracle Cloud, etc.
- Domain `inblitz.cloud` pointed to your server IP (via Cloudflare DNS)
- GitHub repository with the code pushed

---

## Step 1 — Point inblitz.cloud to your server

In **Cloudflare Dashboard → inblitz.cloud → DNS**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `YOUR_SERVER_IP` | ✅ Proxied |
| A | `www` | `YOUR_SERVER_IP` | ✅ Proxied |

> Set SSL/TLS mode to **Full (strict)** in Cloudflare → SSL/TLS.

---

## Step 2 — Server Setup (run once)

SSH into your server and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx + Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create appointments data file
touch ~/appointments.json
echo "[]" > ~/appointments.json
```

---

## Step 3 — Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/inblitz.cloud
```

Paste this config:

```nginx
server {
    listen 80;
    server_name inblitz.cloud www.inblitz.cloud;

    # Increase upload size for chest X-ray images (up to 20MB)
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for AI inference (up to 2 minutes)
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 120s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/inblitz.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 4 — Add GitHub Secrets

Go to your repo → **Settings → Secrets → Actions** and add:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Your server's public IP address |
| `SERVER_USER` | `ubuntu` (or your SSH username) |
| `SERVER_SSH_KEY` | Your private SSH key (the full contents) |

---

## Step 5 — Deploy

Push to `main` branch — GitHub Actions will automatically:
1. Build the Docker image
2. Upload it to your server
3. Restart the container
4. Verify health check

```bash
git add .
git commit -m "deploy: configure for inblitz.cloud"
git push origin main
```

---

## Step 6 — Manual First Deploy (optional)

If you want to deploy before setting up CI/CD:

```bash
# On your local machine
docker build -t pneumoai:latest .
docker save pneumoai:latest | gzip | ssh user@YOUR_SERVER_IP "docker load"

# On the server
docker run -d \
  --name pneumoai \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/appointments.json:/app/appointments.json \
  pneumoai:latest
```

---

## Verification

```bash
# Check container is running
docker ps

# Check health
curl http://localhost:8080/

# Check live site
curl https://inblitz.cloud/
```

---

## Cost: Depends on your server
- Cloudflare DNS + SSL proxy: **$0**
- Oracle Cloud ARM VM (4 vCPU, 24GB RAM): **$0/month (free tier)**
- DigitalOcean / Hostinger VPS: **~$4–6/month**
