using webappTemplate.Data;
using webappTemplate.Data.DTOs;
using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/admin/media")]
    public sealed class AdminMediaController : ControllerBase
    {
        private const long MaximumImageBytes = 10 * 1024 * 1024;
        private const long MaximumRequestBytes = 11 * 1024 * 1024;
        private const long MaximumHeroMediaBytes = 50 * 1024 * 1024;
        private const long MaximumHeroRequestBytes = 51 * 1024 * 1024;

        private readonly AppDbContext _database;

        public AdminMediaController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] MediaUsage? usage,
            CancellationToken cancellationToken)
        {
            var query = _database.MediaItems.AsNoTracking();

            if (usage.HasValue)
            {
                query = query.Where(
                    media => media.Usage == usage.Value);
            }

            var mediaItems = await query
                .OrderBy(media => media.Usage)
                .ThenBy(media => media.OriginalFileName)
                .Select(media => new AdminMediaResponse
                {
                    Id = media.Id,
                    Usage = media.Usage,
                    OriginalFileName = media.OriginalFileName,
                    ContentType = media.ContentType,
                    ContentUrl = string.Empty,
                    ByteLength = media.ByteLength,
                    AltText = media.AltText,
                    FocalPointX = media.FocalPointX,
                    FocalPointY = media.FocalPointY
                })
                .ToListAsync(cancellationToken);

            foreach (var media in mediaItems)
            {
                media.ContentUrl = CreateContentUrl(media.Id);
            }

            return Ok(mediaItems);
        }

        [RequestSizeLimit(MaximumRequestBytes)]
        [HttpPut("site-logo")]
        public async Task<IActionResult> ReplaceSiteLogo(
            [FromForm] ReplaceMediaRequest request,
            CancellationToken cancellationToken)
        {
            if (request.File is null || request.File.Length == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A logo image is required."
                });
            }

            if (request.File.Length > MaximumImageBytes)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The logo cannot exceed 10 MB."
                });
            }

            var contentType = request.File.ContentType
                .Trim()
                .ToLowerInvariant();

            if (contentType is not (
                "image/jpeg" or
                "image/png" or
                "image/webp" or
                "image/gif"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Only JPEG, PNG, WebP, and GIF images are supported."
                });
            }

            byte[] imageData;

            await using (var stream = request.File.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory, cancellationToken);
                imageData = memory.ToArray();
            }

            var existingLogos = await _database.MediaItems
                .Where(media => media.Usage == MediaUsage.SiteLogo)
                .ToListAsync(cancellationToken);

            _database.MediaItems.RemoveRange(existingLogos);

            var logo = new MediaItem
            {
                Id = Guid.NewGuid(),
                ImageData = imageData,
                OriginalFileName = Path.GetFileName(request.File.FileName),
                ContentType = contentType,
                ByteLength = imageData.LongLength,
                Usage = MediaUsage.SiteLogo,
                AltText = "Site logo",
                FocalPointX = 50,
                FocalPointY = 50
            };

            _database.MediaItems.Add(logo);
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(CreateResponse(logo));
        }

        [RequestSizeLimit(MaximumHeroRequestBytes)]
        [HttpPut("hero-media")]
        public async Task<IActionResult> ReplaceHeroMedia(
            [FromForm] ReplaceMediaRequest request,
            CancellationToken cancellationToken)
        {
            if (request.File is null || request.File.Length == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A hero image or video is required."
                });
            }

            if (request.File.Length > MaximumHeroMediaBytes)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The hero image or video cannot exceed 50 MB."
                });
            }

            var contentType = request.File.ContentType
                .Trim()
                .ToLowerInvariant();

            if (contentType is not (
                "image/jpeg" or
                "image/png" or
                "image/webp" or
                "image/gif" or
                "video/mp4" or
                "video/webm"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Use a JPEG, PNG, WebP, GIF, MP4, or WebM file."
                });
            }

            byte[] mediaData;

            await using (var stream = request.File.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory, cancellationToken);
                mediaData = memory.ToArray();
            }

            var existingHeroMedia = await _database.MediaItems
                .Where(media => media.Usage == MediaUsage.HeroMedia)
                .ToListAsync(cancellationToken);

            _database.MediaItems.RemoveRange(existingHeroMedia);

            var heroMedia = new MediaItem
            {
                Id = Guid.NewGuid(),
                ImageData = mediaData,
                OriginalFileName = Path.GetFileName(request.File.FileName),
                ContentType = contentType,
                ByteLength = mediaData.LongLength,
                Usage = MediaUsage.HeroMedia,
                AltText = "Hero background",
                FocalPointX = 50,
                FocalPointY = 50
            };

            _database.MediaItems.Add(heroMedia);
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(CreateResponse(heroMedia));
        }

        
        [RequestSizeLimit(MaximumRequestBytes)]
        [HttpPost]
        public async Task<IActionResult> Upload(
            [FromForm] UploadMediaRequest request,
            CancellationToken cancellationToken)
        {
            if (request.File is null ||
                request.File.Length == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "An image file is required."
                });
            }

            if (request.File.Length > MaximumImageBytes)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The image cannot exceed 10 MB."
                });
            }

            if (!Enum.IsDefined(request.Usage))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The image usage is invalid."
                });
            }

            if (request.Usage is MediaUsage.SiteLogo or MediaUsage.HeroMedia)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Use the Branding settings for site logo and hero media uploads."
                });
            }

            var contentType = request.File.ContentType
                .Trim()
                .ToLowerInvariant();

            if (contentType is not (
                "image/jpeg" or
                "image/png" or
                "image/webp" or
                "image/gif"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Only JPEG, PNG, WebP, and GIF images are supported."
                });
            }

            byte[] imageData;

            await using (var stream = request.File.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory, cancellationToken);
                imageData = memory.ToArray();
            }

            var media = new MediaItem
            {
                Id = Guid.NewGuid(),
                ImageData = imageData,
                OriginalFileName = Path.GetFileName(request.File.FileName),
                ContentType = contentType,
                ByteLength = imageData.LongLength,
                Usage = request.Usage,
                AltText = NormalizeOptional(request.AltText),
                FocalPointX = request.FocalPointX,
                FocalPointY = request.FocalPointY
            };

            _database.MediaItems.Add(media);
            await _database.SaveChangesAsync(cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                CreateResponse(media));
        }

        
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] UpdateMediaRequest request,
            CancellationToken cancellationToken)
        {
            var media = await _database.MediaItems.FindAsync(
                new object[] { id },
                cancellationToken);

            if (media is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Image was not found."
                });
            }

            media.AltText = NormalizeOptional(request.AltText);
            media.FocalPointX = request.FocalPointX;
            media.FocalPointY = request.FocalPointY;

            await _database.SaveChangesAsync(cancellationToken);

            return Ok(CreateResponse(media));
        }

        
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(
            Guid id,
            CancellationToken cancellationToken)
        {
            var media = await _database.MediaItems.FindAsync(
                new object[] { id },
                cancellationToken);

            if (media is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Image was not found."
                });
            }

            _database.MediaItems.Remove(media);
            await _database.SaveChangesAsync(cancellationToken);

            return Ok(new { success = true });
        }

        private static AdminMediaResponse CreateResponse(
            MediaItem media)
        {
            return new AdminMediaResponse
            {
                Id = media.Id,
                Usage = media.Usage,
                OriginalFileName = media.OriginalFileName,
                ContentType = media.ContentType,
                ContentUrl = CreateContentUrl(media.Id),
                ByteLength = media.ByteLength,
                AltText = media.AltText,
                FocalPointX = media.FocalPointX,
                FocalPointY = media.FocalPointY
            };
        }

        private static string CreateContentUrl(Guid id)
        {
            return $"/api/media/{id}/content";
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }

    public sealed class ReplaceMediaRequest
    {
        public IFormFile? File { get; set; }
    }
}
