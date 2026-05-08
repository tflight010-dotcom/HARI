# PesaHari - Ubuntu Server Deployment Guide

**Server IP:** 185.181.9.153  
**Port:** 3000  
**Access URL:** http://185.181.9.153:3000

---

## Step 1: Build Production Bundle (Local Machine)

```bash
cd c:\Users\Administrator\Documents\HARI
npm run build
npm run clean  # Optional: remove old builds
npm run build  # Creates dist/ folder
```

This generates a production build in the `dist/` folder.

---

## Step 2: Upload to Ubuntu Server

### Option A: Using SCP (Recommended)
```bash
# From your local machine, upload the dist folder
scp -r dist root@185.181.9.153:/opt/pesahari/dist
scp package.json root@185.181.9.153:/opt/pesahari/
scp package-lock.json root@185.181.9.153:/opt/pesahari/
scp server.ts root@185.181.9.153:/opt/pesahari/
scp tsconfig.json root@185.181.9.153:/opt/pesahari/
scp .env root@185.181.9.153:/opt/pesahari/
```

### Option B: Using Git
```bash
# Push to GitHub, then clone on server
git push origin main

# On Ubuntu server:
cd /opt/pesahari
git clone https://github.com/YOUR_REPO pesahari
cd pesahari
npm install
npm run build
```

---

## Step 3: Setup Ubuntu Server

SSH into your server:
```bash
ssh root@185.181.9.153
```

### Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
node --version  # Should be v20+
```

### Create App Directory
```bash
mkdir -p /opt/pesahari
cd /opt/pesahari
```

### Install Dependencies
```bash
npm install
```

### Copy .env (if uploaded separately)
```bash
cat > .env << EOF
APP_URL="http://185.181.9.153:3000"
NODE_ENV="production"
PORT=3000
EOF
```

---

## Step 4: Install & Configure PM2 (Process Manager)

PM2 keeps your app running 24/7 and auto-restarts on crashes.

```bash
npm install -g pm2

# Start the app with PM2
pm2 start server.ts --name "pesahari" --interpreter "npx ts-node" --max-memory-restart 1G

# Make it auto-start on reboot
pm2 startup
pm2 save

# Monitor the app
pm2 monitor
pm2 logs pesahari
```

---

## Step 5: Setup Firewall & Port Forwarding

### Open Port 3000
```bash
ufw allow 3000/tcp
ufw enable
ufw status
```

### (Optional) Setup Nginx Reverse Proxy for Port 80
```bash
apt-get install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/pesahari << 'EOF'
server {
    listen 80;
    server_name 185.181.9.153;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/pesahari /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Then access via: **http://185.181.9.153** (no :3000 needed)

---

## Step 6: Update Firebase Console

1. Go to https://console.firebase.google.com
2. Select project: **linen-nebula-484600-h0**
3. **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `185.181.9.153`
   - `localhost` (for local testing)
   - `127.0.0.1`

---

## Step 7: Create Short URL

Use any of these free URL shorteners to share your app:

### Option 1: TinyURL
```
https://tinyurl.com/create.php?alias=pesahari&url=http://185.181.9.153:3000
```
Result: `https://tinyurl.com/pesahari`

### Option 2: Bit.ly
- Go to https://bitly.com
- Paste: `http://185.181.9.153:3000`
- Get short link

### Option 3: is.gd (No signup needed)
```
https://is.gd/create.php?format=json&url=http://185.181.9.153:3000
```

### Option 4: DuckDuckGo's Redirect
```
https://duck.co/?q=185.181.9.153:3000
```

---

## Useful Commands

```bash
# View logs in real-time
pm2 logs pesahari

# Restart the app
pm2 restart pesahari

# Stop the app
pm2 stop pesahari

# View CPU/Memory usage
pm2 monit

# Delete PM2 process
pm2 delete pesahari

# SSH into server and check status
ssh root@185.181.9.153
curl http://localhost:3000
```

---

## Troubleshooting

### App won't start
```bash
pm2 logs pesahari
# Check for errors in the log output
```

### Firebase auth not working
- Make sure `185.181.9.153` is added to Firebase authorized domains
- Wait 5 minutes for changes to propagate
- Clear browser cache and try again

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env and restart PM2
pm2 restart pesahari
```

### Performance is slow
```bash
# Check server resources
free -h
df -h
top

# Increase Node memory if needed
pm2 start server.ts --max-old-space-size=4096 --name "pesahari"
```

---

## Final URL Format

Share this with users:
```
Short URL: https://tinyurl.com/pesahari
Direct: http://185.181.9.153:3000
```

✅ Your app is now live on the internet!
