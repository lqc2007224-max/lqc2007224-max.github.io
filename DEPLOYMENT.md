# Server Deployment

This project can run as a real CMS on a VPS. The Node server serves the built Astro site, accepts admin Word uploads, stores CMS data in SQLite, rebuilds the site, and updates the public pages immediately.

Recommended server:

- Ubuntu 24.04 LTS
- Node.js 22 or newer
- Nginx
- A domain pointed to the server IP

## First Deploy

```sh
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www
git clone https://github.com/lqc2007224-max/lqc2007224-max.github.io.git personal-blog-studio
cd personal-blog-studio
npm ci
npm run build
cp .env.production.example .env.production
nano .env.production
```

Set a strong `ADMIN_TOKEN` in `.env.production`.

For server mode, keep:

```sh
GIT_DEPLOY=0
HOST=127.0.0.1
PORT=4325
```

Install the service:

```sh
sudo cp deploy/personal-blog-studio.service /etc/systemd/system/personal-blog-studio.service
sudo chown -R www-data:www-data /var/www/personal-blog-studio
sudo systemctl daemon-reload
sudo systemctl enable personal-blog-studio
sudo systemctl start personal-blog-studio
sudo systemctl status personal-blog-studio
```

Configure Nginx:

```sh
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/personal-blog-studio
sudo nano /etc/nginx/sites-available/personal-blog-studio
sudo ln -s /etc/nginx/sites-available/personal-blog-studio /etc/nginx/sites-enabled/personal-blog-studio
sudo nginx -t
sudo systemctl reload nginx
```

After DNS is pointed to the server, add HTTPS:

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

## Admin

Open:

```text
https://example.com/admin/
```

Enter the `ADMIN_TOKEN`, upload a `.docx`, then click publish. On the VPS it updates the live site directly after the build finishes.
