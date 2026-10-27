# Stage 1: Build Angular app
FROM node:22.23.2 AS node_builder
WORKDIR /app/webapp

COPY webapp/package*.json ./
RUN npm ci

COPY webapp/ .
RUN npm run build -- --configuration production

# Stage 2: Build .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY *.sln .
COPY webappTemplate/*.csproj ./webappTemplate/
RUN dotnet restore

COPY webappTemplate/ ./webappTemplate/
COPY --from=node_builder /app/webapp/dist/webapp/browser ./webappTemplate/wwwroot/
RUN dotnet publish -c Release -o out --no-restore

# Stage 3: Run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/out .
RUN mkdir -p /data

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DATABASE_PATH=/data/data.db

EXPOSE 8080
ENTRYPOINT ["dotnet", "webappTemplate.dll"]
