# Production Server Deployment Checklist

Use this checklist to ensure your traditional server deployment is complete and secure.

## Pre-Deployment

- [ ] Server meets minimum requirements (2+ CPU cores, 4GB+ RAM, 20GB+ storage)
- [ ] Ubuntu 20.04+ or Debian 11+ installed
- [ ] Root or sudo access available
- [ ] Domain name configured and pointing to server IP
- [ ] Firewall configured (ports 80, 443 open)
- [ ] SSH access configured with key authentication
- [ ] GitHub repository secrets configured (if using CI/CD)

## Server Setup

- [ ] Nginx installed and configured
- [ ] PHP 8.3 FPM installed with required extensions
- [ ] MySQL 8.0 installed and secured
- [ ] Redis installed and secured
- [ ] Node.js 20.x installed
- [ ] Composer installed globally
- [ ] Certbot installed for SSL

## Application Setup

- [ ] Project directory created (`/var/www/km-help-desk`)
- [ ] Repository cloned
- [ ] Dependencies installed (Composer & NPM)
- [ ] Frontend assets built

## Environment Configuration

- [ ] `.env` file created from template
- [ ] `APP_ENV=production` set
- [ ] `APP_DEBUG=false` set
- [ ] `APP_KEY` generated
- [ ] `APP_URL` set to production domain
- [ ] Strong `DB_PASSWORD` set
- [ ] `REDIS_PASSWORD` set
- [ ] Mail configuration updated
- [ ] All sensitive values changed from defaults

## Database

- [ ] MySQL database created
- [ ] Database user created with appropriate permissions
- [ ] Migrations run successfully
- [ ] Database backups configured
- [ ] Test connection works

## Nginx Configuration

- [ ] Nginx config file created (`/etc/nginx/sites-available/km-help-desk`)
- [ ] Server name updated with your domain
- [ ] Site enabled (symlink created)
- [ ] Default site removed or disabled
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded

## SSL Certificates

- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Certbot configured
- [ ] Auto-renewal tested
- [ ] HTTPS redirect working
- [ ] SSL configuration verified

## File Permissions

- [ ] Project owned by `www-data:www-data`
- [ ] Directory permissions set (755)
- [ ] File permissions set (644)
- [ ] Storage directory writable (775)
- [ ] Bootstrap cache directory writable (775)
- [ ] Storage symlink created

## Services

- [ ] Nginx service running
- [ ] PHP-FPM service running
- [ ] MySQL service running
- [ ] Redis service running
- [ ] Queue worker service installed and running
- [ ] Scheduler service installed and running
- [ ] All services enabled to start on boot

## Systemd Services

- [ ] Queue worker service file copied to `/etc/systemd/system/`
- [ ] Scheduler service file copied to `/etc/systemd/system/`
- [ ] Services enabled (`systemctl enable`)
- [ ] Services started (`systemctl start`)
- [ ] Service status verified

## Application Optimization

- [ ] Configuration cached (`config:cache`)
- [ ] Routes cached (`route:cache`)
- [ ] Views cached (`view:cache`)
- [ ] Events cached (`event:cache`)
- [ ] Application cache cleared

## Security

- [ ] `APP_DEBUG=false` verified
- [ ] `.env` file not accessible via web
- [ ] File permissions set correctly
- [ ] Rate limiting enabled in Nginx
- [ ] Security headers configured
- [ ] HTTPS redirect working
- [ ] Firewall (UFW) enabled
- [ ] Sensitive files protected

## Performance

- [ ] PHP-FPM pool optimized
- [ ] MySQL configured for performance
- [ ] Redis memory limits set
- [ ] Nginx caching configured
- [ ] Gzip compression enabled

## Monitoring & Health

- [ ] Health check endpoint accessible (`/health`)
- [ ] Logs accessible and monitored
- [ ] Service status monitoring configured
- [ ] Database connection verified
- [ ] Redis connection verified

## Testing

- [ ] Application accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] User registration/login works
- [ ] Database operations work
- [ ] Queue jobs processing (check logs)
- [ ] Scheduled tasks running (check logs)
- [ ] File uploads work
- [ ] Email sending works (if configured)
- [ ] Health endpoint returns healthy status

## Backup & Recovery

- [ ] Database backup script created
- [ ] Backup schedule configured (cron job)
- [ ] Backup storage location secure
- [ ] Recovery procedure documented
- [ ] Test restore performed

## Maintenance

- [ ] Deployment script tested (`deploy-server.sh`)
- [ ] Update procedure documented
- [ ] SSL certificate renewal automated
- [ ] Log rotation configured
- [ ] System updates automated (unattended-upgrades)
- [ ] Disk space monitoring configured

## Documentation

- [ ] Deployment procedure documented
- [ ] Environment variables documented
- [ ] Backup/restore procedures documented
- [ ] Troubleshooting guide available
- [ ] Team members have access to documentation

## Post-Deployment

- [ ] Application accessible and functional
- [ ] Performance acceptable
- [ ] Error logs reviewed
- [ ] Monitoring alerts configured (if using)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

## Performance Tuning (Optional)

- [ ] PHP-FPM pool settings optimized
- [ ] MySQL query cache configured
- [ ] Redis persistence configured
- [ ] Nginx worker processes optimized
- [ ] OpCache enabled and configured

## Notes

- Deployment Date: ___________
- Deployed By: ___________
- Production URL: ___________
- Server IP: ___________
- Database Name: ___________

---

**Remember:** Always test in a staging environment before deploying to production!
