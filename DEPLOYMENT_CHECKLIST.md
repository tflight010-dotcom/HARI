# 🚀 PesaHari Deployment Checklist

## Before Deploying

### Step 1: Prepare Local Machine ✅
- [x] App built successfully (`npm run build`)
- [x] `.env` updated with port 3003
- [x] All changes committed locally

### Step 2: Push to GitHub
```bash
# From c:\Users\Administrator\Documents\HARI
git add .
git commit -m "Deploy PesaHari to port 3003"
git push origin main
```

**Verify:** Check https://github.com/tflight010-dotcom/HARI for your latest code

### Step 3: Deploy to Server
```bash
# Still in c:\Users\Administrator\Documents\HARI
bash deploy.sh
```

The script will:
- ✅ Push latest code to GitHub
- ✅ SSH into server (185.181.9.153)
- ✅ Clone/pull from GitHub
- ✅ Install dependencies
- ✅ Build production app
- ✅ Start with PM2 on port 3003

### Step 4: Verify Deployment
```bash
# Wait 10 seconds for app to start, then open:
http://185.181.9.153:3003
```

---

## 🔧 Server Configuration

**Port:** 3003 (alongside your existing App1:3001 and App2:3002)  
**Process Name:** pesahari  
**Git Repo:** https://github.com/tflight010-dotcom/HARI  
**App Path:** /opt/pesahari

---

## ⚠️ Firebase Configuration

Before testing, add server IP to Firebase:

1. Open https://console.firebase.google.com
2. Select **linen-nebula-484600-h0**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add:
   - ✅ `185.181.9.153`
   - ✅ `localhost` (for local testing)
   - ✅ `127.0.0.1`

---

## 🌐 Share Your App

After deployment, create a short URL:

**TinyURL Method:**
```
1. Go to https://tinyurl.com/create.php
2. Paste: http://185.181.9.153:3003
3. Choose custom alias: pesahari (or any name)
4. Get: https://tinyurl.com/pesahari
```

**Alternative (No Account):**
```
https://is.gd/create.php?url=http://185.181.9.153:3003
```

---

## 📱 Testing the App

### On Your Machine (Local Testing)
```
http://localhost:3000
```

### On Server with Direct IP
```
http://185.181.9.153:3003
```

### With Short URL
```
https://tinyurl.com/pesahari  (or your chosen shortener)
```

---

## 🛠️ Troubleshooting

### Deployment Script Won't Run
```bash
# Make script executable (Windows Git Bash)
chmod +x deploy.sh
bash deploy.sh
```

### SSH Connection Fails
```bash
# Test SSH connection
ssh root@185.181.9.153

# If password required, use:
ssh -i "C:\path\to\private\key" root@185.181.9.153
```

### App Not Starting After Deployment
```bash
# SSH to server and check logs
ssh root@185.181.9.153
pm2 logs pesahari

# Or check if port is already used
lsof -i :3003
```

### Firebase Auth Error: "unauthorized-domain"
- Make sure `185.181.9.153` is in Firebase authorized domains
- Wait 5 minutes for changes to propagate
- Clear browser cache and refresh

---

## 📊 Post-Deployment Monitoring

### View All Apps on Server
```bash
ssh root@185.181.9.153
pm2 list
```

### Watch App Logs
```bash
pm2 logs pesahari --follow
```

### Check Performance
```bash
pm2 monit
```

---

## 🔄 Update Existing Deployment

To push new changes:
```bash
# From your local machine
git add .
git commit -m "Update PesaHari"
git push origin main
bash deploy.sh
```

The script will pull the latest code and restart the app automatically.

---

## ✨ Success Indicators

- ✅ `bash deploy.sh` completes without errors
- ✅ `pm2 list` shows `pesahari` with status "online"
- ✅ `http://185.181.9.153:3003` loads without 404
- ✅ Google Sign-in button works (after Firebase config)
- ✅ Logs show "Server running on http://0.0.0.0:3003"

---

## 📝 Next Steps

1. **Push code to GitHub** → `git push origin main`
2. **Run deployment** → `bash deploy.sh`
3. **Add Firebase domain** → 185.181.9.153 in Firebase console
4. **Test at** → http://185.181.9.153:3003
5. **Create short URL** → https://tinyurl.com (paste your IP)
6. **Share with users!** → Send short link

---

**Total deployment time:** ~5-10 minutes ⏱️

Good luck! 🎉
