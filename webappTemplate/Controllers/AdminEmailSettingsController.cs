using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;
using webappTemplate.Data.Models;
using webappTemplate.Services;

namespace webappTemplate.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/admin/email-settings")]
    public sealed class AdminEmailSettingsController : ControllerBase
    {
        private readonly AppDbContext _database;
        private readonly CredentialEncryptionService _encryption;

        public AdminEmailSettingsController(
            AppDbContext database,
            CredentialEncryptionService encryption)
        {
            _database = database;
            _encryption = encryption;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            CancellationToken cancellationToken)
        {
            var settings = await _database.EmailSettings
                .AsNoTracking()
                .SingleOrDefaultAsync(cancellationToken);

            return Ok(new EmailSettingsResponse
            {
                SenderName = settings?.SenderName
                    ?? "Website Contact",
                SenderEmail = settings?.SenderEmail
                    ?? string.Empty,
                RecipientEmail = settings?.RecipientEmail
                    ?? string.Empty,
                PublicPhoneNumber = settings?.PublicPhoneNumber
                    ?? string.Empty,
                HasAppPassword =
                    !string.IsNullOrWhiteSpace(
                        settings?.EncryptedPassword)
            });
        }

        [HttpPut]
        public async Task<IActionResult> Update(
            [FromBody] UpdateEmailSettingsRequest request,
            CancellationToken cancellationToken)
        {
            if (request.Scope is not (null or "sender" or "destination"))
                return BadRequest(new { message = "Choose a valid email settings section." });
            var senderName = request.SenderName?.Trim();
            var senderEmail = request.SenderEmail?.Trim();
            var recipientEmail = request.RecipientEmail?.Trim();

            if ((request.Scope != "destination" && !string.IsNullOrWhiteSpace(senderEmail) && !IsValidEmail(senderEmail)) ||
                (request.Scope != "sender" && !string.IsNullOrWhiteSpace(recipientEmail) && !IsValidEmail(recipientEmail)))
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Enter a sender name and valid sender and recipient email addresses."
                });
            }

            var settings = await _database.EmailSettings
                .SingleOrDefaultAsync(cancellationToken);
            var hasNewPassword =
                !string.IsNullOrWhiteSpace(request.AppPassword);

            if (request.Scope != "destination" && !string.IsNullOrWhiteSpace(senderEmail) &&
                (string.IsNullOrWhiteSpace(senderName) || (!hasNewPassword && string.IsNullOrWhiteSpace(settings?.EncryptedPassword))))
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Enter an app password when configuring email for the first time."
                });
            }

            if (settings is null)
            {
                settings = new EmailSettings();
                _database.EmailSettings.Add(settings);
            }

            if (request.Scope != "destination") {
                settings.SenderName = senderName ?? "Website Contact";
                settings.SenderEmail = senderEmail ?? string.Empty;
            }
            if (request.Scope != "sender") {
                settings.RecipientEmail = recipientEmail ?? string.Empty;
                settings.PublicPhoneNumber = request.PublicPhoneNumber?.Trim() ?? string.Empty;
            }
            settings.UpdatedUtc = DateTimeOffset.UtcNow;

            if (hasNewPassword && request.Scope != "destination")
            {
                settings.EncryptedPassword =
                    _encryption.Encrypt(
                        request.AppPassword!.Trim());
            }

            await _database.SaveChangesAsync(
                cancellationToken);

            return Ok(new
            {
                success = true,
                hasAppPassword = !string.IsNullOrWhiteSpace(settings.EncryptedPassword),
                email = settings.RecipientEmail,
                phone = settings.PublicPhoneNumber
            });
        }

        private static bool IsValidEmail(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            try
            {
                var address = new MailAddress(value);
                return address.Address == value;
            }
            catch
            {
                return false;
            }
        }
    }

    public sealed class UpdateEmailSettingsRequest
    {
        public string? Scope { get; set; }
        public string? SenderName { get; set; }
        public string? SenderEmail { get; set; }
        public string? RecipientEmail { get; set; }
        public string? PublicPhoneNumber { get; set; }
        public string? AppPassword { get; set; }
    }

    public sealed class EmailSettingsResponse
    {
        public string SenderName { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;
        public string RecipientEmail { get; set; } = string.Empty;
        public string PublicPhoneNumber { get; set; } = string.Empty;
        public bool HasAppPassword { get; set; }
    }
}
