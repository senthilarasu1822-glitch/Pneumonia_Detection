#!/bin/bash
# =============================================================================
# PneumoAI — Oracle Cloud VM Setup Script
# Ubuntu 22.04 ARM64 (VM.Standard.A1.Flex)
# Run this on a fresh Oracle Cloud VM as: bash setup-oracle-vm.sh
# =============================================================================

set -e  # exit on any error

echo "=== [1/6] Updating system packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y

echo "=== [2/6] Installing Docker ==="
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# Docker official repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow current user to run docker without sudo
sudo usermod -aG docker $USER
echo "NOTE: You may need to log out and back in for docker group to take effect."

echo "=== [3/6] Installing cloudflared (Cloudflare Tunnel) ==="
# ARM64 version
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 \
  -o /tmp/cloudflared
sudo install -m 755 /tmp/cloudflared /usr/local/bin/cloudflared
cloudflared --version

echo "=== [4/6] Cloning your repository ==="
# IMPORTANT: Replace with your actual GitHub repo URL
REPO_URL="${REPO_URL:-https://github.com/YOUR_USERNAME/Pneumonia_Detection.git}"

if [ -d "$HOME/Pneumonia_Detection" ]; then
  echo "Repo already cloned, pulling latest..."
  cd "$HOME/Pneumonia_Detection" && git pull
else
  git clone "$REPO_URL" "$HOME/Pneumonia_Detection"
  cd "$HOME/Pneumonia_Detection"
fi

echo "=== [5/6] Building and starting Docker container ==="
cd "$HOME/Pneumonia_Detection"
docker compose up -d --build

echo "=== [6/6] Setting up Cloudflare Tunnel ==="
echo ""
echo "-----------------------------------------------------------"
echo "  Run the following command to create a quick tunnel:"
echo ""
echo "    cloudflared tunnel --url http://localhost:8000"
echo ""
echo "  This will print a public URL like:"
echo "    https://random-name.trycloudflare.com"
echo ""
echo "  Copy that URL and paste it into frontend/.env.production"
echo "  as VITE_API_URL=https://random-name.trycloudflare.com"
echo ""
echo "  For a PERMANENT tunnel (recommended), run:"
echo "    cloudflared tunnel login"
echo "    cloudflared tunnel create pneumoai"
echo "    (then follow the DEPLOYMENT.md instructions)"
echo "-----------------------------------------------------------"

echo ""
echo "=== Setup complete! ==="
echo "Your backend is running at: http://localhost:8000"
echo "Health check: curl http://localhost:8000/health"
