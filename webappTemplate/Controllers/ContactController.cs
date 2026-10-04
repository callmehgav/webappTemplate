using System.Net.Mail;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using webappTemplate.Data.Models;
using webappTemplate.Services;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<ContactController> _logger;

        public ContactController(
            IEmailService emailService,
            ILogger<ContactController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Post(
            [FromBody] ContactFormModel model)
        {
            if (string.IsNullOrWhiteSpace(model.FirstName) ||
                string.IsNullOrWhiteSpace(model.LastName) ||
                string.IsNullOrWhiteSpace(model.Email) ||
                string.IsNullOrWhiteSpace(model.Message) ||
                !IsValidEmail(model.Email))
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Name, a valid email address, and message are required."
                });
            }

            var encoder = HtmlEncoder.Default;

            var htmlBody =
                $"Name: {encoder.Encode(model.FirstName)} " +
                $"{encoder.Encode(model.LastName)}<br/>" +
                $"Email: {encoder.Encode(model.Email)}<br/>" +
                $"Phone: {encoder.Encode(model.Phone ?? string.Empty)}" +
                "<br/><br/>" +
                "Message:<br/>" +
                encoder.Encode(model.Message)
                    .Replace(
                        Environment.NewLine,
                        "<br/>");

            try
            {
                await _emailService.SendAsync(
                    "New Contact Form Submission",
                    htmlBody,
                    model.Email.Trim(),
                    HttpContext.RequestAborted);

                return Ok(new { success = true });
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Failed to send contact email.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "The message could not be sent."
                    });
            }
        }

        private static bool IsValidEmail(string value)
        {
            try
            {
                var trimmedValue = value.Trim();
                var address = new MailAddress(trimmedValue);
                return address.Address == trimmedValue;
            }
            catch
            {
                return false;
            }
        }
    }
}
