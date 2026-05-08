#!/bin/bash
# PesaHari Git-Based Deployment Script
# Run this from your local machine: bash deploy.sh

SERVER_IP="185.181.9.153"
SERVER_USER="root"
APP_PATH="/opt/pesahari"
GIT_REPO="https://github.com/tflight010-dotcom/HARI"
GIT_BRANCH="main"
APP_PORT="3003"

echo "🚀 Deploying PesaHari to $SERVER_IP on port $APP_PORT..."
echo ""

# Step 1: Push to Git
echo "📤 Pushing code to GitHub..."
git add .
git commit -m "Deploy PesaHari - $(date)" || true
git push origin $GIT_BRANCH
echo "✅ Code pushed"
echo ""

# Step 2: Deploy on server
echo "⚙️  Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'REMOTE_CMD'
APP_PATH="/opt/pesahari"
GIT_REPO="https://github.com/tflight010-dotcom/HARI"
GIT_BRANCH="main"
APP_PORT="3003"

echo "📝 Connecting to server..."
mkdir -p $APP_PATH
cd $APP_PATH

# Clone or pull from Git
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin $GIT_BRANCH
else
    echo "📥 Cloning repository..."
    git clone --branch $GIT_BRANCH $GIT_REPO .
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building production app..."
npm run build

# Install PM2 globally if needed
npm list -g pm2 > /dev/null 2>&1 || npm install -g pm2

# Stop and restart with PM2
echo "🔄 Restarting PM2 process..."
pm2 stop pesahari 2>/dev/null || true
pm2 delete pesahari 2>/dev/null || true

# Update .env with correct port
cat > .env << EOF
APP_URL="http://185.181.9.153:3003"
NODE_ENV="production"
PORT=3003
EOF

# Start with PM2
pm2 start server.ts --name "pesahari" --interpreter "npx ts-node"
pm2 save

echo ""
echo "✅ PesaHari is running on port 3003!"
echo ""
pm2 logs pesahari --lines 5

REMOTE_CMD

echo ""
echo "✨ Deployment Complete!"
echo ""
echo "🌐 Your app is now live at:"
echo "   Direct: http://$SERVER_IP:$APP_PORT"
echo "   Create short URL at: https://tinyurl.com"
echo ""
echo "📝 See MULTI_APP_GUIDE.md for managing multiple apps"
