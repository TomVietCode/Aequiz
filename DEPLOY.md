# Hướng dẫn Deploy Exam Practice lên DigitalOcean Droplet

## 📋 Mục lục
1. [Thông số cấu hình Droplet](#thông-số-cấu-hình-droplet)
2. [Chuẩn bị](#chuẩn-bị)
3. [Đẩy code lên GitHub](#đẩy-code-lên-github)
4. [Tạo và cấu hình Droplet](#tạo-và-cấu-hình-droplet)
5. [Cài đặt môi trường](#cài-đặt-môi-trường)
6. [Deploy ứng dụng](#deploy-ứng-dụng)
7. [Cấu hình Domain và SSL](#cấu-hình-domain-và-ssl)
8. [Thiết lập CI/CD (Optional)](#thiết-lập-cicd-optional)
9. [Monitoring và Maintenance](#monitoring-và-maintenance)

---

## 🖥️ Thông số cấu hình Droplet

### Cấu hình khuyến nghị theo mức độ sử dụng:

#### **Development/Testing (Cơ bản)**
- **Plan**: Basic Droplet
- **CPU**: 1 vCPU (Regular Intel)
- **RAM**: 1 GB
- **Storage**: 25 GB SSD
- **Transfer**: 1 TB
- **Giá**: ~$6/tháng
- **Phù hợp**: 10-50 người dùng đồng thời, database nhỏ (< 100MB)

#### **Production (Khuyến nghị)** ⭐
- **Plan**: Basic Droplet
- **CPU**: 2 vCPU (Regular Intel)
- **RAM**: 2 GB
- **Storage**: 50 GB SSD
- **Transfer**: 2 TB
- **Giá**: ~$12/tháng
- **Phù hợp**: 50-200 người dùng đồng thời, database trung bình (< 500MB)

#### **Production (Cao cấp)**
- **Plan**: Basic Droplet
- **CPU**: 2 vCPU (Premium Intel)
- **RAM**: 4 GB
- **Storage**: 80 GB SSD
- **Transfer**: 4 TB
- **Giá**: ~$24/tháng
- **Phù hợp**: 200-500 người dùng đồng thời, database lớn (> 500MB)

### Cấu hình bổ sung:
- **Operating System**: Ubuntu 22.04 LTS (khuyến nghị)
- **Datacenter Region**: Singapore (SEA1) - tốt nhất cho Việt Nam
- **Alternatives**: San Francisco (SFO3), Frankfurt (FRA1)
- **Backup**: Enable automatic backups (+20% chi phí)
- **Monitoring**: Enable (miễn phí)

### Ước tính chi phí hàng tháng:
```
Droplet 2GB RAM:        $12/tháng
Automatic Backups:      $2.40/tháng
Domain (.com):          $1/tháng (amortized)
Total:                  ~$15.40/tháng
```

---

## 🔧 Chuẩn bị

### 1. Tài khoản cần thiết
- Tài khoản DigitalOcean (có thể dùng GitHub Education để nhận $200 credit)
- Tài khoản GitHub (miễn phí)
- Domain name (optional, có thể dùng IP)

### 2. Công cụ cần cài đặt trên máy local
```bash
# Git
winget install Git.Git

# SSH Client (Windows đã có sẵn OpenSSH)
# Hoặc dùng PuTTY nếu muốn
```

---

## 📦 Đẩy code lên GitHub

### Bước 1: Tạo repository trên GitHub
1. Truy cập https://github.com/new
2. Tạo repository mới:
   - Repository name: `exam-practice`
   - Visibility: Private (khuyến nghị) hoặc Public
   - **Không** chọn "Initialize this repository with a README"
3. Click "Create repository"

### Bước 2: Tạo file .gitignore
Tạo file `.gitignore` ở thư mục root project:

```bash
# Node modules
node_modules/
**/node_modules/

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
**/dist/
**/build/

# Database
*.db
*.db-journal
uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
logs/

# Testing
coverage/

# Prisma
prisma/dev.db
```

### Bước 3: Khởi tạo Git và push code
```bash
# Di chuyển vào thư mục project
cd d:\Workspace\sources\exam-practice

# Khởi tạo git repository
git init

# Thêm tất cả file
git add .

# Commit lần đầu
git commit -m "Initial commit: Exam Practice Application"

# Thêm remote repository (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/exam-practice.git

# Đổi branch sang main
git branch -M main

# Push code lên GitHub
git push -u origin main
```

> **Lưu ý**: Nếu bị yêu cầu đăng nhập, dùng Personal Access Token thay vì password:
> 1. Vào GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
> 2. Generate new token với quyền `repo`
> 3. Dùng token này làm password khi push

---

## 🌊 Tạo và cấu hình Droplet

### Bước 1: Tạo Droplet
1. Đăng nhập vào DigitalOcean
2. Click **Create** → **Droplets**
3. Chọn cấu hình:
   - **Region**: Singapore (SEA1)
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Size**: Basic - 2 GB RAM / 2 vCPUs ($12/month)
   - **Authentication**: SSH Key (khuyến nghị) hoặc Password

#### Tạo SSH Key (nếu chọn SSH authentication):
```powershell
# Trên Windows PowerShell
ssh-keygen -t ed25519 -C "your_email@example.com"

# Nhấn Enter để lưu vào location mặc định
# Nhập passphrase (optional)

# Xem public key
cat ~/.ssh/id_ed25519.pub

# Copy nội dung và paste vào DigitalOcean
```

4. **Hostname**: exam-practice-prod
5. **Tags**: production, exam-practice
6. **Backups**: Enable (recommended)
7. Click **Create Droplet**

### Bước 2: Kết nối SSH vào Droplet
```bash
# Lấy IP của Droplet từ DigitalOcean dashboard
# Thay YOUR_DROPLET_IP bằng IP thực tế

ssh root@YOUR_DROPLET_IP

# Nếu dùng password, nhập password đã tạo
# Nếu dùng SSH key, sẽ tự động đăng nhập
```

---

## ⚙️ Cài đặt môi trường

### Bước 1: Update hệ thống
```bash
# Update package list
apt update

# Upgrade packages
apt upgrade -y

# Install essential tools
apt install -y curl git build-essential
```

### Bước 2: Cài đặt Node.js
```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Bước 3: Cài đặt PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Bước 4: Cài đặt Nginx (Web Server)
```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx

# Allow Nginx through firewall
ufw allow 'Nginx Full'
ufw enable
```

### Bước 5: Tạo user cho ứng dụng (Best practice)
```bash
# Tạo user không có quyền root để chạy ứng dụng
adduser examapp

# Thêm user vào sudo group (optional)
usermod -aG sudo examapp

# Switch sang user mới
su - examapp
```

---

## 🚀 Deploy ứng dụng

### Bước 1: Clone code từ GitHub
```bash
# Ở home directory của user examapp
cd ~

# Clone repository (thay YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/exam-practice.git

# Di chuyển vào thư mục project
cd exam-practice
```

> **Nếu repository là private**, cần tạo Personal Access Token:
> ```bash
> git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/exam-practice.git
> ```

### Bước 2: Setup Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Install dependencies
npm install

# Tạo file .env
nano .env
```

**Nội dung file `.env` cho production:**
```env
# Database
DATABASE_URL="file:./prisma/prod.db"

# JWT Secret (Generate một chuỗi random mạnh)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Config
PORT=5000
NODE_ENV=production

# CORS Origin (thay YOUR_DROPLET_IP hoặc domain)
CORS_ORIGIN=http://YOUR_DROPLET_IP
```

> **Tạo JWT_SECRET mạnh:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build backend
npm run build

# Kiểm tra thử
node dist/server.js
# Nhấn Ctrl+C để dừng
```

### Bước 3: Setup Frontend

```bash
# Quay về thư mục root
cd ~/exam-practice/frontend

# Install dependencies
npm install

# Tạo file .env cho production
nano .env.production
```

**Nội dung file `.env.production`:**
```env
# API URL (thay YOUR_DROPLET_IP hoặc domain)
VITE_API_URL=http://YOUR_DROPLET_IP:5000/api
```

```bash
# Build frontend
npm run build

# Frontend build sẽ nằm trong thư mục dist/
```

### Bước 4: Cấu hình PM2 để chạy Backend

```bash
# Quay về thư mục backend
cd ~/exam-practice/backend

# Tạo file ecosystem config cho PM2
nano ecosystem.config.js
```

**Nội dung file `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'exam-practice-api',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Tạo thư mục logs
mkdir -p logs

# Start backend với PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs exam-practice-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy và chạy command được hiển thị
```

### Bước 5: Cấu hình Nginx

```bash
# Switch về root user
exit  # Exit từ examapp user
```

Tạo Nginx config:
```bash
nano /etc/nginx/sites-available/exam-practice
```

**Nội dung file config:**
```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;  # Hoặc your-domain.com

    # Frontend - Serve static files
    location / {
        root /home/examapp/exam-practice/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Reverse proxy
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logging
    access_log /var/log/nginx/exam-practice-access.log;
    error_log /var/log/nginx/exam-practice-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/exam-practice /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Bước 6: Kiểm tra ứng dụng
```bash
# Mở browser và truy cập
http://YOUR_DROPLET_IP

# Kiểm tra backend API
curl http://YOUR_DROPLET_IP/api/health
```

---

## 🔒 Cấu hình Domain và SSL

### Bước 1: Trỏ Domain về Droplet

1. Vào DNS management của domain provider (Namecheap, GoDaddy, Cloudflare...)
2. Thêm A Record:
   - **Type**: A
   - **Name**: @ (hoặc subdomain như `exam`)
   - **Value**: YOUR_DROPLET_IP
   - **TTL**: 3600 (1 hour)

3. Thêm CNAME Record cho www (optional):
   - **Type**: CNAME
   - **Name**: www
   - **Value**: your-domain.com
   - **TTL**: 3600

4. Đợi DNS propagate (5-60 phút)

### Bước 2: Cài đặt SSL với Let's Encrypt (Certbot)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Nhập email
# Agree to terms
# Chọn option 2: Redirect HTTP to HTTPS

# Test auto-renewal
certbot renew --dry-run

# Certificates sẽ tự động renew bởi systemd timer
```

### Bước 3: Update CORS_ORIGIN trong backend

```bash
# Edit backend .env
su - examapp
cd ~/exam-practice/backend
nano .env
```

**Update:**
```env
CORS_ORIGIN=https://your-domain.com
```

```bash
# Restart backend
pm2 restart exam-practice-api
```

### Bước 4: Update Frontend API URL

```bash
cd ~/exam-practice/frontend
nano .env.production
```

**Update:**
```env
VITE_API_URL=https://your-domain.com/api
```

```bash
# Rebuild frontend
npm run build

# Exit về root để restart Nginx
exit
systemctl reload nginx
```

---

## 🔄 Thiết lập CI/CD (Optional)

### Deploy Script tự động

Tạo script để update code dễ dàng:

```bash
# Tạo deploy script
su - examapp
cd ~/exam-practice
nano deploy.sh
```

**Nội dung `deploy.sh`:**
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
echo "📦 Pulling latest code from GitHub..."
git pull origin main

# Backend deployment
echo "🔧 Deploying Backend..."
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart exam-practice-api

# Frontend deployment
echo "🎨 Deploying Frontend..."
cd ../frontend
npm install
npm run build

echo "✅ Deployment completed successfully!"
echo "🌐 Visit: https://your-domain.com"
```

```bash
# Make script executable
chmod +x deploy.sh

# Sử dụng:
./deploy.sh
```

### GitHub Actions (Advanced)

Tạo file `.github/workflows/deploy.yml` trong repository:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Droplet
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.DROPLET_IP }}
        username: examapp
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd ~/exam-practice
          ./deploy.sh
```

**Setup GitHub Secrets:**
1. GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `DROPLET_IP`: IP của droplet
   - `SSH_PRIVATE_KEY`: Private SSH key của user examapp

---

## 📊 Monitoring và Maintenance

### 1. Monitoring với PM2

```bash
# View real-time logs
pm2 logs exam-practice-api

# Monitor CPU/Memory
pm2 monit

# Show app info
pm2 info exam-practice-api
```

### 2. Setup DigitalOcean Monitoring

1. Droplet Dashboard → Monitoring
2. Enable graphs cho:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

3. Setup Alerts:
   - CPU > 80% for 5 minutes
   - Memory > 90% for 5 minutes
   - Disk > 85% usage

### 3. Database Backup

```bash
# Tạo script backup database
nano ~/backup-db.sh
```

**Nội dung script:**
```bash
#!/bin/bash

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH=~/exam-practice/backend/prisma/prod.db

# Create backup directory
mkdir -p $BACKUP_DIR

# Copy database
cp $DB_PATH $BACKUP_DIR/prod_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "prod_*.db" -mtime +7 -delete

echo "Backup completed: prod_$DATE.db"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Setup daily backup with cron
crontab -e

# Add line (backup at 2 AM daily):
0 2 * * * /home/examapp/backup-db.sh
```

### 4. Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/exam-practice
```

**Nội dung:**
```
/home/examapp/exam-practice/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 examapp examapp
    sharedscripts
}
```

### 5. System Updates

```bash
# Update system monthly
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Reboot if kernel updated
sudo reboot
```

### 6. Security Best Practices

```bash
# Change SSH port (optional)
sudo nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222

# Disable root login
# PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd

# Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🆘 Troubleshooting

### Backend không start
```bash
# Check logs
pm2 logs exam-practice-api

# Check if port is in use
sudo lsof -i :5000

# Restart
pm2 restart exam-practice-api
```

### Frontend không load
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/exam-practice-error.log

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database issues
```bash
# Check database file
ls -lh ~/exam-practice/backend/prisma/

# Reset database (⚠️ Cẩn thận!)
cd ~/exam-practice/backend
npx prisma migrate reset

# Re-run migrations
npx prisma migrate deploy
```

### Out of memory
```bash
# Check memory usage
free -h

# Check which process uses memory
top

# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📝 Checklist Deploy

- [ ] Tạo Droplet trên DigitalOcean
- [ ] Cấu hình SSH key
- [ ] Update và upgrade hệ thống
- [ ] Cài đặt Node.js, PM2, Nginx
- [ ] Tạo user `examapp`
- [ ] Push code lên GitHub
- [ ] Clone code vào Droplet
- [ ] Cấu hình `.env` cho backend
- [ ] Cấu hình `.env.production` cho frontend
- [ ] Build backend và frontend
- [ ] Setup PM2 cho backend
- [ ] Cấu hình Nginx
- [ ] Test ứng dụng qua IP
- [ ] Trỏ domain (nếu có)
- [ ] Setup SSL với Certbot
- [ ] Setup backup tự động
- [ ] Setup monitoring và alerts
- [ ] Test CI/CD pipeline

---

## 🎯 Kết luận

Sau khi hoàn thành các bước trên, ứng dụng Exam Practice của bạn đã được deploy thành công lên DigitalOcean Droplet với:

- ✅ Backend API chạy trên PM2
- ✅ Frontend được serve bởi Nginx
- ✅ SSL/HTTPS enabled (nếu có domain)
- ✅ Auto-restart khi server reboot
- ✅ Monitoring và logging
- ✅ Database backup tự động

**URL truy cập:**
- HTTP: `http://YOUR_DROPLET_IP` hoặc `http://your-domain.com`
- HTTPS: `https://your-domain.com` (nếu đã setup SSL)

**Useful Commands:**
```bash
# Backend status
pm2 status

# Backend logs
pm2 logs exam-practice-api

# Nginx status
sudo systemctl status nginx

# Nginx logs
sudo tail -f /var/log/nginx/exam-practice-error.log

# Update application
cd ~/exam-practice && ./deploy.sh
```

---

**Tác giả**: Exam Practice Team  
**Ngày cập nhật**: October 28, 2025  
**Version**: 1.0.0
