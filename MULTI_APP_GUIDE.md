# Multi-App Management Guide
**Ubuntu Server: 185.181.9.153**

Your server is running multiple React apps on different ports. Here's how to manage them all with PM2.

---

## 📊 Apps Running on Server

| App | Port | Process Name | Status |
|-----|------|--------------|--------|
| **App 1** | 3001 | `app1` | ✅ Running |
| **App 2** | 3002 | `app2` | ✅ Running |
| **PesaHari** | 3003 | `pesahari` | 🚀 New |

---

## 🔧 PM2 Commands for All Apps

### View All Running Apps
```bash
ssh root@185.181.9.153

# List all PM2 processes
pm2 list

# Monitor in real-time
pm2 monit

# View with detailed info
pm2 info pesahari
```

### Control Individual Apps
```bash
# Restart specific app
pm2 restart pesahari

# Stop specific app
pm2 stop pesahari
pm2 stop app1

# Restart all apps
pm2 restart all

# View logs
pm2 logs pesahari
pm2 logs app1

# See last 20 lines
pm2 logs pesahari --lines 20

# Tail in real-time
pm2 logs pesahari --follow
```

### Start Apps Automatically on Reboot
```bash
pm2 startup
pm2 save
```

---

## 🌐 Accessing Your Apps

```
http://185.181.9.153:3001  → App 1
http://185.181.9.153:3002  → App 2
http://185.181.9.153:3003  → PesaHari
```

### With URL Shorteners (Share Your App)
Create short links at:
- **TinyURL:** https://tinyurl.com/create.php?url=http://185.181.9.153:3003
- **Bit.ly:** https://bitly.com
- **is.gd:** https://is.gd/create.php

---

## 🚀 Deploy/Update PesaHari

From your local machine:
```bash
cd c:\Users\Administrator\Documents\HARI

# Make sure you have your .env updated with port 3003
# Then run the deployment script
bash deploy.sh
```

Or manually on server:
```bash
ssh root@185.181.9.153
cd /opt/pesahari
git pull origin main
npm install
npm run build
pm2 restart pesahari
```

---

## 🛠️ Nginx Reverse Proxy Setup (Optional)

To access all apps without port numbers:
```bash
http://185.181.9.153/app1
http://185.181.9.153/app2
http://185.181.9.153/pesahari
```

Create Nginx config:
```bash
sudo cat > /etc/nginx/sites-available/multiapp << 'EOF'
upstream app1_backend {
    server localhost:3001;
}

upstream app2_backend {
    server localhost:3002;
}

upstream pesahari_backend {
    server localhost:3003;
}

server {
    listen 80;
    server_name 185.181.9.153;

    location /app1 {
        proxy_pass http://app1_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /app2 {
        proxy_pass http://app2_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /pesahari {
        proxy_pass http://pesahari_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/multiapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3003
lsof -i :3003

# Kill the process
kill -9 <PID>

# Or just restart PM2
pm2 restart pesahari
```

### App Not Starting
```bash
# Check logs
pm2 logs pesahari --err

# Manually test
cd /opt/pesahari
npm run start
```

### Firebase Auth Error
- Add `185.181.9.153` to **Firebase Console** → **Authentication** → **Authorized domains**
- Wait 5 minutes for propagation
- Refresh browser

### Memory Issues
```bash
# Check memory usage
free -h

# If low, restart all apps
pm2 restart all

# Or configure max memory
pm2 start server.ts --name pesahari --max-memory-restart 512M
```

---

## 📋 Deployment Checklist

- [ ] Code committed to GitHub
- [ ] `.env` has correct port (3003)
- [ ] Firebase authorized domains updated
- [ ] Run `bash deploy.sh` from local machine
- [ ] Verify app at `http://185.181.9.153:3003`
- [ ] Create short URL link
- [ ] Check `pm2 logs pesahari` for errors

---

## 💡 Quick Commands

```bash
# SSH into server
ssh root@185.181.9.153

# View all PM2 processes
pm2 list

# Tail PesaHari logs
pm2 logs pesahari

# Restart all apps
pm2 restart all

# Stop PesaHari
pm2 stop pesahari

# Delete PesaHari from PM2
pm2 delete pesahari
```

---

## 📞 Support

If apps crash or don't start:
1. Check logs: `pm2 logs pesahari`
2. Check port availability: `lsof -i :3003`
3. SSH and manually start: `cd /opt/pesahari && npm run start`
4. Check Firebase config in `firebase-applet-config.json`

Good luck with PesaHari! 🚀
