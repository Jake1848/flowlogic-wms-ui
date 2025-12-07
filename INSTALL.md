# FlowLogic WMS - Installation Guide

## Quick Start (5 Minutes)

### Option 1: One-Line Install (Linux/Mac/Unix)

```bash
curl -fsSL https://flowlogic.io/install.sh | bash
```

### Option 2: Docker (Windows/Linux/Mac)

```bash
git clone https://github.com/flowlogic-wms/flowlogic-ui.git
cd flowlogic-ui
docker-compose up -d
```

Access at: http://localhost:3001

---

## Detailed Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 20 GB | 50+ GB SSD |
| OS | Any (Linux/Unix/Windows/Mac) | Ubuntu 22.04 LTS |

### Supported Operating Systems

- **Linux**: Ubuntu, Debian, RHEL, CentOS, Amazon Linux, Alpine
- **Unix**: FreeBSD, OpenBSD, Solaris, AIX, HP-UX
- **Windows**: Windows 10/11, Windows Server 2016+
- **macOS**: 11.0+ (Big Sur and later)
- **Cloud**: AWS, Azure, GCP, DigitalOcean, any VPS

---

## Installation Methods

### Method 1: Docker (Recommended)

Best for: Quick deployment, production use, any operating system

```bash
# Clone repository
git clone https://github.com/flowlogic-wms/flowlogic-ui.git
cd flowlogic-ui

# Create environment file
cp .env.example .env
nano .env  # Edit configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Includes:**
- FlowLogic WMS application
- PostgreSQL database
- Redis cache
- Auto-restart on failure

### Method 2: Manual Installation

Best for: Development, customization, air-gapped environments

```bash
# Prerequisites
# Node.js 18+ (https://nodejs.org)
# PostgreSQL 14+ (https://postgresql.org)

# Clone repository
git clone https://github.com/flowlogic-wms/flowlogic-ui.git
cd flowlogic-ui

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Initialize database
npx prisma db push
npm run db:seed  # Optional: Load demo data

# Build for production
npm run build

# Start server
npm start
```

### Method 3: Cloud Deployment

#### AWS

```bash
# Using AWS CLI
aws cloudformation create-stack \
  --stack-name flowlogic-wms \
  --template-url https://flowlogic.io/aws/template.yaml \
  --parameters ParameterKey=InstanceType,ParameterValue=t3.medium
```

#### Azure

```bash
# Using Azure CLI
az deployment group create \
  --resource-group flowlogic-rg \
  --template-uri https://flowlogic.io/azure/template.json
```

#### DigitalOcean

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/flowlogic-wms/flowlogic-ui)

---

## Configuration

### Environment Variables

Edit `.env` file:

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/flowlogic_wms"

# AI Assistant (Optional)
ANTHROPIC_API_KEY=your_api_key

# Security
JWT_SECRET=generate_a_strong_secret_here
```

### ERP Integration

FlowLogic connects to all major ERP systems:

#### SAP (ECC / S/4HANA)

```bash
# .env
SAP_HOST=sap.yourcompany.com
SAP_SYSTEM_NUMBER=00
SAP_CLIENT=100
SAP_USER=WMS_USER
SAP_PASSWORD=secure_password
```

#### Oracle (Fusion / EBS / JDE)

```bash
# .env
ORACLE_HOST=oracle.yourcompany.com
ORACLE_PORT=1521
ORACLE_SERVICE=ORCL
ORACLE_USER=wms_user
ORACLE_PASSWORD=secure_password
```

#### NetSuite

```bash
# .env
NETSUITE_ACCOUNT_ID=1234567
NETSUITE_CONSUMER_KEY=your_consumer_key
NETSUITE_CONSUMER_SECRET=your_consumer_secret
NETSUITE_TOKEN_ID=your_token_id
NETSUITE_TOKEN_SECRET=your_token_secret
```

#### Microsoft Dynamics (F&O / BC / GP)

```bash
# .env
DYNAMICS_TENANT_ID=your_tenant_id
DYNAMICS_CLIENT_ID=your_client_id
DYNAMICS_CLIENT_SECRET=your_client_secret
DYNAMICS_ENVIRONMENT=yourcompany.crm.dynamics.com
```

### EDI Configuration (X12)

```bash
# .env
EDI_FTP_HOST=edi.tradingpartner.com
EDI_FTP_USER=your_user
EDI_FTP_PASSWORD=your_password
EDI_INBOUND_PATH=/inbound
EDI_OUTBOUND_PATH=/outbound
```

Supported EDI transactions:
- **850** - Purchase Order
- **855** - Purchase Order Acknowledgment
- **856** - Advance Ship Notice
- **810** - Invoice
- **940** - Warehouse Shipping Order
- **945** - Warehouse Shipping Advice
- **943** - Warehouse Stock Transfer
- **944** - Warehouse Stock Transfer Receipt
- **947** - Warehouse Inventory Adjustment

---

## Post-Installation Setup

### 1. Access Setup Wizard

Open browser: `http://localhost:3001/setup`

### 2. Complete Setup Steps

1. **Company Information** - Enter your company details
2. **Database** - Verify database connection
3. **ERP Integration** - Connect to your ERP system
4. **Warehouses** - Configure warehouse locations
5. **Admin User** - Create administrator account

### 3. Start Using FlowLogic

- **Dashboard**: `http://localhost:3001/dashboard`
- **API Documentation**: `http://localhost:3001/api`

---

## Unix/Linux Service Setup

### Systemd (Ubuntu/Debian/RHEL)

```bash
# Create service file
sudo nano /etc/systemd/system/flowlogic.service
```

```ini
[Unit]
Description=FlowLogic WMS
After=network.target postgresql.service

[Service]
Type=simple
User=flowlogic
WorkingDirectory=/opt/flowlogic-wms
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable flowlogic
sudo systemctl start flowlogic
sudo systemctl status flowlogic
```

### Init.d (Legacy Unix)

```bash
sudo nano /etc/init.d/flowlogic
```

```bash
#!/bin/sh
### BEGIN INIT INFO
# Provides:          flowlogic
# Required-Start:    $network $postgresql
# Required-Stop:     $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Description:       FlowLogic WMS
### END INIT INFO

case "$1" in
  start)
    cd /opt/flowlogic-wms
    NODE_ENV=production node server/index.js &
    ;;
  stop)
    pkill -f "node server/index.js"
    ;;
  restart)
    $0 stop
    $0 start
    ;;
esac
```

---

## Firewall Configuration

### UFW (Ubuntu)

```bash
sudo ufw allow 3001/tcp  # API
sudo ufw allow 5173/tcp  # Frontend (dev)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

### firewalld (RHEL/CentOS)

```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Windows Firewall

```powershell
New-NetFirewallRule -DisplayName "FlowLogic WMS" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d wms.yourcompany.com

# Certificate files
# /etc/letsencrypt/live/wms.yourcompany.com/fullchain.pem
# /etc/letsencrypt/live/wms.yourcompany.com/privkey.pem
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name wms.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wms.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/wms.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wms.yourcompany.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR=/backups/flowlogic
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U flowlogic flowlogic_wms > $BACKUP_DIR/flowlogic_$DATE.sql
gzip $BACKUP_DIR/flowlogic_$DATE.sql

# Keep 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Add to crontab

```bash
crontab -e
# Add:
0 2 * * * /opt/flowlogic-wms/backup.sh
```

---

## Troubleshooting

### Check Service Status

```bash
# Docker
docker-compose ps
docker-compose logs flowlogic

# Systemd
sudo systemctl status flowlogic
sudo journalctl -u flowlogic -f
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 3001 in use | `lsof -i :3001` then kill process |
| Database connection failed | Check DATABASE_URL in .env |
| Permission denied | `chmod +x start.sh` |
| Module not found | `npm install` |

### Get Help

- Documentation: https://docs.flowlogic.io
- Email: support@flowlogic.io
- GitHub Issues: https://github.com/flowlogic-wms/flowlogic-ui/issues

---

## License

FlowLogic WMS - Enterprise Warehouse Management System
Copyright (c) 2024 FlowLogic Inc.
