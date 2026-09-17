# 🚀 PneumoAI Deployment Guide
## Oracle Cloud (Backend) + Cloudflare (Frontend)

See the full guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Architecture

```
Internet Users
     │
     ▼
┌─────────────────────────────┐
│  Cloudflare Pages           │  ← React SPA (free, global CDN)
│  pneumoai.pages.dev         │    Built from frontend/dist
└──────────┬──────────────────┘
           │ API calls (HTTPS)
           ▼
┌─────────────────────────────┐
│  Cloudflare Tunnel          │  ← Secure encrypted tunnel (free)
│  (cloudflared daemon)       │    No firewall ports needed!
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Oracle Cloud ARM VM        │  ← Docker container (free forever)
│  FastAPI + TensorFlow       │    Port 8000 (internal only)
│  DenseNet121 model          │
└─────────────────────────────┘
```

## Quick Start

### 1. Set up Oracle Cloud VM
```bash
# Upload and run setup script
scp scripts/setup-oracle-vm.sh ubuntu@<VM_IP>:~/setup.sh
ssh ubuntu@<VM_IP>
REPO_URL="https://github.com/YOUR_USERNAME/Pneumonia_Detection.git" bash ~/setup.sh
```

### 2. Start Cloudflare Tunnel
```bash
# Quick tunnel (temporary URL)
cloudflared tunnel --url http://localhost:8000

# Permanent tunnel
cloudflared tunnel login
cloudflared tunnel create pneumoai
sudo cloudflared service install
sudo systemctl start cloudflared
```

### 3. Set frontend API URL
Edit `frontend/.env.production`:
```env
VITE_API_URL=https://YOUR_TUNNEL_URL_HERE
```

### 4. Deploy Frontend to Cloudflare Pages
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=pneumoai
```

## GitHub Secrets for CI/CD

| Secret | Description |
|---|---|
| `VITE_API_URL` | Cloudflare tunnel URL |
| `CLOUDFLARE_API_TOKEN` | From Cloudflare dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | From Cloudflare dashboard |
| `ORACLE_VM_HOST` | VM public IP |
| `ORACLE_VM_USER` | `ubuntu` |
| `ORACLE_VM_SSH_KEY` | Private SSH key |

## Cost: $0/month — Everything is on free tiers!
