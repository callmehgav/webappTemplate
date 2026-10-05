using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;
using webappTemplate.Data.Models;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/branding")]
    public sealed partial class BrandingController : ControllerBase
    {
        private const long MaximumImageBytes = 10 * 1024 * 1024;
        private const long MaximumRequestBytes = 11 * 1024 * 1024;
        private readonly AppDbContext _database;

        public BrandingController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            return Ok(await CreateResponseAsync(settings, cancellationToken));
        }

        [Authorize]
        [HttpPut("admin/settings")]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] BrandingSettingsRequest request,
            CancellationToken cancellationToken)
        {
            var color = request.BackgroundColor?.Trim() ?? string.Empty;
            if (!HexColorPattern().IsMatch(color))
            {
                return BadRequest(new { message = "Choose a valid six-digit background color." });
            }

            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            if (request.UseBackgroundImage &&
                (!settings.BackgroundMediaItemId.HasValue ||
                 !await _database.MediaItems.AnyAsync(
                     item => item.Id == settings.BackgroundMediaItemId.Value &&
                             item.Usage == MediaUsage.PageBackground,
                     cancellationToken)))
            {
                return BadRequest(new { message = "Upload a background image before selecting image mode." });
            }

            settings.BackgroundColor = color.ToLowerInvariant();
            settings.UseBackgroundImage = request.UseBackgroundImage;
            settings.UseAmbientBackground = !request.UseBackgroundImage && request.UseAmbientBackground;
            settings.UpdatedUtc = DateTimeOffset.UtcNow;
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(await CreateResponseAsync(settings, cancellationToken));
        }

        [Authorize]
        [RequestSizeLimit(MaximumRequestBytes)]
        [HttpPut("admin/background-image")]
        public async Task<IActionResult> ReplaceBackgroundImage(
            [FromForm] BrandingImageRequest request,
            CancellationToken cancellationToken)
        {
            if (request.File is null || request.File.Length == 0)
            {
                return BadRequest(new { message = "Choose a background image first." });
            }

            if (request.File.Length > MaximumImageBytes)
            {
                return BadRequest(new { message = "The background image cannot exceed 10 MB." });
            }

            var contentType = request.File.ContentType.Trim().ToLowerInvariant();
            if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/gif"))
            {
                return BadRequest(new { message = "Use a JPEG, PNG, WebP, or GIF image." });
            }

            byte[] imageData;
            await using (var stream = request.File.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory, cancellationToken);
                imageData = memory.ToArray();
            }

            var existingImages = await _database.MediaItems
                .Where(item => item.Usage == MediaUsage.PageBackground)
                .ToListAsync(cancellationToken);
            _database.MediaItems.RemoveRange(existingImages);

            var image = new MediaItem
            {
                Id = Guid.NewGuid(),
                ImageData = imageData,
                OriginalFileName = Path.GetFileName(request.File.FileName),
                ContentType = contentType,
                ByteLength = imageData.LongLength,
                Usage = MediaUsage.PageBackground,
                AltText = "Site background",
                FocalPointX = 50,
                FocalPointY = 50
            };
            _database.MediaItems.Add(image);

            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            settings.BackgroundMediaItemId = image.Id;
            settings.UseBackgroundImage = true;
            settings.UseAmbientBackground = false;
            settings.UpdatedUtc = DateTimeOffset.UtcNow;
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(await CreateResponseAsync(settings, cancellationToken));
        }

        [Authorize]
        [HttpDelete("admin/background-image")]
        public async Task<IActionResult> RemoveBackgroundImage(CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            var images = await _database.MediaItems
                .Where(item => item.Usage == MediaUsage.PageBackground)
                .ToListAsync(cancellationToken);

            _database.MediaItems.RemoveRange(images);
            settings.BackgroundMediaItemId = null;
            settings.UseBackgroundImage = false;
            settings.UseAmbientBackground = true;
            settings.UpdatedUtc = DateTimeOffset.UtcNow;
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(await CreateResponseAsync(settings, cancellationToken));
        }

        private async Task<SiteBrandingSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
        {
            var settings = await _database.SiteBrandingSettings.SingleOrDefaultAsync(cancellationToken);
            if (settings is not null) return settings;

            settings = new SiteBrandingSettings { Id = 1 };
            _database.SiteBrandingSettings.Add(settings);
            await _database.SaveChangesAsync(cancellationToken);
            return settings;
        }

        private async Task<object> CreateResponseAsync(
            SiteBrandingSettings settings,
            CancellationToken cancellationToken)
        {
            var image = settings.BackgroundMediaItemId.HasValue
                ? await _database.MediaItems.AsNoTracking().SingleOrDefaultAsync(
                    item => item.Id == settings.BackgroundMediaItemId.Value &&
                            item.Usage == MediaUsage.PageBackground,
                    cancellationToken)
                : null;

            return new
            {
                settings.BackgroundColor,
                UseBackgroundImage = settings.UseBackgroundImage && image is not null,
                UseAmbientBackground = settings.UseAmbientBackground &&
                    !(settings.UseBackgroundImage && image is not null),
                BackgroundImage = image is null ? null : new
                {
                    image.Id,
                    image.Usage,
                    ContentUrl = $"/api/media/{image.Id}/content",
                    image.ContentType,
                    image.DisplayOrder,
                    image.AltText,
                    image.FocalPointX,
                    image.FocalPointY
                }
            };
        }

        [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
        private static partial Regex HexColorPattern();
    }

    public sealed record BrandingSettingsRequest(
        string? BackgroundColor,
        bool UseBackgroundImage,
        bool UseAmbientBackground);

    public sealed class BrandingImageRequest
    {
        public IFormFile? File { get; set; }
    }
}
