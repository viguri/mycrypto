# Deploying MyCrypto to crypto.viguri.org on Ubuntu Server

This guide provides step-by-step instructions for deploying the MyCrypto application to your Ubuntu server at crypto.viguri.org.

## Prerequisites

- Ubuntu server with SSH access
- Domain (crypto.viguri.org) pointing to your server's IP address
- Root or sudo access on the server

## Deployment Steps

### 1. Prepare Your Local Repository

Before deploying, ensure all your changes are committed and pushed to your repository:

```bash
# Make the deployment scripts executable
chmod +x deploy.sh server_setup.sh
```

### 2. Transfer Files to Server

You have several options to transfer your files to the server:

#### Option 1: Using Git (Recommended)

If your repository is hosted on GitHub or another Git provider:

```bash
# SSH into your server
ssh username@your-server-ip

# Clone the repository
git clone https://github.com/viguri/mycrypto.git /opt/mycrypto
cd /opt/mycrypto
```

#### Option 2: Using SCP

If you prefer to transfer files directly from your local machine:

```bash
# Create a tarball of your project
tar -czf mycrypto.tar.gz -C /Users/viguri/GitHub mycrypto

# Transfer to server
scp mycrypto.tar.gz username@your-server-ip:~/

# SSH into your server
ssh username@your-server-ip

# Extract and move to the correct location
mkdir -p /opt/mycrypto
tar -xzf mycrypto.tar.gz -C /opt
```

### 3. Set Up the Server

Once you have the files on your server, run the server setup script:

```bash
cd /opt/mycrypto
chmod +x server_setup.sh
./server_setup.sh
```

This script will:
- Update system packages
- Install Docker, Docker Compose, Nginx, and Certbot
- Configure Docker to start on boot
- Set up Nginx with the crypto.viguri.org configuration
- Obtain SSL certificates from Let's Encrypt
- Configure a systemd service for your application

### 4. Deploy the Application

After the server is set up, deploy the application:

```bash
cd /opt/mycrypto
chmod +x deploy.sh
./deploy.sh
```

This will:
- Build and start the Docker containers
- Configure the application for production
- Start the application as a systemd service

### 5. Verify the Deployment

After deployment, verify that everything is working correctly:

1. Check the Docker containers:
   ```bash
   docker ps
   ```

2. Check the application logs:
   ```bash
   sudo journalctl -u mycrypto -f
   ```

3. Visit https://crypto.viguri.org in your browser to verify the application is running

### 6. Troubleshooting

If you encounter issues during deployment:

#### Docker Issues

```bash
# Check Docker container logs
docker logs mycrypto_server_1

# Restart Docker containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### Nginx Issues

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/crypto.viguri.org.error.log
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --dry-run
```

### 7. Maintenance

#### Updating the Application

When you need to update the application:

```bash
cd /opt/mycrypto
git pull  # If using Git
./deploy.sh
```

#### Monitoring

Set up basic monitoring for your application:

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor system resources
htop

# Monitor disk I/O
iotop
```

#### Backup

Set up regular backups of your application data:

```bash
# Create a backup script
cat > /opt/mycrypto/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/mycrypto"
DATE=$(date +%Y-%m-%d)
mkdir -p $BACKUP_DIR
cd /opt/mycrypto
docker-compose -f docker-compose.prod.yml down
tar -czf $BACKUP_DIR/mycrypto-$DATE.tar.gz .
docker-compose -f docker-compose.prod.yml up -d
EOF

# Make it executable
chmod +x /opt/mycrypto/backup.sh

# Set up a cron job for weekly backups
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/mycrypto/backup.sh") | crontab -
```

## Security Considerations

- **Firewall**: Configure UFW (Uncomplicated Firewall) to allow only necessary ports:
  ```bash
  sudo ufw allow ssh
  sudo ufw allow http
  sudo ufw allow https
  sudo ufw enable
  ```

- **SSH Hardening**: Disable password authentication and use key-based authentication:
  ```bash
  sudo nano /etc/ssh/sshd_config
  # Set PasswordAuthentication no
  # Set PermitRootLogin no
  sudo systemctl restart sshd
  ```

- **Regular Updates**: Keep your system updated:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- **Fail2Ban**: Install Fail2Ban to protect against brute force attacks:
  ```bash
  sudo apt install -y fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

## Conclusion

Your MyCrypto application should now be successfully deployed to crypto.viguri.org. If you encounter any issues or need assistance, refer to the troubleshooting section or contact your system administrator.
