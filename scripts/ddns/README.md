# BendBionics Dynamic DNS Setup

Automatically updates DNS A record when router's public IP changes.

## Quick Setup

1. **Get Porkbun API Credentials:**

   - Login to Porkbun: <https://porkbun.com>
   - Go to **Account Settings** → **API Access**
   - Generate or copy your credentials:
     - **API Key** (starts with `pk1_...`)
     - **Secret API Key** (starts with `sk1_...`)

   ⚠️ **Have these ready before running the setup script!**

2. **Run Setup Script:**

   After deployment, the DDNS scripts are available at:
   ```bash
   cd /var/www/bendbionics-app
   sudo bash scripts/ddns/setup-ddns.sh
   ```

   Or if running from the deployment package before cleanup:
   ```bash
   cd /tmp/web-build-YYYYMMDD-HHMMSS
   sudo bash scripts/ddns/setup-ddns.sh
   ```

   **The script will prompt you for your API keys:**

   ```txt
   [INFO] Setting up environment file...
   [INFO] Please enter your Porkbun API credentials:
   Porkbun API Key: pk1_xxxxxxxxxxxxx
   Porkbun Secret API Key: sk1_xxxxxxxxxxxxx
   ```

   ⚠️ **Have your API keys ready** - the script will ask for them interactively!

   The script will then:

   - Install the update script to `/usr/local/bin/update-dns.sh`
   - Save your API credentials to `/etc/porkbun-dns/.env` (secure, root-only)
   - Create systemd service and timer
   - Enable automatic DNS updates

3. **Verify It Works:**

   ```bash
   # Check timer status
   sudo systemctl status update-dns.timer

   # View logs
   sudo journalctl -u update-dns.service -f

   # Manual test
   sudo systemctl start update-dns.service
   ```

## How It Works

- **Timer**: Runs every 10 minutes
- **Script**: Checks current public IP vs DNS A record
- **Update**: If different, updates DNS via Porkbun API
- **Logs**: All actions logged to `/var/log/update-dns.log`

## Persistence & Auto-Start

### Automatic Startup on Boot

- ✅ **Systemd timer is enabled** - automatically starts on server boot
- ✅ **Persistent timer** - runs missed updates after boot
- ✅ **Runs 2 minutes after boot** - ensures network is ready

### Deployment Safety

- ✅ **Script location**: `/usr/local/bin/update-dns.sh` - **NOT overwritten by deployment**
- ✅ **Config location**: `/etc/porkbun-dns/.env` - **NOT overwritten by deployment**
- ✅ **Systemd files**: `/etc/systemd/system/update-dns.*` - **NOT overwritten by deployment**
- ✅ **Deployment script preserves** existing DDNS installation

### Verification

```bash
# Check if timer will start on boot
systemctl is-enabled update-dns.timer
# Should show: enabled

# Check timer status
systemctl status update-dns.timer

# Check if it will run after reboot
systemctl list-timers update-dns.timer
```

## Manual Configuration

If you prefer manual setup:

1. **Copy script:**

   ```bash
   sudo cp /var/www/bendbionics-app/scripts/ddns/update-dns.sh /usr/local/bin/
   sudo chmod +x /usr/local/bin/update-dns.sh
   ```

2. **Create environment file with your API keys:**

   ```bash
   sudo mkdir -p /etc/porkbun-dns
   sudo nano /etc/porkbun-dns/.env
   ```

   Add your API keys (replace with your actual keys from Porkbun):

   ```txt
   PORKBUN_API_KEY="pk1_xxxxxxxxxxxxx"
   PORKBUN_SECRET_KEY="sk1_xxxxxxxxxxxxx"
   ```

   **Important:** Replace `pk1_xxxxxxxxxxxxx` and `sk1_xxxxxxxxxxxxx` with your actual API keys!

   Save the file, then secure it:

   ```bash
   sudo chmod 600 /etc/porkbun-dns/.env
   ```

3. **Create systemd service:**

   ```bash
   sudo cp /var/www/bendbionics-app/scripts/ddns/update-dns.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable update-dns.timer
   sudo systemctl start update-dns.timer
   ```

## Configuration

Edit `/usr/local/bin/update-dns.sh` to change:

- `DOMAIN`: Your domain name (default: `bendbionics.com`)
- `SUBDOMAIN`: Subdomain (empty for root, or "www" for www subdomain)
- Update frequency: Edit `/etc/systemd/system/update-dns.timer`

## Troubleshooting

### Check Status

```bash
sudo systemctl status update-dns.timer
sudo systemctl status update-dns.service
```

### View Logs

```bash
# Recent logs
sudo journalctl -u update-dns.service -n 50

# Follow logs
sudo journalctl -u update-dns.service -f

# Script log file
sudo tail -f /var/log/update-dns.log
```

### Manual Test

```bash
sudo /usr/local/bin/update-dns.sh
```

### Common Issues

**Script fails to get IP:**

- Check internet connectivity
- Verify firewall allows outbound connections

**API update fails:**

- Verify API credentials in `/etc/porkbun-dns/.env`
- Check Porkbun API status
- Verify domain is managed by Porkbun

**Timer not running:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable update-dns.timer
sudo systemctl start update-dns.timer
```

## Security Notes

- API credentials stored in `/etc/porkbun-dns/.env` (root-only access)
- Script runs as root (needed for systemd service)
- Lock file prevents concurrent runs
- Rate limiting: Updates only when IP changes

## Files

- **Script**: `/usr/local/bin/update-dns.sh`
- **Service**: `/etc/systemd/system/update-dns.service`
- **Timer**: `/etc/systemd/system/update-dns.timer`
- **Config**: `/etc/porkbun-dns/.env`
- **Logs**: `/var/log/update-dns.log`
