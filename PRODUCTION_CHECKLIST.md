# Production Deployment Checklist

Use this checklist to ensure your production deployment is complete and secure.

## Pre-Deployment

- [ ] Server meets minimum requirements (2+ CPU cores, 4GB+ RAM, 20GB+ storage)
- [ ] Docker and Docker Compose installed
- [ ] Domain name configured and pointing to server IP
- [ ] Firewall configured (ports 80, 443 open)
- [ ] SSH access configured
- [ ] GitHub repository secrets configured (SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY)

## Environment Configuration

- [ ] `.env` file created from `env.production.template`
- [ ] `APP_ENV=production` set
- [ ] `APP_DEBUG=false` set
- [ ] `APP_KEY` generated (run: `php artisan key:generate`)
- [ ] `APP_URL` set to production domain (https://your-domain.com)
- [ ] Strong `DB_PASSWORD` set
- [ ] Strong `DB_ROOT_PASSWORD` set
- [ ] Strong `REDIS_PASSWORD` set
- [ ] Mail configuration updated (SMTP settings)
- [ ] All sensitive values changed from defaults

## SSL Certificates

- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Certificates placed in `docker/nginx/ssl/`
- [ ] Certificate files have correct permissions (600)
- [ ] Auto-renewal configured for Let's Encrypt certificates

## Docker Configuration

- [ ] `docker-compose.prod.yml` file reviewed
- [ ] Docker images built successfully
- [ ] Containers start without errors
- [ ] Health checks passing

## Database

- [ ] Database migrations run successfully
- [ ] Database backups configured
- [ ] Database user has appropriate permissions
- [ ] Root password is strong and secure

## Application Setup

- [ ] Application key generated
- [ ] Storage permissions set correctly (755)
- [ ] Storage symlink created
- [ ] Configuration cached (`config:cache`)
- [ ] Routes cached (`route:cache`)
- [ ] Views cached (`view:cache`)
- [ ] Events cached (`event:cache`)

## Services

- [ ] Nginx container running
- [ ] PHP-FPM container running
- [ ] MySQL container running
- [ ] Redis container running
- [ ] Queue worker container running
- [ ] Scheduler container running
- [ ] All containers healthy

## Security

- [ ] `APP_DEBUG=false` verified
- [ ] `.env` file not committed to git
- [ ] File permissions set correctly
- [ ] Rate limiting enabled in nginx
- [ ] Security headers configured
- [ ] HTTPS redirect working
- [ ] Sensitive files protected (.env, .git, etc.)

## Monitoring & Health

- [ ] Health check endpoint accessible (`/health`)
- [ ] Logs accessible and monitored
- [ ] Container health checks passing
- [ ] Database connection verified
- [ ] Redis connection verified

## Testing

- [ ] Application accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] User registration/login works
- [ ] Database operations work
- [ ] Queue jobs processing
- [ ] Scheduled tasks running
- [ ] File uploads work
- [ ] Email sending works (if configured)

## Backup & Recovery

- [ ] Database backup script created
- [ ] Backup schedule configured
- [ ] Backup storage location secure
- [ ] Recovery procedure documented
- [ ] Test restore performed

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
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

## Maintenance

- [ ] Update procedure documented
- [ ] SSL certificate renewal automated
- [ ] Regular security updates scheduled
- [ ] Log rotation configured
- [ ] Disk space monitoring configured

## Notes

- Deployment Date: ___________
- Deployed By: ___________
- Production URL: ___________
- Server IP: ___________

---

**Remember:** Always test in a staging environment before deploying to production!
