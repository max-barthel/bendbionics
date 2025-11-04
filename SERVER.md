# BendBionics Server Commands

## Start Server

```bash
wakeonlan fc:aa:14:c2:bf:d5
```

## Connect to Server

```bash
ssh bendbionics
```

## Shut Down Server

```bash
sudo shutdown now
```

## System Updates

```bash
# Update package lists and upgrade all packages
sudo apt update && sudo apt upgrade -y

# Update security patches only
sudo apt update && sudo apt upgrade -y --only-upgrade
```

## Server Management

### View Application Logs

```bash
# Follow live logs
sudo journalctl -u bendbionics-api -f

# View last 100 lines
sudo journalctl -u bendbionics-api -n 100

# View logs with timestamps
sudo journalctl -u bendbionics-api -n 50 --no-pager
```

### Service Management

```bash
# Restart backend service
sudo systemctl restart bendbionics-api

# Check service status
sudo systemctl status bendbionics-api

# Stop service
sudo systemctl stop bendbionics-api

# Start service
sudo systemctl start bendbionics-api

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx
```

### Check Environment Configuration

```bash
# View environment variables (requires sudo)
sudo cat /var/www/bendbionics-app/backend/.env.production

# Check email configuration
sudo cat /var/www/bendbionics-app/backend/.env.production | grep MAILGUN
sudo cat /var/www/bendbionics-app/backend/.env.production | grep EMAIL_VERIFICATION
```

### Database Management

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Connect to bendbionics database
sudo -u postgres psql -d bendbionics

# List databases
sudo -u postgres psql -l

# Backup database
sudo -u postgres pg_dump bendbionics > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql bendbionics < backup_20241025.sql
```

### Application Health

```bash
# Check if application is responding
curl http://localhost:8000/api/health

# Check via nginx
curl http://localhost/health

# Check public URL
curl https://bendbionics.com/health
```

### Disk Space

```bash
# Check disk usage
df -h

# Check application directory size
du -sh /var/www/bendbionics-app

# Find large files
sudo du -h /var/www/bendbionics-app | sort -h | tail -20
```

## First-Time Setup

### Email Configuration

To enable email verification and password reset functionality, you need to configure Mailgun credentials via GitHub Secrets. See **[EMAIL_SETUP.md](./EMAIL_SETUP.md)** for detailed instructions.

Quick summary:

1. Sign up for Mailgun (free tier available)
2. Add GitHub Secrets: `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`
3. Deploy the application
4. Email verification will work automatically

### SSL Certificate Setup

If SSL is not configured yet:

1. Copy your certificate files to the server:

   ```bash
   scp domain.cert.pem bendbionics:/tmp/
   scp private.key.pem bendbionics:/tmp/
   ```

2. Move them to the correct location:

   ```bash
   ssh bendbionics
   sudo mkdir -p /etc/ssl/bendbionics.com
   sudo mv /tmp/domain.cert.pem /etc/ssl/bendbionics.com/
   sudo mv /tmp/private.key.pem /etc/ssl/bendbionics.com/
   sudo chmod 600 /etc/ssl/bendbionics.com/private.key.pem
   ```

3. Reload nginx:

   ```bash
    sudo systemctl reload nginx
   ```

## Troubleshooting

### Email Not Working

1. Check Mailgun credentials are set:

   ```bash
   sudo cat /var/www/bendbionics-app/backend/.env.production | grep MAILGUN
   ```

2. Check email verification is enabled:

   ```bash
   sudo cat /var/www/bendbionics-app/backend/.env.production | grep EMAIL_VERIFICATION_ENABLED
   ```

3. View logs for email errors:

   ```bash
   sudo journalctl -u bendbionics-api -f | grep -i email
   ```

4. See **[EMAIL_SETUP.md](./EMAIL_SETUP.md)** for detailed troubleshooting

### Service Won't Start

1. Check logs:

   ```bash
   sudo journalctl -u bendbionics-api -n 50
   ```

2. Check if port 8000 is in use:

   ```bash
   sudo lsof -i :8000
   ```

3. Test configuration:

   ```bash
   cd /var/www/bendbionics-app/backend
   source venv/bin/activate
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Database Connection Issues

1. Check PostgreSQL is running:

   ```bash
   sudo systemctl status postgresql
   ```

2. Test database connection:

   ```bash
   sudo -u postgres psql -d bendbionics -c "SELECT 1;"
   ```

3. Check database credentials in environment file

## Useful Files and Paths

- Application directory: `/var/www/bendbionics-app/`
- Backend code: `/var/www/bendbionics-app/backend/app/`
- Frontend files: `/var/www/bendbionics-app/frontend/`
- Environment config: `/var/www/bendbionics-app/backend/.env.production`
- Nginx config: `/etc/nginx/sites-available/bendbionics`
- Systemd service: `/etc/systemd/system/bendbionics-api.service`
- SSL certificates: `/etc/ssl/bendbionics.com/`
- PostgreSQL data: `/var/lib/postgresql/`
