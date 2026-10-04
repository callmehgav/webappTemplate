# syntax=docker/dockerfile:1.7

# Build the Angular application with the locked dependency graph.
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /src/webapp

COPY webapp/package.json webapp/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY webapp/ ./
RUN npm run build -- --configuration production


# Restore and publish the ASP.NET Core application.
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS backend-build
WORKDIR /src

COPY webappTemplate/webappTemplate.csproj webappTemplate/
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore webappTemplate/webappTemplate.csproj

COPY webappTemplate/ webappTemplate/
COPY --from=frontend-build /src/webapp/dist/webapp/browser/ \
    webappTemplate/wwwroot/

RUN dotnet publish webappTemplate/webappTemplate.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false


# Run only the published application in the smaller ASP.NET image.
FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production \
    DATABASE_PATH=/data/data.db \
    DOTNET_EnableDiagnostics=0

COPY --from=backend-build --chown=$APP_UID:$APP_UID /app/publish/ ./

# Mount a Railway volume at /data to persist the SQLite database.
USER root
RUN mkdir -p /data && chown "$APP_UID:$APP_UID" /data
USER $APP_UID

EXPOSE 8080

# Railway injects PORT at runtime. The fallback also makes the image easy to run locally.
CMD ["sh", "-c", "exec dotnet webappTemplate.dll --urls http://0.0.0.0:${PORT:-8080}"]
