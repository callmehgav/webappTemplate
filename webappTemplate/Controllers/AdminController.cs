using System.Security.Claims;
using webappTemplate.Data;
using webappTemplate.Data.Models;
using webappTemplate.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class AdminController : ControllerBase
    {
        private readonly AppDbContext _database;

        private readonly IPasswordHasher<AdminUser>_passwordHasher;

        private readonly InsightsService _insightsService;

        private readonly ILogger<AdminController>_logger;

        public AdminController(
        AppDbContext database,
        IPasswordHasher<AdminUser> passwordHasher,
        InsightsService insightsService,
        ILogger<AdminController> logger)
        {
            _database = database;
            _passwordHasher = passwordHasher;
            _insightsService = insightsService;
            _logger = logger;
        }
        /// <summary>
        /// Verifies the administrator credentials and creates
        /// an encrypted HTTP-only authentication cookie.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] AdminLoginRequest request,
            CancellationToken cancellationToken)
        {
            // Count every submitted login attempt. Passwords and other
            // sensitive values are never written to the logs.
            await _insightsService.AddAsync(
                "login-attempts",
                1,
                cancellationToken);

            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                _logger.LogWarning(
                    "Administrator login rejected because " +
                    "credentials were missing.");
                return await InvalidCredentialsAsync(
                    cancellationToken);
            }

            var normalizedUsername =
                request.Username
                    .Trim()
                    .ToUpperInvariant();

            var administrator =
                await _database.AdminUsers
                    .SingleOrDefaultAsync(
                        user =>
                            user.NormalizedUsername ==
                            normalizedUsername,
                        cancellationToken);

            if (administrator is null)
            {
                _logger.LogWarning(
                    "Administrator login failed from {RemoteAddress}.",
                    HttpContext.Connection
                        .RemoteIpAddress);
                return await InvalidCredentialsAsync(
                    cancellationToken);
            }

            var verificationResult =
                _passwordHasher.VerifyHashedPassword(
                    administrator,
                    administrator.PasswordHash,
                    request.Password);

            if (verificationResult ==
                PasswordVerificationResult.Failed)
            {
                _logger.LogWarning(
                    "Administrator login failed from {RemoteAddress}.",
                    HttpContext.Connection
                        .RemoteIpAddress);
                return await InvalidCredentialsAsync(
                    cancellationToken);
            }

            // Microsoft may recommend rehashing an older password hash
            // when the configured hashing strength changes.
            if (verificationResult ==PasswordVerificationResult.SuccessRehashNeeded)
            {
                administrator.PasswordHash =
                    _passwordHasher.HashPassword(
                        administrator,
                        request.Password);

                _logger.LogInformation(
                    "Administrator password hash was upgraded.");
            }

            var now = DateTimeOffset.UtcNow;

            administrator.LastLoginUtc = now;
            administrator.UpdatedUtc = now;

            await _database.SaveChangesAsync(
                cancellationToken);

            // Only the administrator ID and display username are stored
            // as claims inside the encrypted authentication cookie.
            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    administrator.Id.ToString()),

                new Claim(
                    ClaimTypes.Name,
                    administrator.Username)
            };

            var identity =
                new ClaimsIdentity(
                    claims,
                    CookieAuthenticationDefaults
                        .AuthenticationScheme);

            var principal =
                new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults
                    .AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    // The cookie lasts only for the browser session.
                    // Program.cs controls its maximum lifetime.
                    IsPersistent = false,

                    // Require another login after expiration.
                    AllowRefresh = false
                });

            _logger.LogInformation(
                "Administrator {AdministratorId} logged in.",
                administrator.Id);

            return Ok(
                new
                {
                    success = true,
                    username = administrator.Username
                });
        }

        /// <summary>
        /// Reports whether the browser currently has a valid
        /// administrator authentication cookie.
        /// </summary>
        [Authorize]
        [HttpGet("session")]
        public IActionResult GetSession()
        {
            return Ok(
                new
                {
                    authenticated = true,
                    username = User.Identity?.Name
                });
        }
        /// <summary>
        /// Deletes the administrator authentication cookie.
        /// </summary>
        [Authorize]
        
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var administratorId =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            _logger.LogInformation(
                "Administrator {AdministratorId} logged out.",
                administratorId);

            return Ok(new { success = true });
        }

        private async Task<IActionResult>InvalidCredentialsAsync(CancellationToken cancellationToken)
        {
            await _insightsService.AddAsync(
                "invalid-login-attempts",
                1,
                cancellationToken);

            return Unauthorized(
                new
                {
                    success = false,
                    message = "Invalid credentials."
                });
        }
    }
}