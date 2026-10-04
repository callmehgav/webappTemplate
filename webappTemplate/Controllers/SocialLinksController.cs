using webappTemplate.Data;
using webappTemplate.Data.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/social-links")]
    public sealed class SocialLinksController : ControllerBase
    {
        private readonly AppDbContext _database;

        public SocialLinksController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            CancellationToken cancellationToken)
        {
            var links = await _database.SocialLinks
                .AsNoTracking()
                .OrderBy(link => link.DisplayOrder)
                .ThenBy(link => link.Label)
                .Select(link => new PublicSocialLinkResponse
                {
                    Id = link.Id,
                    Platform = link.Platform,
                    DisplayStyle = link.DisplayStyle,
                    Label = link.Label,
                    Handle = link.Handle,
                    Url = link.Url,
                    DisplayOrder = link.DisplayOrder,

                    BackgroundMedia =
                        link.BackgroundMediaItem == null
                            ? null
                            : new BackgroundMediaResponse
                            {
                                Id =
                                    link.BackgroundMediaItem.Id,
                                ContentUrl = string.Empty,
                                ContentType =
                                    link.BackgroundMediaItem
                                        .ContentType,
                                AltText =
                                    link.BackgroundMediaItem
                                        .AltText,
                                FocalPointX =
                                    link.BackgroundMediaItem
                                        .FocalPointX,
                                FocalPointY =
                                    link.BackgroundMediaItem
                                        .FocalPointY
                            }
                })
                .ToListAsync(cancellationToken);

            foreach (var link in links)
            {
                if (link.BackgroundMedia is not null)
                {
                    link.BackgroundMedia.ContentUrl =
                        $"/api/media/{link.BackgroundMedia.Id}/content";
                }
            }

            return Ok(links);
        }
    }
}