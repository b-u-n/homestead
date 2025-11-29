# SSL Certificate Setup with Let's Encrypt

## 1. Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## 2. Temporarily Disable Cloudflare Proxy

In Cloudflare dashboard:
1. Go to DNS settings
2. Click the orange cloud next to `homestead` record to turn it grey (DNS only)
3. Wait 2-3 minutes for DNS propagation

## 3. Generate Certificate

```bash
sudo certbot --nginx -d homestead.heartsbox.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

## 4. Verify Certificate

```bash
sudo certbot certificates
```

## 5. Update Nginx Config

Certbot should auto-update your nginx config, but if you need to manually configure:

```nginx
server {
    listen 80;
    server_name homestead.heartsbox.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name homestead.heartsbox.com;

    ssl_certificate /etc/letsencrypt/live/homestead.heartsbox.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homestead.heartsbox.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /heartsbox/homestead/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:9000;
    }

    location /socket.io/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 6. Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Re-enable Cloudflare Proxy

1. Go back to Cloudflare DNS settings
2. Click the grey cloud next to `homestead` to turn it orange (Proxied)
3. Make sure SSL/TLS is set to **Full** or **Full (Strict)**

## 8. Auto-Renewal

Certbot sets up auto-renewal automatically. Test it with:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

If certbot fails with "Could not find a vhost":
```bash
# Make sure your nginx config is linked
sudo ln -sf /home/bun/git/homestead/nginx.conf /etc/nginx/sites-enabled/homestead
sudo nginx -t
sudo systemctl reload nginx
```

If port 80 verification fails:
- Make sure Cloudflare proxy is OFF (grey cloud)
- Check firewall allows port 80
- Make sure nginx is running: `sudo systemctl status nginx`
