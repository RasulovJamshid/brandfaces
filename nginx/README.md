# Nginx Configuration Guide

This directory contains the Nginx configuration for the CastingBot production deployment.

## Directory Structure

```
nginx/
├── nginx.conf           # Main Nginx configuration
├── conf.d/
│   └── default.conf    # Server blocks configuration
├── ssl/                # SSL certificates (create this directory)
└── logs/               # Nginx logs (auto-created)
```

## Setup Instructions

### 1. Create Required Directories

```bash
mkdir -p nginx/ssl
mkdir -p nginx/logs
```

### 2. Update Domain Names

Edit `nginx/conf.d/default.conf` and replace:
- `yourdomain.com` with your actual domain
- `api.yourdomain.com` with your API subdomain

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

1. Start services without SSL first:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. Install Certbot on host:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

3. Obtain certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

4. Uncomment SSL certificate lines in `nginx/conf.d/default.conf`:
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

5. Update docker-compose.prod.yml to mount certificates:
```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

6. Reload Nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

#### Option B: Custom Certificates

1. Place your certificates in `nginx/ssl/`:
   - `cert.pem` - Your SSL certificate
   - `key.pem` - Your private key
   - `chain.pem` - Certificate chain (optional)

2. Update `nginx/conf.d/default.conf`:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_trusted_certificate /etc/nginx/ssl/chain.pem;
```

### 4. Test Configuration

```bash
# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Configuration Features

### Security
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS enabled
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Rate limiting on API endpoints

### Performance
- Gzip compression
- Static asset caching
- Connection keep-alive
- Proxy buffering
- HTTP/2 support

### Rate Limiting
- API endpoints: 10 requests/second (burst 20)
- Login endpoint: 5 requests/minute (burst 3)

### Endpoints

#### Frontend (yourdomain.com)
- Serves React SPA
- Static asset caching (1 year)
- SPA routing support

#### Backend API (api.yourdomain.com)
- Proxies to backend:3000
- WebSocket support
- Rate limiting
- Health checks at `/api/health`

## Customization

### Adjust Rate Limits

Edit `nginx/nginx.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

### Change Upload Size Limit

Edit `nginx/conf.d/default.conf`:
```nginx
client_max_body_size 50M;  # Adjust as needed
```

### Add Custom Headers

Edit `nginx/nginx.conf` in the `http` block:
```nginx
add_header Custom-Header "value" always;
```

## Monitoring

### View Logs

```bash
# Access logs
docker-compose -f docker-compose.prod.yml logs nginx

# Or directly from mounted volume
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

### Check Status

```bash
# Nginx status
docker-compose -f docker-compose.prod.yml exec nginx nginx -v

# Test configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Active connections
docker-compose -f docker-compose.prod.yml exec nginx ps aux
```

## Troubleshooting

### 502 Bad Gateway
- Check if backend is running: `docker-compose -f docker-compose.prod.yml ps backend`
- Check backend logs: `docker-compose -f docker-compose.prod.yml logs backend`
- Verify upstream configuration in nginx.conf

### 413 Request Entity Too Large
- Increase `client_max_body_size` in nginx configuration
- Restart nginx: `docker-compose -f docker-compose.prod.yml restart nginx`

### SSL Certificate Errors
- Verify certificate paths are correct
- Check certificate expiration: `openssl x509 -in cert.pem -noout -dates`
- Ensure certificates are readable by nginx user

### Rate Limiting Issues
- Adjust rate limits in `nginx/nginx.conf`
- Check client IP is correctly identified
- Review `limit_req_zone` configuration

## Security Best Practices

1. **Keep certificates secure**: Never commit SSL certificates to version control
2. **Regular updates**: Keep Nginx image updated
3. **Monitor logs**: Regularly review access and error logs
4. **Strong ciphers**: Use modern TLS configurations
5. **Rate limiting**: Protect against DDoS and brute force attacks
6. **HSTS**: Enable HTTP Strict Transport Security
7. **Firewall**: Only expose ports 80 and 443

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
