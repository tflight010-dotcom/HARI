# Git Workflow: Local → GitHub → Server

## 📋 Overview

```
Your Local Machine (c:\Users\Administrator\Documents\HARI)
         ↓
    (git push)
         ↓
   GitHub Repository
   (https://github.com/tflight010-dotcom/HARI)
         ↓
    (bash deploy.sh pulls from GitHub)
         ↓
Ubuntu Server (185.181.9.153:3003)
```

---

## 🚀 Quick Start Deployment

### Step 1: Make Changes Locally
```bash
cd c:\Users\Administrator\Documents\HARI

# Edit files, test locally
npm run dev
# Test at http://localhost:3000
```

### Step 2: Commit & Push to GitHub
```bash
# Stage all changes
git add .

# Commit with a message
git commit -m "Feature: Add new loan calculator"

# Push to main branch
git push origin main
```

### Step 3: Deploy to Server
```bash
# Run the deployment script (from same directory)
bash deploy.sh
```

This single command will:
- ✅ Push your code to GitHub (if not already pushed)
- ✅ SSH to server
- ✅ Pull latest code from GitHub
- ✅ Install dependencies
- ✅ Build for production
- ✅ Restart on PM2

---

## 🔧 Git Commands Reference

### Check Current Status
```bash
git status
# Shows which files are modified/staged
```

### View Commit History
```bash
git log --oneline
# Shows recent commits
```

### Undo Last Commit (Before Push)
```bash
git reset --soft HEAD~1
# Undoes commit, keeps changes staged
```

### Pull Latest from GitHub (If Others Are Contributing)
```bash
git pull origin main
```

### Create a New Branch (Optional)
```bash
# For experimental features
git checkout -b feature/new-feature

# Later, merge back to main
git checkout main
git merge feature/new-feature
```

---

## 📁 GitHub Repository

**URL:** https://github.com/tflight010-dotcom/HARI  
**Visibility:** Public  
**Default Branch:** `main`

### First Time Setup (If Not Done)
```bash
cd c:\Users\Administrator\Documents\HARI

# Check if Git is initialized
git status

# If needed, initialize Git
git init
git remote add origin https://github.com/tflight010-dotcom/HARI
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 🔐 SSH Keys (If Required)

If you get prompted for credentials on server access:

### Generate SSH Key (Local Machine)
```bash
# Use Git Bash or PowerShell
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter for default location
# Optionally set a passphrase
```

### Add Key to Server
```bash
# Copy public key
cat ~/.ssh/id_ed25519.pub

# Then add to server's ~/.ssh/authorized_keys
ssh root@185.181.9.153
cat >> ~/.ssh/authorized_keys << 'EOF'
[PASTE YOUR PUBLIC KEY HERE]
EOF
```

---

## 📊 Typical Workflow Example

```bash
# 1. Start development
cd c:\Users\Administrator\Documents\HARI
npm run dev

# 2. Make changes to src/App.tsx, test in browser

# 3. Check what changed
git status

# 4. Stage changes
git add .

# 5. Commit with meaningful message
git commit -m "Fix: Resolve KES label overlapping with input field"

# 6. Push to GitHub
git push origin main

# 7. Verify on GitHub (https://github.com/tflight010-dotcom/HARI)

# 8. Deploy to server
bash deploy.sh

# 9. Test at http://185.181.9.153:3003
```

---

## 🚨 Common Issues

### "fatal: not a git repository"
```bash
# Initialize Git in your project
cd c:\Users\Administrator\Documents\HARI
git init
git remote add origin https://github.com/tflight010-dotcom/HARI
```

### "rejected (fetch first)"
```bash
# Pull latest changes first
git pull origin main

# Then push
git push origin main
```

### Accidentally Committed Wrong Files
```bash
# Undo last commit
git reset --soft HEAD~1

# Remove unwanted file
git reset HEAD unwanted_file.txt

# Recommit
git commit -m "New message"
```

### Need to Ignore Files
Create `.gitignore` file:
```
node_modules/
dist/
.env
.DS_Store
```

---

## ✅ Before Each Deployment

- [ ] Run tests locally: `npm run dev`
- [ ] Check git status: `git status`
- [ ] All changes staged: `git add .`
- [ ] Meaningful commit message: `git commit -m "..."`
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Verify on GitHub: Check https://github.com/tflight010-dotcom/HARI
- [ ] Run deploy script: `bash deploy.sh`
- [ ] Test on server: `http://185.181.9.153:3003`

---

## 🔄 Rolling Back to Previous Version

If something breaks on the server:

```bash
# SSH to server
ssh root@185.181.9.153
cd /opt/pesahari

# See commit history
git log --oneline

# Revert to previous commit
git revert HEAD  # Creates a new commit that undoes the last one
# OR
git reset --hard HEAD~1  # Goes back one commit (destructive)

# Rebuild and restart
npm run build
pm2 restart pesahari
```

---

## 📞 Deployment Troubleshooting

| Issue | Solution |
|-------|----------|
| `Permission denied (publickey)` | Add SSH key to server's authorized_keys |
| `fatal: repository not found` | Check GitHub URL is correct |
| `rejected: commit ... (fetch first)` | Run `git pull origin main` first |
| `merge conflict` | Edit conflicting files, then `git add . && git commit` |

---

## 💡 Pro Tips

1. **Commit Often** - Small, focused commits are easier to debug
2. **Meaningful Messages** - "Fix: Auth error on iOS Safari" > "Update"
3. **Test Before Push** - Run `npm run dev` locally first
4. **Review Changes** - `git diff` before committing
5. **Use Branches** - Feature branches keep main stable

---

**Ready to deploy?** Run: `bash deploy.sh` 🚀
