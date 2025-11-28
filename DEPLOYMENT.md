# Oracle Cloud VPS Deployment Guide

## 📋 Prerequisites
- Oracle Cloud Account (gratis selamanya untuk Always Free tier)
- Domain (opsional, bisa pakai IP dulu)
- SSH client (Git Bash sudah ada)

---

## 🚀 Step-by-Step Deployment

### **STEP 1: Setup Oracle Cloud VPS**

#### 1.1 Create Oracle Cloud Account
```
1. Buka https://cloud.oracle.com
2. Sign up (butuh kartu kredit/debit untuk verifikasi, tapi ga akan dicharge)
3. Pilih region terdekat (Singapore/Tokyo)
```

#### 1.2 Create VM Instance (Always Free Eligible)
```
1. Menu: Compute → Instances → Create Instance
2. Name: absence-system
3. Image: Ubuntu 22.04 (Always Free Eligible)
4. Shape: VM.Standard.E2.1.Micro (Always Free - 1 OCPU, 1GB RAM)
5. Networking: Create new VCN (default OK)
6. SSH Keys: Generate new key pair → Download private key (.key file)
7. Create!
```

#### 1.3 Note Your Public IP
```
Setelah instance running, catat Public IP Address
Contoh: 123.45.67.89
```

#### 1.4 Configure Security List (Firewall)
```
1. Instance Details → Subnet → Security List
2. Add Ingress Rules:
   - Port 22 (SSH): 0.0.0.0/0
   - Port 80 (HTTP): 0.0.0.0/0
   - Port 443 (HTTPS): 0.0.0.0/0
```

---

### **STEP 2: Connect to VPS via SSH**

#### 2.1 Setup SSH Key (Windows Git Bash)
```bash
# Copy private key ke .ssh folder
mkdir -p ~/.ssh
cp /path/to/downloaded-key.key ~/.ssh/oracle-absence.key
chmod 600 ~/.ssh/oracle-absence.key

# Connect to VPS
ssh -i ~/.ssh/oracle-absence.key ubuntu@YOUR_PUBLIC_IP
```

---

### **STEP 3: Install Docker & Docker Compose**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout dan login lagi (agar docker group aktif)
exit
ssh -i ~/.ssh/oracle-absence.key ubuntu@YOUR_PUBLIC_IP

# Verify installation
docker --version
docker-compose --version
```

---

### **STEP 4: Upload Project to VPS**

#### Option A: Via Git (Recommended)
```bash
# Di VPS
cd ~
git clone https://github.com/YOUR_USERNAME/absence-system.git
cd absence-system
```

#### Option B: Via SCP (dari local)
```bash
# Di local Git Bash
cd /c/Users/nanang.sutahar/Documents/PRJ-PRIBADI
scp -i ~/.ssh/oracle-absence.key -r absence-system ubuntu@YOUR_PUBLIC_IP:~/
```

---

### **STEP 5: Configure Environment Variables**

```bash
# Di VPS, masuk ke project folder
cd ~/absence-system

# Copy dan edit .env.production
cp .env.production .env
nano .env

# Edit values:
# - DB_PASSWORD (ganti dengan password kuat)
# - APP_SECRET (generate random string)
# - Sisanya sudah OK (TELEGRAM_BOT_TOKEN, dll)

# Save: Ctrl+O, Enter, Ctrl+X
```

Generate APP_SECRET:
```bash
openssl rand -base64 32
```

---

### **STEP 6: Configure Nginx (Domain Setup)**

#### Jika punya domain:
```bash
nano nginx/nginx.conf

# Ganti semua "your-domain.com" dengan domain kamu
# Contoh: absence.nanang.dev
```

#### Jika belum punya domain (pakai IP):
```bash
nano nginx/nginx.conf

# Ganti:
# server_name your-domain.com www.your-domain.com;
# Jadi:
# server_name YOUR_PUBLIC_IP;

# Dan comment out SSL lines (line 42-44):
# # ssl_certificate /etc/nginx/ssl/live/your-domain.com/fullchain.pem;
# # ssl_certificate_key /etc/nginx/ssl/live/your-domain.com/privkey.pem;
```

---

### **STEP 7: Build & Run with Docker Compose**

```bash
# Build semua containers
docker-compose build

# Start semua services
docker-compose up -d

# Check status
docker-compose ps

# Check logs
docker-compose logs -f

# Jika ada error, check individual service logs:
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

---

### **STEP 8: Setup SSL Certificate (Jika Punya Domain)**

#### 8.1 Point Domain to VPS IP
```
Di DNS provider (Cloudflare, Namecheap, dll):
A Record: @ → YOUR_PUBLIC_IP
A Record: www → YOUR_PUBLIC_IP
```

#### 8.2 Get SSL Certificate
```bash
# Stop nginx sementara
docker-compose stop nginx

# Generate SSL certificate
docker-compose run --rm certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Restart nginx
docker-compose up -d nginx
```

#### 8.3 Auto-renewal sudah disetup di docker-compose.yml
```
Certbot container akan auto-renew setiap 12 jam
```

---

### **STEP 9: Setup WhatsApp QR Code**

```bash
# Check backend logs untuk QR code
docker-compose logs -f backend

# Scan QR code dengan WhatsApp (klik 3 titik → Linked Devices)
# QR code akan muncul di logs

# WhatsApp session akan tersimpan di volume "whatsapp_session"
```

---

### **STEP 10: Test Application**

#### Via Browser:
```
HTTP: http://YOUR_PUBLIC_IP
HTTPS: https://your-domain.com (jika sudah setup SSL)

Frontend: Port 80/443 (via Nginx)
Backend API: http://YOUR_PUBLIC_IP/api/
```

#### Test Login:
```
1. Buka aplikasi
2. Login dengan email PeopleHR
3. Test Clock In (cek notif Telegram & WhatsApp)
4. Test Clock Out
```

---

## 🔧 Maintenance Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Application
```bash
# Pull latest code (jika pakai Git)
git pull

# Rebuild dan restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Backup
```bash
# Backup database
docker exec absence-postgres pg_dump -U postgres absence > backup-$(date +%Y%m%d).sql

# Restore database
docker exec -i absence-postgres psql -U postgres absence < backup-20250128.sql
```

### Stop All Services
```bash
docker-compose down

# Stop dan hapus volumes (HATI-HATI: Data hilang!)
docker-compose down -v
```

### Check Resource Usage
```bash
# Disk usage
df -h

# Docker disk usage
docker system df

# Container resources
docker stats
```

---

## 🔒 Security Best Practices

### 1. Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 2. Fail2Ban (Protect SSH)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Update System Regularly
```bash
sudo apt update && sudo apt upgrade -y
```

### 4. Change Default SSH Port (Optional)
```bash
sudo nano /etc/ssh/sshd_config
# Ganti Port 22 jadi Port 2222
sudo systemctl restart sshd

# Jangan lupa update Security List di Oracle Cloud!
```

---

## 💰 Cost Estimate

### Oracle Cloud Always Free Tier:
- **VM Instance**: FREE (VM.Standard.E2.1.Micro)
- **Storage**: FREE (47 GB Block Volume)
- **Bandwidth**: FREE (10 TB/month)
- **Public IP**: FREE (2 public IPs)

### Total Cost: **$0/month** 🎉

---

## 🚨 Troubleshooting

### Backend tidak konek ke database:
```bash
# Check database running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec -it absence-postgres psql -U postgres -d absence
```

### Frontend tidak bisa akses backend:
```bash
# Check NEXT_PUBLIC_API_URL di docker-compose.yml
# Harus: http://backend:3000 (internal Docker network)

# Rebuild frontend
docker-compose up -d --build frontend
```

### WhatsApp tidak kirim pesan:
```bash
# Check backend logs
docker-compose logs -f backend

# Scan QR code lagi jika session expired
docker-compose restart backend
docker-compose logs -f backend
```

### Port sudah digunakan:
```bash
# Check port yang digunakan
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill process
sudo kill -9 PID
```

### Out of disk space:
```bash
# Clean Docker
docker system prune -a

# Clean old logs
docker-compose logs --tail=0 -f
```

---

## 📚 Next Steps

1. **Setup Monitoring**: Install Uptime Kuma / Grafana
2. **Setup Backup**: Cron job untuk backup database
3. **Setup CI/CD**: Auto-deploy dari GitHub
4. **Custom Domain**: Beli domain dan setup SSL
5. **Scaling**: Upgrade VM shape jika perlu

---

## 📞 Support

Jika ada masalah:
1. Check logs: `docker-compose logs -f`
2. Check status: `docker-compose ps`
3. Restart service: `docker-compose restart SERVICE_NAME`
4. Google error message 😅

Good luck! 🚀
