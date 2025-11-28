# 🚂 Railway.app Deployment Guide

## Quick Setup (5 Minutes!)

### **STEP 1: Login to Railway**
1. Buka https://railway.app
2. Klik **"Login"**
3. Pilih **"Login with GitHub"**
4. Authorize Railway

---

### **STEP 2: Create New Project**
1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Select: **`Nanang212/absence-system`**
4. Railway akan auto-detect project structure

---

### **STEP 3: Add PostgreSQL Database**
1. Di project dashboard, klik **"New"**
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. PostgreSQL akan auto-provisioned
4. **Copy DATABASE_URL** (akan muncul di Variables tab)

---

### **STEP 4: Deploy Backend**
1. Klik **"New"** → **"GitHub Repo"**
2. Select repo: **`absence-system`**
3. **Root Directory**: Set ke `/absence-backend`
4. Railway auto-detect Dockerfile
5. Klik **"Add Variables"**:

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3000
APP_SECRET=<generate-random-string-32-chars>
REMOTE_BASE_URL=https://mii-jasamarga.peoplehr.net
REMOTE_LOGIN_PATH=/Pages/Login.aspx
REMOTE_MANUAL_SWIPE_PATH=/Employee/Pages/ManualSwipe.aspx
REMOTE_SHIFT_CODE=EMJM2
TELEGRAM_BOT_TOKEN=8364246819:AAGKlUkEi91xFZ9tE6Rx6XdTl7tZYDKFf30
TELEGRAM_CHAT_ID=-4752311659
WHATSAPP_GROUP_NAME=Absensi MII Jasamarga
```

6. Klik **"Deploy"**

**Generate APP_SECRET:**
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

---

### **STEP 5: Deploy Frontend**
1. Klik **"New"** → **"GitHub Repo"** lagi
2. Select repo: **`absence-system`**
3. **Root Directory**: Set ke `/absence-frontend`
4. Klik **"Add Variables"**:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL.railway.app
```

**Note:** Ganti `YOUR_BACKEND_URL` dengan URL backend yang sudah deploy (step 4)

5. Klik **"Deploy"**

---

### **STEP 6: Get Service URLs**
1. **Backend URL**: Klik service backend → tab **"Settings"** → **"Generate Domain"**
   - Contoh: `absence-backend-production.up.railway.app`
2. **Frontend URL**: Klik service frontend → tab **"Settings"** → **"Generate Domain"**
   - Contoh: `absence-frontend-production.up.railway.app`

**IMPORTANT:** Update frontend `NEXT_PUBLIC_API_URL` dengan backend URL!

---

### **STEP 7: Redeploy Frontend dengan Backend URL**
1. Klik service **frontend**
2. Tab **"Variables"** → Edit `NEXT_PUBLIC_API_URL`
3. Ganti dengan: `https://absence-backend-production.up.railway.app`
4. Klik **"Redeploy"**

---

### **STEP 8: Check Logs & WhatsApp Setup**
1. Klik service **backend**
2. Tab **"Deployments"** → Klik latest deployment → **"View Logs"**
3. **Cari QR Code** untuk WhatsApp (akan muncul di logs)
4. **Scan QR code** dengan WhatsApp (Linked Devices)

**Note:** QR code mungkin agak susah di-scan dari logs. Alternatif:
- Screenshot logs yang ada QR code
- Atau tunggu sampai aplikasi jalan, QR akan muncul saat backend start

---

### **STEP 9: Test Application**
1. Buka frontend URL: `https://absence-frontend-production.up.railway.app`
2. Test login dengan PeopleHR
3. Test Clock In/Out
4. Check Telegram & WhatsApp notifications

---

## 📊 Railway Dashboard Overview

```
Project: absence-system
├── PostgreSQL Database
│   └── DATABASE_URL: postgres://user:pass@host:port/db
├── Backend Service (absence-backend)
│   ├── Dockerfile: absence-backend/Dockerfile
│   └── URL: https://absence-backend-xxx.railway.app
└── Frontend Service (absence-frontend)
    ├── Dockerfile: absence-frontend/Dockerfile
    └── URL: https://absence-frontend-xxx.railway.app
```

---

## 💰 Cost Estimate

**Railway Free Trial:**
- $5 credit per month
- Pay only for usage above $5

**Typical Usage (Small App):**
- **Backend**: ~$2-3/month (512MB RAM, low traffic)
- **Frontend**: ~$1-2/month (static serving)
- **PostgreSQL**: ~$1-2/month (small database)
- **Total**: ~$4-7/month

**Tips untuk tetap di bawah $5:**
- Backend sleep setelah 1 jam idle (bisa diatur)
- Pakai 1 worker saja (default)
- Database optimized queries

---

## 🔧 Troubleshooting

### Backend tidak bisa connect ke Database
```bash
# Check DATABASE_URL variable
# Pastikan format: postgresql://user:pass@host:port/dbname
```

### Frontend tidak bisa hit backend
```bash
# Check NEXT_PUBLIC_API_URL
# Harus pakai HTTPS (Railway auto-provides SSL)
# Format: https://backend-service.railway.app
```

### WhatsApp QR Code tidak muncul
```bash
# Check backend logs
# QR code muncul saat WhatsApp service initialize
# Scroll logs ke paling bawah
```

### Build failed
```bash
# Check build logs di "Deployments" tab
# Pastikan Dockerfile path benar
# Pastikan root directory benar (/absence-backend atau /absence-frontend)
```

---

## 🚀 Auto-Deploy from GitHub

**Railway sudah auto-setup CI/CD!**

Setiap kali push ke GitHub main branch:
1. Railway auto-detect changes
2. Rebuild affected services
3. Auto-deploy baru

**Test:**
```bash
# Di local
git add .
git commit -m "Update feature"
git push origin main

# Railway akan auto-deploy!
```

---

## 📝 Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3000
APP_SECRET=<32-char-random-string>
REMOTE_BASE_URL=https://mii-jasamarga.peoplehr.net
REMOTE_LOGIN_PATH=/Pages/Login.aspx
REMOTE_MANUAL_SWIPE_PATH=/Employee/Pages/ManualSwipe.aspx
REMOTE_SHIFT_CODE=EMJM2
TELEGRAM_BOT_TOKEN=8364246819:AAGKlUkEi91xFZ9tE6Rx6XdTl7tZYDKFf30
TELEGRAM_CHAT_ID=-4752311659
WHATSAPP_GROUP_NAME=Absensi MII Jasamarga
```

### Frontend (.env)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL.railway.app
```

---

## 🎯 Next Steps

1. ✅ Login ke Railway
2. ✅ Create project from GitHub
3. ✅ Add PostgreSQL
4. ✅ Deploy backend
5. ✅ Deploy frontend
6. ✅ Setup WhatsApp QR
7. ✅ Test aplikasi
8. 🎉 **PRODUCTION READY!**

---

## 💡 Tips

- **Custom Domain**: Railway support custom domain (gratis!)
- **Monitoring**: Railway punya built-in metrics
- **Logs**: Real-time logs di dashboard
- **Rollback**: Bisa rollback ke deployment sebelumnya
- **Scaling**: Bisa scale up/down RAM & CPU

Good luck! 🚀
