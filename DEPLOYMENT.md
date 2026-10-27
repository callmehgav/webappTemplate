# Railway deployment

The root Dockerfile builds Angular and publishes its output with ASP.NET Core.
Deploy from the repository root, keeping the Dockerfile's start command.
Production API requests use `/api` on the current domain, so each demo can use
its own Railway or custom domain without rebuilding domain-specific URLs.

## Service setup

1. Create a Railway service from this repository, using the root Dockerfile.
2. Attach a persistent volume at `/data`. The Dockerfile sets
   `DATABASE_PATH=/data/data.db`. Uploaded media is stored in SQLite, and the
   email credential encryption key is stored beside the database.
3. Set `RAILWAY_RUN_UID=0` for write access to Railway's root-owned volume.
   The image otherwise runs as the ASP.NET non-root user.
4. Set `ADMIN_USERNAME` and a strong, unique `ADMIN_PASSWORD` before starting
   the service. These seed the administrator; changing them later does not
   reset an existing account's password.
5. Set `PORT=8080` and use target port `8080` for public networking.
6. Deploy. Database migrations and initial seeding run when the application starts.

## Custom domain

Add `nexustemplate.gavs-nexus.com` in the Railway service's Settings → Public
Networking → Custom Domain, with target port `8080`. DNS names are case-insensitive.

In Squarespace's DNS settings for `gavs-nexus.com`, add the CNAME and verification
TXT records exactly as Railway displays them. Use the Railway-provided target
and verification value; these are specific to the service. The CNAME host will
be `nexustemplate`; use the exact TXT host Railway supplies. Railway issues the
HTTPS certificate after DNS verification. Squarespace supplies DNS for this
subdomain; Railway hosts the application.

## Future demos

Give each demo a separate service, volume, admin credentials, and domain so its
content and accounts stay independent. Start with a fresh database for each demo.
Back up the persistent volume, including the database and email encryption key.

## References

- [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles)
- [Railway volumes and permissions](https://docs.railway.com/volumes)
- [Railway custom domains](https://docs.railway.com/networking/domains/working-with-domains)
