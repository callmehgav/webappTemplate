using webappTemplate.Data;
using webappTemplate.Data.DTOs;
using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/media")]
    public sealed class MediaController : ControllerBase
    {
        private readonly AppDbContext _database;

        public MediaController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] MediaUsage? usage,
            CancellationToken cancellationToken)
        {
            var query = _database.MediaItems
                .AsNoTracking();

            if (usage.HasValue)
            {
                query = query.Where(
                    media => media.Usage == usage.Value);
            }

            var mediaItems = await query
                .OrderBy(media => media.OriginalFileName)
                .Select(media => new PublicMediaResponse
                {
                    Id = media.Id,
                    Usage = media.Usage,
                    ContentUrl = string.Empty,
                    ContentType = media.ContentType,
                    AltText = media.AltText,
                    FocalPointX = media.FocalPointX,
                    FocalPointY = media.FocalPointY
                })
                .ToListAsync(cancellationToken);

            foreach (var media in mediaItems)
            {
                media.ContentUrl =
                    $"/api/media/{media.Id}/content";
            }

            return Ok(mediaItems);
        }

        [HttpGet("{id:guid}/content")]
        public async Task<IActionResult> GetContent(
            Guid id,
            CancellationToken cancellationToken)
        {
            var media = await _database.MediaItems
                .AsNoTracking()
                .Where(item => item.Id == id)
                .Select(item => new
                {
                    item.ImageData,
                    item.ContentType
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (media is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Media was not found."
                });
            }

            Response.Headers.CacheControl =
                "public, max-age=31536000, immutable";

            return File(
                media.ImageData,
                media.ContentType,
                enableRangeProcessing:
                    media.ContentType.StartsWith("video/"));
        }
    }
}
