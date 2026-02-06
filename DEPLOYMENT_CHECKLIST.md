# Production Deployment Checklist

Use this checklist to ensure a secure and successful production deployment.

## Pre-Deployment

### Environment Configuration
- [ ] Created root `.env` from `.env.example`
- [ ] Set strong `POSTGRES_PASSWORD` (min 16 characters)
- [ ] Set strong `JWT_SECRET` (min 32 characters, use `openssl rand -base64 32`)
- [ ] Set strong `ADMIN_PASSWORD` (min 12 characters)
- [ ] Set correct `ADMIN_EMAIL` for superadmin
- [ ] Set valid `BOT_TOKEN` from Telegram BotFather
- [ ] Configured `VITE_API_URL` with production API URL
- [ ] Configured `VITE_UPLOADS_URL` with production uploads URL
- [ ] Set `NODE_ENV=production`
- [ ] Verified `.env` file is in `.gitignore`
- [ ] Confirmed no separate `.env` files in `backend/` or `frontend/` directories

### Domain and DNS
- [ ] Registered domain name
- [ ] DNS A record points to server IP for main domain
- [ ] DNS A record points to server IP for API subdomain
- [ ] DNS propagation completed (check with `nslookup`)

### Server Setup
- [ ] Server meets minimum requirements (2GB RAM, 20GB storage)
- [ ] Docker Engine 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] SSH access configured
- [ ] Firewall configured (ports 22, 80, 443 open)
- [ ] Non-root user created for deployment

### Code Configuration
- [ ] Updated domain names in `nginx/conf.d/default.conf`
- [ ] Reviewed and adjusted rate limits in `nginx/nginx.conf`
- [ ] Reviewed upload size limits in nginx config
- [ ] Created required directories (`nginx/ssl`, `nginx/logs`, `backend/uploads`)

## Deployment

### Build and Start
- [ ] Pulled latest code from repository
- [ ] Built Docker images: `docker-compose -f docker-compose.prod.yml build`
- [ ] Started services: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Verified all containers are running: `docker-compose -f docker-compose.prod.yml ps`
- [ ] Checked container health status (all should be "healthy")

### Database Setup
- [ ] Waited for database to be ready (check health status)
- [ ] Ran database migrations: `npx prisma migrate deploy`
- [ ] Verified migrations completed successfully
- [ ] Ran superadmin seeder: `npx prisma db seed`
- [ ] Verified superadmin account created

### SSL/TLS Configuration
- [ ] Installed Certbot on server
- [ ] Obtained SSL certificates: `certbot --nginx -d domain.com -d api.domain.com`
- [ ] Uncommented SSL certificate paths in `nginx/conf.d/default.conf`
- [ ] Updated `docker-compose.prod.yml` to mount certificates
- [ ] Restarted nginx: `docker-compose -f docker-compose.prod.yml restart nginx`
- [ ] Verified HTTPS is working
- [ ] Tested auto-renewal: `certbot renew --dry-run`

## Post-Deployment

### Verification
- [ ] Accessed frontend at `https://yourdomain.com`
- [ ] Accessed API at `https://api.yourdomain.com/api/health`
- [ ] Logged in with superadmin credentials
- [ ] Changed superadmin password immediately
- [ ] Tested user registration/login flow
- [ ] Tested Telegram bot functionality
- [ ] Verified file uploads work
- [ ] Checked all API endpoints respond correctly

### Security
- [ ] Changed all default passwords
- [ ] Removed or secured `ADMIN_PASSWORD` from environment files
- [ ] Verified `.env` files are not in git repository
- [ ] Confirmed database is not exposed to public internet
- [ ] Tested rate limiting (try multiple rapid requests)
- [ ] Verified security headers are present (use browser dev tools)
- [ ] Confirmed HSTS header is set
- [ ] Tested SSL configuration (use SSL Labs: ssllabs.com/ssltest)
- [ ] Reviewed nginx access logs for suspicious activity

### Monitoring and Maintenance
- [ ] Set up automated database backups
- [ ] Configured backup retention policy
- [ ] Tested database restore procedure
- [ ] Set up log rotation for nginx logs
- [ ] Configured monitoring/alerting (optional)
- [ ] Documented admin procedures
- [ ] Created additional admin accounts if needed
- [ ] Set up automated SSL certificate renewal

### Performance
- [ ] Verified gzip compression is working (check response headers)
- [ ] Tested static asset caching (check cache headers)
- [ ] Verified page load times are acceptable
- [ ] Checked Docker container resource usage
- [ ] Optimized database queries if needed
- [ ] Set appropriate container resource limits

## Ongoing Maintenance

### Daily
- [ ] Check service status: `docker-compose -f docker-compose.prod.yml ps`
- [ ] Review error logs: `docker-compose -f docker-compose.prod.yml logs --tail=100`

### Weekly
- [ ] Review access logs for anomalies
- [ ] Check disk space usage
- [ ] Verify backups are running successfully
- [ ] Check SSL certificate expiration date

### Monthly
- [ ] Update Docker images: `docker-compose -f docker-compose.prod.yml pull`
- [ ] Update application dependencies
- [ ] Review and update security configurations
- [ ] Test backup restore procedure
- [ ] Review and optimize database performance
- [ ] Update documentation if needed

### As Needed
- [ ] Deploy application updates
- [ ] Run new database migrations
- [ ] Scale services if traffic increases
- [ ] Adjust rate limits based on usage
- [ ] Review and respond to security advisories

## Rollback Plan

In case of deployment issues:

1. **Stop new deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore from backup:**
   ```bash
   gunzip < backup.sql.gz | docker exec -i casting_db psql -U postgres casting_db
   ```

3. **Start previous version:**
   ```bash
   git checkout <previous-commit>
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify rollback:**
   - Check all services are running
   - Test critical functionality
   - Review logs for errors

## Emergency Contacts

- **System Administrator:** [Name/Contact]
- **Database Administrator:** [Name/Contact]
- **Development Team:** [Contact Info]
- **Hosting Provider Support:** [Contact Info]

## Documentation References

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Complete deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick deployment guide
- [nginx/README.md](./nginx/README.md) - Nginx configuration
- [README.md](./README.md) - Project overview

## Notes

**Deployment Date:** _________________

**Deployed By:** _________________

**Version/Commit:** _________________

**Issues Encountered:**
- 
- 
- 

**Additional Notes:**
- 
- 
- 

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-02-06
