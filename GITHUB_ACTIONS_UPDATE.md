# GitHub Actions Workflow Updates for PostgreSQL

## ✅ Updated Files

### 1. `.github/workflows/deploy.yml`

- ✅ **Database Reference**: Removed SQLite database copy, added `init_database.py` script
- ✅ **Service Names**: Updated from `soft-robot-api` to `bendbionics-api`
- ✅ **Database Setup**: Now includes PostgreSQL database initialization

### 2. `.github/workflows/ci.yml`

- ✅ **No Changes Needed**: This workflow only runs tests and doesn't reference specific database names

### 3. `.github/workflows/test.yml`

- ✅ **No Changes Needed**: This workflow only runs tests and doesn't reference specific database names

### 4. `.github/workflows/quick-test.yml`

- ✅ **No Changes Needed**: This workflow only runs quick checks and doesn't reference specific database names

## 🔄 Key Changes Made

### Database Handling

**Before (SQLite):**

```yaml
# Copy database if exists
if [ -f "backend/soft_robot.db" ]; then
cp backend/soft_robot.db "$DEPLOY_DIR/backend/"
fi
```

**After (PostgreSQL):**

```yaml
# Copy database initialization script
cp backend/init_database.py "$DEPLOY_DIR/backend/"
```

### Service Names

**Before:**

```yaml
echo "View logs: ssh ${{ env.SERVER_USER }}@${{ env.SERVER_HOST }} 'sudo journalctl -u soft-robot-api -f'"
echo "Restart backend: ssh ${{ env.SERVER_USER }}@${{ env.SERVER_HOST }} 'sudo systemctl restart soft-robot-api'"
```

**After:**

```yaml
echo "View logs: ssh ${{ env.SERVER_USER }}@${{ env.SERVER_HOST }} 'sudo journalctl -u bendbionics-api -f'"
echo "Restart backend: ssh ${{ env.SERVER_USER }}@${{ env.SERVER_HOST }} 'sudo systemctl restart bendbionics-api'"
```

## 🚀 Deployment Process

The GitHub Actions deployment workflow now:

1. **Builds the application** (frontend + backend)
2. **Creates deployment package** with:
   - Frontend build files
   - Backend application code
   - `init_database.py` script (instead of SQLite database)
   - Nginx and systemd configurations
   - Environment files
3. **Uploads to server**
4. **Runs deployment script** which:
   - Installs PostgreSQL (if not present)
   - Creates `bendbionics.db` database
   - Runs `init_database.py` to create tables
   - Configures nginx and systemd services
   - Starts the application

## 🔧 Server Requirements

The deployment now requires:

- **PostgreSQL** installed on the server
- **Database**: `bendbionics.db` (not `bendbionics_db`)
- **Service**: `bendbionics-api` (not `soft-robot-api`)
- **App Directory**: `/var/www/bendbionics-app` (not `/var/www/soft-robot-app`)

## 📝 Environment Variables

The deployment package now includes:

- **Database URL**: `postgresql://username:password@localhost:5432/bendbionics.db`
- **Email Verification**: Complete Mailgun integration
- **Service Configuration**: Updated for BendBionics branding

## ✅ All GitHub Actions Updated

The GitHub Actions workflows are now fully updated for:

- ✅ PostgreSQL database (`bendbionics.db`)
- ✅ BendBionics branding
- ✅ Email verification system
- ✅ New service names
- ✅ Database initialization process

Your automated deployment from GitHub will now work seamlessly with the new PostgreSQL setup! 🎉
