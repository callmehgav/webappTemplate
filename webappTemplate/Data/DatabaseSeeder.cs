using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace webappTemplate.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(
            IServiceProvider services)
        {
            var database =
                services.GetRequiredService<AppDbContext>();

            var passwordHasher =
                services.GetRequiredService<
                    IPasswordHasher<AdminUser>>();

            var logger =
                services.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("DatabaseSeeder");

            await SeedAdministratorAsync(
                database,
                passwordHasher,
                logger);

            await SeedSocialLinksAsync(database);
            await SeedSiteContentAsync(database);
            await SeedScheduleAsync(database);

            logger.LogInformation(
                "Database seeding completed successfully.");
        }

        private static async Task SeedAdministratorAsync(
            AppDbContext database,
            IPasswordHasher<AdminUser> passwordHasher,
            ILogger logger)
        {
            // Visual Studio loads these from launchSettings.json.
            // Railway loads them from the service variables.
            var username =
                Environment.GetEnvironmentVariable(
                    "ADMIN_USERNAME");

            var password =
                Environment.GetEnvironmentVariable(
                    "ADMIN_PASSWORD");

            if (string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning(
                    "Administrator credentials are missing. " +
                    "Configure ADMIN_USERNAME and ADMIN_PASSWORD.");

                return;
            }

            var normalizedUsername =
                NormalizeUsername(username);

            // Never overwrite an existing administrator or password.
            var administratorExists =
                await database.AdminUsers.AnyAsync(
                    existing =>
                        existing.NormalizedUsername ==
                        normalizedUsername);

            if (administratorExists)
            {
                return;
            }

            var administrator = new AdminUser
            {
                Id = Guid.NewGuid(),
                Username = username.Trim(),
                NormalizedUsername = normalizedUsername,

                // Set immediately below using Microsoft's password hasher.
                PasswordHash = string.Empty,

                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow
            };

            administrator.PasswordHash =
                passwordHasher.HashPassword(
                    administrator,
                    password);

            database.AdminUsers.Add(administrator);
            await database.SaveChangesAsync();

            logger.LogInformation(
                "Created the administrator account.");
        }

        private static async Task SeedSocialLinksAsync(
            AppDbContext database)
        {
            if (await database.SocialLinks.AnyAsync())
            {
                return;
            }

            var links = new[]
            {
                new SocialLink
                {
                    Platform = SocialPlatform.Facebook,
                    DisplayStyle =
                        SocialLinkDisplayStyle.TitleCard,
                    Label = "Facebook",
                    Handle = "Facebook Page",
                    Url = "https://www.facebook.com/profile.php?id=100074226272534",
                    DisplayOrder = 10
                },
                
            };

            database.SocialLinks.AddRange(links);
            await database.SaveChangesAsync();
        }

        private static async Task SeedSiteContentAsync(
            AppDbContext database)
        {
            const string contentKey = "about.body";

            var exists =
                await database.SiteContent.AnyAsync(
                    existing =>
                        existing.ContentKey ==
                        contentKey);

            if (exists)
            {
                return;
            }

            database.SiteContent.Add(
                new SiteContent
                {
                    ContentKey = contentKey,
                    Title = "About this Website",
                    Format = SiteContentFormat.Markdown,
                    Content =
                        """This is the foundation for a reusable website template."""
                });

            await database.SaveChangesAsync();
        }

        private static string NormalizeUsername(
            string username)
        {
            return username.Trim().ToUpperInvariant();
        }

        private static async Task SeedScheduleAsync(AppDbContext database)
        {
            if (!await database.ScheduleSettings.AnyAsync())
            {
                database.ScheduleSettings.Add(new ScheduleSettings
                {
                    Id = 1,
                    BusinessHoursJson = JsonSerializer.Serialize(
                        Enumerable.Range(0, 7).Select(day => new
                        {
                            dayOfWeek = day,
                            start = "09:00",
                            end = day == 0 ? "16:00" : "17:00",
                            isClosed = day == 0
                        })),
                    LabelsJson = JsonSerializer.Serialize(new[]
                    {
                        new { name = "Steven", color = "#356bd6" },
                        new { name = "Main calendar", color = "#8b5cf6" }
                    }),
                    ServicesJson = JsonSerializer.Serialize(new[]
                    {
                        "Standard appointment",
                        "Extended appointment",
                        "Consultation"
                    })
                });
            }

            if (!await database.ScheduleEvents.AnyAsync())
            {
                var today = DateTime.UtcNow.Date;

                database.ScheduleEvents.AddRange(
                    new ScheduleEvent
                    {
                        Id = Guid.NewGuid(),
                        Title = "Sample appointment",
                        Label = "Steven",
                        Color = "#356bd6",
                        StartsAt = today.AddDays(2).AddHours(14),
                        EndsAt = today.AddDays(2).AddHours(15)
                    },
                    new ScheduleEvent
                    {
                        Id = Guid.NewGuid(),
                        Title = "Closed for holiday",
                        EventType = "Closed",
                        Color = "#64748b",
                        StartsAt = today.AddDays(7),
                        EndsAt = today.AddDays(8),
                        IsAllDay = true,
                        IsBlocked = true
                    },
                    new ScheduleEvent
                    {
                        Id = Guid.NewGuid(),
                        Title = "Sample multi-day event",
                        EventType = "Event",
                        Label = "Main calendar",
                        Color = "#8b5cf6",
                        StartsAt = today.AddDays(12),
                        EndsAt = today.AddDays(14).AddHours(23).AddMinutes(59),
                        IsAllDay = true,
                        IsBlocked = true
                    });
            }

            await database.SaveChangesAsync();
        }
    }
}
