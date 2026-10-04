using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using webappTemplate.Data;

namespace webappTemplate.Services
{
    public interface IEmailService
    {
        Task SendAsync(
            string subject,
            string htmlBody,
            string replyTo,
            CancellationToken cancellationToken = default);

        Task SendToAsync(
            string recipient,
            string subject,
            string htmlBody,
            string replyTo,
            CancellationToken cancellationToken = default);
    }

    public sealed class EmailService : IEmailService
    {
        private readonly AppDbContext _database;
        private readonly CredentialEncryptionService _encryption;
        private readonly SmtpSettings _smtp;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            AppDbContext database,
            CredentialEncryptionService encryption,
            IOptions<AppSettings> appSettings,
            ILogger<EmailService> logger)
        {
            _database = database;
            _encryption = encryption;
            _smtp = appSettings.Value.Smtp;
            _logger = logger;
        }

        public async Task SendAsync(
            string subject,
            string htmlBody,
            string replyTo,
            CancellationToken cancellationToken = default)
        {
            var settings = await GetSettingsAsync(cancellationToken);

            await SendMessageAsync(
                settings,
                settings.RecipientEmail,
                subject,
                htmlBody,
                replyTo,
                cancellationToken);
        }

        public async Task SendToAsync(
            string recipient,
            string subject,
            string htmlBody,
            string replyTo,
            CancellationToken cancellationToken = default)
        {
            var settings = await GetSettingsAsync(cancellationToken);

            await SendMessageAsync(
                settings,
                recipient,
                subject,
                htmlBody,
                replyTo,
                cancellationToken);
        }

        private async Task<Data.Models.EmailSettings> GetSettingsAsync(
            CancellationToken cancellationToken)
        {
            return await _database.EmailSettings
                .AsNoTracking()
                .SingleOrDefaultAsync(cancellationToken)
                ?? throw new InvalidOperationException(
                    "Email settings have not been configured.");
        }

        private async Task SendMessageAsync(
            Data.Models.EmailSettings settings,
            string recipient,
            string subject,
            string htmlBody,
            string replyTo,
            CancellationToken cancellationToken)
        {

            if (string.IsNullOrWhiteSpace(_smtp.Host) ||
                _smtp.Port <= 0)
            {
                throw new InvalidOperationException(
                    "The SMTP server has not been configured.");
            }

            var password = _encryption.Decrypt(
                settings.EncryptedPassword);

            var message = new MimeMessage();
            message.From.Add(
                new MailboxAddress(
                    settings.SenderName,
                    settings.SenderEmail));
            message.To.Add(
                MailboxAddress.Parse(recipient));
            message.ReplyTo.Add(
                MailboxAddress.Parse(replyTo));
            message.Subject = subject;
            message.Body = new BodyBuilder
            {
                HtmlBody = htmlBody
            }.ToMessageBody();

            using var client = new SmtpClient();

            try
            {
                await client.ConnectAsync(
                    _smtp.Host,
                    _smtp.Port,
                    SecureSocketOptions.StartTls,
                    cancellationToken);

                await client.AuthenticateAsync(
                    settings.SenderEmail,
                    password,
                    cancellationToken);

                await client.SendAsync(
                    message,
                    cancellationToken);

                _logger.LogInformation(
                    "Contact email sent to the configured recipient.");
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(
                        true,
                        cancellationToken);
                }
            }
        }
    }
}
