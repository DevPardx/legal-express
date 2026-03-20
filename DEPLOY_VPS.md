# Deployment Guide — Legal Express (Hetzner VPS, no domain)

## Architecture

```
Internet → Hetzner VPS (port 80)
               │
               └── Nginx (inside frontend container)
                     ├── Static files → React SPA
                     ├── /api/events → backend:3000 (SSE, no buffering)
                     ├── /api/       → backend:3000
                     └── /generated/ → backend:3000 (PDF/DOCX downloads)
                           │
                     backend container (internal :3000)
                     postgres container (127.0.0.1:5432 — SSH tunnel only)
                     redis container    (internal only)
```

Access the app at: `http://YOUR_SERVER_IP`

---

## 1. Server Setup (one-time)

SSH in as root:

```bash
# Update packages
apt update && apt upgrade -y

# Create non-root deploy user
adduser deploy
usermod -aG sudo deploy
```

From your **local machine**, copy your SSH key:

```bash
ssh-copy-id deploy@YOUR_SERVER_IP
```

Back on the server as `deploy`:

```bash
# Lock down SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
#      PasswordAuthentication no
sudo systemctl restart sshd

# Firewall — allow SSH + HTTP only
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

## 2. Install Docker

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add deploy user to docker group (re-login after this)
sudo usermod -aG docker deploy
```

Log out and back in.

## 3. Clone the Repository

Generate a deploy key on the server:

```bash
ssh-keygen -t ed25519 -C "deploy@legal-express-vps"
cat ~/.ssh/id_ed25519.pub
# Add this key to GitHub → repo Settings → Deploy keys
```

Clone:

```bash
mkdir -p ~/apps && cd ~/apps
git clone git@github.com:YOUR_GITHUB_USER/legal-express.git
cd legal-express
```

## 4. Configure Environment

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in all values. Generate secrets:

```bash
openssl rand -hex 32   # use for POSTGRES_PASSWORD, JWT_SECRET, WEBHOOK_SECRET
```

**Important:** Update `FRONTEND_URL` to `http://YOUR_SERVER_IP`.
Set `DATABASE_URL` host to `postgres` (Docker service name, not `localhost`).

## 5. Configure Docker Log Rotation

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
sudo systemctl enable docker
```

## 6. Deploy

```bash
cd ~/apps/legal-express
docker compose -f infrastructure/docker-compose.prod.yml up -d --build
```

Run Prisma migrations after the database is healthy:

```bash
docker compose -f infrastructure/docker-compose.prod.yml exec backend \
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
```

Verify everything is running:

```bash
docker compose -f infrastructure/docker-compose.prod.yml ps
curl http://localhost/api/health
```

Open `http://YOUR_SERVER_IP` in your browser.

## 7. Post-Deploy Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Subsequent Deploys

```bash
cd ~/apps/legal-express
git pull
docker compose -f infrastructure/docker-compose.prod.yml up -d --build
# Only if schema changed:
docker compose -f infrastructure/docker-compose.prod.yml exec backend \
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
```

---

## Database Access (TablePlus via SSH Tunnel)

| Field      | Value                          |
|------------|-------------------------------|
| Host       | `127.0.0.1`                   |
| Port       | `5432`                        |
| User       | your `POSTGRES_USER`          |
| Password   | your `POSTGRES_PASSWORD`      |
| Database   | `legal_express`               |
| SSH Host   | `YOUR_SERVER_IP`              |
| SSH Port   | `22`                          |
| SSH User   | `deploy`                      |
| SSH Key    | your private key              |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Port 80 refused | UFW not opened | `sudo ufw allow 80/tcp` |
| Backend unhealthy | Missing env var | Check `docker compose logs backend` |
| PDF download 404 | Wrong path | `/generated/` is proxied to backend — check nginx.conf |
| SSE not streaming | Nginx buffering | Confirm `/api/events` location uses `proxy_buffering off` |
| Prisma `Cannot find module` | Stale WASM client | Delete `.prisma/client/` in builder layer and rebuild |
| `Can't reach database at localhost` | Wrong host in DATABASE_URL | Use `postgres` (Docker service name) |
| Password with special chars breaks URL | `openssl rand -base64` produces `/+=` | Use `openssl rand -hex 32` |
