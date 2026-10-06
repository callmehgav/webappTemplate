using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;
using webappTemplate.Data.Models;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/services")]
    public sealed class ServicesController : ControllerBase
    {
        private const long MaximumImageBytes = 10 * 1024 * 1024;
        private const long MaximumRequestBytes = 11 * 1024 * 1024;
        private readonly AppDbContext _database;

        public ServicesController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetPublic(CancellationToken cancellationToken)
        {
            var items = await _database.ServiceOfferings
                .AsNoTracking()
                .Include(item => item.MediaItem)
                .Where(item => item.IsVisible)
                .OrderBy(item => item.DisplayOrder)
                .ThenBy(item => item.Title)
                .ToListAsync(cancellationToken);

            return Ok(items.Select(ToResponse));
        }

        [Authorize]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdmin(CancellationToken cancellationToken)
        {
            var items = await _database.ServiceOfferings
                .AsNoTracking()
                .Include(item => item.MediaItem)
                .OrderBy(item => item.DisplayOrder)
                .ThenBy(item => item.Title)
                .ToListAsync(cancellationToken);

            return Ok(items.Select(ToResponse));
        }

        [Authorize]
        [HttpPost("admin")]
        public async Task<IActionResult> Create(
            [FromBody] ServiceOfferingRequest request,
            CancellationToken cancellationToken)
        {
            var error = Validate(request);
            if (error is not null) return BadRequest(new { message = error });

            var item = new ServiceOffering { Id = Guid.NewGuid() };
            Apply(item, request);
            _database.ServiceOfferings.Add(item);
            await _database.SaveChangesAsync(cancellationToken);
            return StatusCode(StatusCodes.Status201Created, ToResponse(item));
        }

        [Authorize]
        [HttpPut("admin/{id:guid}")]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] ServiceOfferingRequest request,
            CancellationToken cancellationToken)
        {
            var error = Validate(request);
            if (error is not null) return BadRequest(new { message = error });

            var item = await _database.ServiceOfferings
                .Include(value => value.MediaItem)
                .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
            if (item is null) return NotFound(new { message = "Service was not found." });

            Apply(item, request);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(item));
        }

        [Authorize]
        [RequestSizeLimit(MaximumRequestBytes)]
        [HttpPut("admin/{id:guid}/image")]
        public async Task<IActionResult> ReplaceImage(
            Guid id,
            [FromForm] ServiceImageRequest request,
            CancellationToken cancellationToken)
        {
            var item = await _database.ServiceOfferings
                .Include(value => value.MediaItem)
                .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
            if (item is null) return NotFound(new { message = "Service was not found." });
            if (request.File is null || request.File.Length == 0)
                return BadRequest(new { message = "Choose a service image first." });
            if (request.File.Length > MaximumImageBytes)
                return BadRequest(new { message = "The service image cannot exceed 10 MB." });

            var contentType = request.File.ContentType.Trim().ToLowerInvariant();
            if (contentType is not ("image/jpeg" or "image/png" or "image/webp" or "image/gif"))
                return BadRequest(new { message = "Use a JPEG, PNG, WebP, or GIF image." });

            byte[] imageData;
            await using (var stream = request.File.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory, cancellationToken);
                imageData = memory.ToArray();
            }

            var previousImage = item.MediaItem;
            var image = new MediaItem
            {
                Id = Guid.NewGuid(),
                ImageData = imageData,
                OriginalFileName = Path.GetFileName(request.File.FileName),
                ContentType = contentType,
                ByteLength = imageData.LongLength,
                Usage = MediaUsage.Other,
                AltText = item.Title,
                FocalPointX = 50,
                FocalPointY = 50
            };

            _database.MediaItems.Add(image);
            item.MediaItemId = image.Id;
            item.MediaItem = image;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
            if (previousImage is not null) _database.MediaItems.Remove(previousImage);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(item));
        }

        [Authorize]
        [HttpDelete("admin/{id:guid}/image")]
        public async Task<IActionResult> RemoveImage(Guid id, CancellationToken cancellationToken)
        {
            var item = await _database.ServiceOfferings
                .Include(value => value.MediaItem)
                .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
            if (item is null) return NotFound(new { message = "Service was not found." });

            var image = item.MediaItem;
            item.MediaItemId = null;
            item.MediaItem = null;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
            if (image is not null) _database.MediaItems.Remove(image);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(new { success = true });
        }

        [Authorize]
        [HttpDelete("admin/{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var item = await _database.ServiceOfferings
                .Include(value => value.MediaItem)
                .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
            if (item is null) return NotFound(new { message = "Service was not found." });

            if (item.MediaItem is not null) _database.MediaItems.Remove(item.MediaItem);
            _database.ServiceOfferings.Remove(item);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(new { success = true });
        }

        private static object ToResponse(ServiceOffering item) => new
        {
            item.Id,
            item.Title,
            item.Summary,
            item.DisplayOrder,
            item.IsVisible,
            Image = item.MediaItem is null ? null : new
            {
                item.MediaItem.Id,
                ContentUrl = $"/api/media/{item.MediaItem.Id}/content",
                item.MediaItem.ContentType,
                item.MediaItem.AltText,
                item.MediaItem.FocalPointX,
                item.MediaItem.FocalPointY
            }
        };

        private static void Apply(ServiceOffering item, ServiceOfferingRequest request)
        {
            item.Title = request.Title.Trim();
            item.Summary = request.Summary.Trim();
            item.DisplayOrder = request.DisplayOrder;
            item.IsVisible = request.IsVisible;
            item.UpdatedUtc = DateTimeOffset.UtcNow;
        }

        private static string? Validate(ServiceOfferingRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title)) return "Enter a service title.";
            if (request.Title.Trim().Length > 150) return "The service title cannot exceed 150 characters.";
            if (string.IsNullOrWhiteSpace(request.Summary)) return "Enter a brief service description.";
            if (request.Summary.Trim().Length > 1000) return "The service description cannot exceed 1000 characters.";
            return null;
        }
    }

    public sealed record ServiceOfferingRequest(
        string Title,
        string Summary,
        int DisplayOrder,
        bool IsVisible);

    public sealed class ServiceImageRequest
    {
        public IFormFile? File { get; set; }
    }
}
