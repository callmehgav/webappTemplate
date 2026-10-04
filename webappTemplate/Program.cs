using System.Text.Json;
using webappTemplate;
using webappTemplate.Data;
using webappTemplate.Data.Models;
using webappTemplate.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Logging.ClearProviders();
        builder.Logging.AddSimpleConsole(options =>
        {
            options.SingleLine = true;
            options.TimestampFormat = "yyyy-MM-dd HH:mm:ss ";
        });

        var databasePath = builder.Configuration["DATABASE_PATH"];

        if (string.IsNullOrWhiteSpace(databasePath))
        {
            databasePath = Path.Combine(
                builder.Environment.ContentRootPath,
                "Data",
                "data.db");
        }

        builder.Services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite(
                $"Data Source={databasePath};" +
                "Foreign Keys=True;" +
                "Default Timeout=30");
        });

        builder.Services.Configure<PasswordHasherOptions>(options =>
        {
            options.CompatibilityMode =
                PasswordHasherCompatibilityMode.IdentityV3;

            options.IterationCount = 100_000;
        });

        builder.Services.AddScoped<
            IPasswordHasher<AdminUser>,
            PasswordHasher<AdminUser>>();

        builder.Services
            .AddAuthentication(
                CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "webappTemplate.admin";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite =
                    builder.Environment.IsDevelopment()
                        ? SameSiteMode.Strict
                        : SameSiteMode.None;

                options.Cookie.SecurePolicy =
                    builder.Environment.IsDevelopment()
                        ? CookieSecurePolicy.SameAsRequest
                        : CookieSecurePolicy.Always;

                options.ExpireTimeSpan = TimeSpan.FromHours(1);
                options.SlidingExpiration = false;

                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode =
                        StatusCodes.Status401Unauthorized;

                    return Task.CompletedTask;
                };

                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode =
                        StatusCodes.Status403Forbidden;

                    return Task.CompletedTask;
                };
            });

        builder.Services.AddAuthorization();


        builder.Services.AddMemoryCache();

        builder.Services.Configure<AppSettings>(
            builder.Configuration);

        builder.Services.AddScoped<InsightsService>();
        builder.Services.AddScoped<MediaAssetService>();
        builder.Services.AddSingleton<CredentialEncryptionService>();
        builder.Services.AddScoped<IEmailService, EmailService>();
        builder.Services.AddHostedService<ScheduleMaintenanceService>();
        builder.Services
        .AddControllersWithViews()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy =
                JsonNamingPolicy.CamelCase;
        });


        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngularApp", policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:4200",
                        "https://localhost:4200")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        var app = builder.Build();

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var database =
                scope.ServiceProvider
                    .GetRequiredService<AppDbContext>();

            await database.Database.MigrateAsync();
            await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
        }

        app.UseRouting();
        app.UseCors("AllowAngularApp");
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseDefaultFiles();
        app.UseStaticFiles();

        app.MapControllers();
        app.MapFallbackToFile("index.html");

        await app.RunAsync();
    }
}
