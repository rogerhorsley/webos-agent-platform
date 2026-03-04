#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# NexusOS Remote Docker Host Setup Script
# Run this on your Tencent Cloud Lighthouse (Ubuntu/Debian)
#
# Usage:
#   scp scripts/setup-remote-docker.sh root@YOUR_SERVER_IP:/root/
#   ssh root@YOUR_SERVER_IP 'bash /root/setup-remote-docker.sh'
#
# After running, copy the generated certs back to your local machine:
#   scp -r root@YOUR_SERVER_IP:/root/.docker/nexusos-certs ./docker-certs
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

SERVER_IP="${1:-$(curl -s ifconfig.me)}"
CERT_DIR="/root/.docker/nexusos-certs"
DOCKER_PORT=2376

echo "=== NexusOS Remote Docker Setup ==="
echo "Server IP: $SERVER_IP"
echo "Docker TLS Port: $DOCKER_PORT"
echo ""

# ── 1. Install Docker ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo ">>> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo ">>> Docker installed: $(docker --version)"
else
  echo ">>> Docker already installed: $(docker --version)"
fi

# ── 2. Generate TLS Certificates ──────────────────────────────────
echo ">>> Generating TLS certificates..."
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# CA key and cert
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days 3650 -key ca-key.pem -sha256 -out ca.pem \
  -subj "/CN=NexusOS Docker CA"

# Server key and cert
openssl genrsa -out server-key.pem 4096
openssl req -new -key server-key.pem -sha256 -out server.csr \
  -subj "/CN=$SERVER_IP"

cat > extfile.cnf <<EOF
subjectAltName = DNS:localhost,IP:$SERVER_IP,IP:127.0.0.1
extendedKeyUsage = serverAuth
EOF

openssl x509 -req -days 3650 -sha256 \
  -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -out server-cert.pem -extfile extfile.cnf

# Client key and cert
openssl genrsa -out key.pem 4096
openssl req -new -key key.pem -sha256 -out client.csr \
  -subj "/CN=NexusOS Client"

cat > client-extfile.cnf <<EOF
extendedKeyUsage = clientAuth
EOF

openssl x509 -req -days 3650 -sha256 \
  -in client.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -out cert.pem -extfile client-extfile.cnf

# Cleanup CSR and temp files
rm -f server.csr client.csr extfile.cnf client-extfile.cnf ca.srl

chmod 0400 ca-key.pem key.pem server-key.pem
chmod 0444 ca.pem server-cert.pem cert.pem

echo ">>> Certificates generated in $CERT_DIR"

# ── 3. Configure Docker Daemon for TLS ────────────────────────────
echo ">>> Configuring Docker daemon for remote TLS access..."

mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:$DOCKER_PORT"],
  "tls": true,
  "tlscacert": "$CERT_DIR/ca.pem",
  "tlscert": "$CERT_DIR/server-cert.pem",
  "tlskey": "$CERT_DIR/server-key.pem",
  "tlsverify": true,
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Docker systemd override to remove default -H flag conflict
mkdir -p /etc/systemd/system/docker.service.d
cat > /etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd
EOF

systemctl daemon-reload
systemctl restart docker

echo ">>> Docker daemon configured with TLS on port $DOCKER_PORT"

# ── 4. Firewall Rules ─────────────────────────────────────────────
echo ">>> Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw allow $DOCKER_PORT/tcp
  echo ">>> UFW: port $DOCKER_PORT opened"
elif command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port=$DOCKER_PORT/tcp
  firewall-cmd --reload
  echo ">>> firewalld: port $DOCKER_PORT opened"
else
  echo ">>> No firewall tool found. Make sure port $DOCKER_PORT is open in your cloud console."
fi

# ── 5. Build NexusOS Agent Image ──────────────────────────────────
echo ">>> Building nexusos-agent sandbox image..."
cat > /tmp/Dockerfile.agent <<'DOCKERFILE'
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget python3 python3-pip jq ripgrep \
    ca-certificates vim nano htop tree \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code 2>/dev/null || true

RUN useradd -m -d /home/agent -s /bin/bash agent

RUN mkdir -p /workspace /workspaces/shared && \
    chown -R agent:agent /workspace /workspaces

USER agent
WORKDIR /workspace

ENV TERM=xterm-256color
ENV LANG=en_US.UTF-8

CMD ["/bin/bash"]
DOCKERFILE

docker build -t nexusos-agent:latest -f /tmp/Dockerfile.agent /tmp/
rm /tmp/Dockerfile.agent

echo ">>> nexusos-agent:latest image built"

# ── 6. Create shared workspace volume ─────────────────────────────
echo ">>> Creating workspace directories..."
mkdir -p /opt/nexusos/workspaces/shared
chmod 777 /opt/nexusos/workspaces/shared

# ── 7. Verify ─────────────────────────────────────────────────────
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Docker version: $(docker --version)"
echo "Docker TLS:     tcp://$SERVER_IP:$DOCKER_PORT"
echo "Agent image:    nexusos-agent:latest"
echo "Workspaces:     /opt/nexusos/workspaces/"
echo "Certs:          $CERT_DIR/"
echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Copy client certs to your local machine:"
echo "   scp -r root@$SERVER_IP:$CERT_DIR ./docker-certs"
echo ""
echo "2. Add to your NexusOS .env:"
echo "   SANDBOX_MODE=docker"
echo "   DOCKER_HOST=tcp://$SERVER_IP:$DOCKER_PORT"
echo "   DOCKER_TLS_CA=./docker-certs/ca.pem"
echo "   DOCKER_TLS_CERT=./docker-certs/cert.pem"
echo "   DOCKER_TLS_KEY=./docker-certs/key.pem"
echo "   WORKSPACES_ROOT=/opt/nexusos/workspaces"
echo ""
echo "3. Test connection from local:"
echo "   docker --tlsverify --tlscacert=./docker-certs/ca.pem \\"
echo "     --tlscert=./docker-certs/cert.pem --tlskey=./docker-certs/key.pem \\"
echo "     -H=tcp://$SERVER_IP:$DOCKER_PORT info"
