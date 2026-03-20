# Deployment Guide — raiz-api

## Architecture

```
Internet → Cloudflare (DNS + SSL) → Hetzner VPS
                                        │
                                        ├── Nginx (reverse proxy, port 443)
                                        ├── API container (127.0.0.1:4000)
                                        ├── PostgreSQL + PostGIS container (127.0.0.1:5432)
                                        └── Redis container (internal only)
```

## Prerequisites

- Hetzner VPS (Ubuntu)
- Cloudflare account with domain configured
- GitHub repo with deploy key access

---

## 1. Server Security

SSH in as root, then:

```bash
apt update && apt upgrade -y

# Create non-root user
adduser deploy
usermod -aG sudo deploy
```

From your local machine, copy your SSH key:

```bash
ssh-copy-id deploy@SERVER_IP
```

Verify you can SSH as deploy without a password, then lock down SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

Set:

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart sshd
```

Firewall:

```bash
sudo ufw allow OpenSSH
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

sudo usermod -aG docker deploy
# Log out and back in for group to take effect
```

## 3. Install Nginx

```bash
sudo apt install -y nginx
sudo ufw allow 'Nginx Full'
```

Create site config:

```bash
sudo nano /etc/nginx/sites-available/api.raizsv.com
```

```nginx
server {
    listen 443 ssl;
    server_name api.raizsv.com;

    ssl_certificate /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable it and **remove the default site** (otherwise it captures all traffic):

```bash
sudo ln -s /etc/nginx/sites-available/api.raizsv.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Cloudflare SSL (Origin Certificate)

1. Cloudflare → SSL/TLS → Origin Server → Create Certificate
2. Save cert and key to the server:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/cert.pem    # paste certificate
sudo nano /etc/ssl/cloudflare/key.pem     # paste private key
sudo chmod 600 /etc/ssl/cloudflare/key.pem
```

3. Set SSL/TLS encryption mode to **Full (Strict)**

### Cloudflare DNS

- **Type:** A | **Name:** `api` | **Content:** SERVER_IP | **Proxy:** ON

## 5. Clone & Configure

Generate a deploy key on the server:

```bash
ssh-keygen -t ed25519 -C "deploy@raiz-vps"
cat ~/.ssh/id_ed25519.pub
# Add this to GitHub repo → Settings → Deploy keys
```

Clone:

```bash
mkdir -p ~/apps && cd ~/apps
git clone git@github.com:YOUR_ORG/raiz-api.git
cd raiz-api
```

Create `.env` (never commit this):

```bash
nano .env
```

Required variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@postgres:5432/raiz?schema=public"
POSTGRES_USER=raiz
POSTGRES_PASSWORD=<generate with: openssl rand -hex 32>
POSTGRES_DB=raiz
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://www.raizsv.com
GITHUB_TOKEN=<your github token>
```

> **Important:** The DATABASE_URL host must be `postgres` (the Docker service name), not `localhost`.
> Use `openssl rand -hex 32` for passwords — avoid `rand -base64` which produces `/`, `+`, `=` characters that break URL parsing.

## 6. Deploy

```bash
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

Verify:

```bash
docker compose ps                          # all containers running
curl http://localhost:4000/api/waitlist     # API responds
curl https://api.raizsv.com/api/waitlist   # external access works
```

## 7. Post-Deploy

### Docker log rotation

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
```

### Auto security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Auto-start on reboot

```bash
sudo systemctl enable docker
```

Containers already have `restart: unless-stopped` in compose.yml.

---

## Subsequent Deploys

```bash
cd ~/apps/raiz-api
git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy   # only if there are new migrations
```

## Connecting to the Database (TablePlus)

Use an **SSH tunnel** — the database is not exposed to the internet.

| Field | Value |
|-------|-------|
| Host | `127.0.0.1` |
| Port | `5432` |
| User | your POSTGRES_USER |
| Password | your POSTGRES_PASSWORD |
| Database | `raiz` |
| **Over SSH** | |
| SSH Host | SERVER_IP |
| SSH Port | `22` |
| SSH User | `deploy` |
| SSH Key | your private key (`id_ed25519`) |

> The postgres service exposes `127.0.0.1:5432:5432` in compose.yml — this makes it reachable via SSH tunnel but not from the internet.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Cloudflare 521 | Nginx not listening on 443 | Check Nginx config has `listen 443 ssl` with Cloudflare origin certs |
| Nginx shows default page | `sites-enabled/default` exists | `sudo rm /etc/nginx/sites-enabled/default && sudo systemctl reload nginx` |
| CORS error | `CORS_ORIGIN` doesn't match frontend domain exactly | Update `.env` — must match exactly including `www` if frontend uses it |
| `Can't reach database at localhost` | Wrong host in DATABASE_URL | Use `postgres` (Docker service name), not `localhost` |
| Prisma `Permission denied` | node_modules owned by root, container runs as `node` | Dockerfile needs `RUN chown -R node:node /app` before `USER node` |
| Prisma `Cannot find module prisma/config` | `prisma` CLI not in production deps | `prisma` must be in `dependencies`, not `devDependencies` |
| Password with special chars breaks DB URL | `openssl rand -base64` produces `/+=` | Use `openssl rand -hex 32` instead |
| TablePlus "failed to create tunnel" | Postgres port not mapped to host | compose.yml needs `ports: ["127.0.0.1:5432:5432"]` on postgres service |
