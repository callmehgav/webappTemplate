using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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
    }
}