using webappTemplate.Data;
using webappTemplate.Data.DTOs;
using webappTemplate.Data.Models;
using webappTemplate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/admin/social-links")]
    public sealed class AdminSocialLinksController : ControllerBase
    {
        private readonly AppDbContext _database;

        private readonly MediaAssetService _mediaAssets;

        public AdminSocialLinksController(
            AppDbContext database,
            MediaAssetService mediaAssets)
        {
            _database = database;
            _mediaAssets = mediaAssets;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll(
            CancellationToken cancellationToken)
        {
            var links = await CreateResponseQuery()
                .OrderBy(link => link.DisplayOrder)
                .ThenBy(link => link.Label)
                .ToListAsync(cancellationToken);

            AddBackgroundContentUrls(links);

            return Ok(links);
        }

        
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] SaveSocialLinkRequest request,
            CancellationToken cancellationToken)
        {
            var validationError = await ValidateRequestAsync(
                request,
                cancellationToken);

            if (validationError is not null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = validationError
                });
            }

            var link = new SocialLink
            {
                Id = Guid.NewGuid(),
                Platform = request.Platform,
                DisplayStyle = request.DisplayStyle,
                Label = request.Label.Trim(),
                Handle = NormalizeOptional(request.Handle),
                Url = request.Url.Trim(),
                BackgroundMediaItemId =
                    GetBackgroundMediaId(request),
                DisplayOrder = request.DisplayOrder
            };

            _database.SocialLinks.Add(link);
            await _database.SaveChangesAsync(cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                await GetResponseAsync(
                    link.Id,
                    cancellationToken));
        }

        
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
        Guid id,
        [FromBody] SaveSocialLinkRequest request,
        CancellationToken cancellationToken)
        {
            var validationError = await ValidateRequestAsync(
                request,
                cancellationToken);

            if (validationError is not null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = validationError
                });
            }

            var link = await _database.SocialLinks.FindAsync(
                new object[] { id },
                cancellationToken);

            if (link is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Social link was not found."
                });
            }

            var previousImageId = link.BackgroundMediaItemId;
            var nextImageId = GetBackgroundMediaId(request);

            link.Platform = request.Platform;
            link.DisplayStyle = request.DisplayStyle;
            link.Label = request.Label.Trim();
            link.Handle = NormalizeOptional(request.Handle);
            link.Url = request.Url.Trim();
            link.BackgroundMediaItemId = nextImageId;
            link.DisplayOrder = request.DisplayOrder;

            await _mediaAssets.ReplaceAsync(
                previousImageId,
                nextImageId,
                cancellationToken);

            await _database.SaveChangesAsync(cancellationToken);

            return Ok(await GetResponseAsync(
                id,
                cancellationToken));
        }

        
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
        {
            var link = await _database.SocialLinks.FindAsync(
                new object[] { id },
                cancellationToken);

            if (link is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Social link was not found."
                });
            }

            var imageId = link.BackgroundMediaItemId;

            _database.SocialLinks.Remove(link);

            await _mediaAssets.DeleteAsync(
                imageId,
                cancellationToken);

            await _database.SaveChangesAsync(cancellationToken);

            return Ok(new { success = true });
        }

        private async Task<string?> ValidateRequestAsync(
            SaveSocialLinkRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Label))
            {
                return "A label is required.";
            }

            if (string.IsNullOrWhiteSpace(request.Url) ||
                !IsValidWebUrl(request.Url))
            {
                return "A valid HTTP or HTTPS URL is required.";
            }

            if (!Enum.IsDefined(request.Platform))
            {
                return "The selected social platform is invalid.";
            }

            if (!Enum.IsDefined(request.DisplayStyle))
            {
                return "The selected display style is invalid.";
            }

            if (
                request.DisplayStyle ==
                    SocialLinkDisplayStyle.TitleCard &&
                request.BackgroundMediaItemId.HasValue)
            {
                var imageExists = await _database.MediaItems.AnyAsync(
                    media =>
                        media.Id ==
                            request.BackgroundMediaItemId.Value &&
                        media.Usage ==
                            MediaUsage.LinkTitleCard,
                    cancellationToken);

                if (!imageExists)
                {
                    return "The selected title-card image does not exist.";
                }
            }

            return null;
        }

        private async Task<SocialLinkResponse?> GetResponseAsync(
            Guid id,
            CancellationToken cancellationToken)
        {
            var link = await CreateResponseQuery()
                .SingleOrDefaultAsync(
                    item => item.Id == id,
                    cancellationToken);

            if (link is not null)
            {
                AddBackgroundContentUrl(link);
            }

            return link;
        }

        private IQueryable<SocialLinkResponse> CreateResponseQuery()
        {
            return _database.SocialLinks
                .AsNoTracking()
                .Select(link => new SocialLinkResponse
                {
                    Id = link.Id,
                    Platform = link.Platform,
                    DisplayStyle = link.DisplayStyle,
                    Label = link.Label,
                    Handle = link.Handle,
                    Url = link.Url,
                    BackgroundMediaItemId =
                        link.BackgroundMediaItemId,
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
                });
        }

        private static Guid? GetBackgroundMediaId(
            SaveSocialLinkRequest request)
        {
            return request.DisplayStyle ==
                   SocialLinkDisplayStyle.TitleCard
                ? request.BackgroundMediaItemId
                : null;
        }

        private static void AddBackgroundContentUrls(
            IEnumerable<SocialLinkResponse> links)
        {
            foreach (var link in links)
            {
                AddBackgroundContentUrl(link);
            }
        }

        private static void AddBackgroundContentUrl(
            SocialLinkResponse link)
        {
            if (link.BackgroundMedia is not null)
            {
                link.BackgroundMedia.ContentUrl =
                    $"/api/media/{link.BackgroundMedia.Id}/content";
            }
        }

        private static bool IsValidWebUrl(string value)
        {
            if (!Uri.TryCreate(
                value.Trim(),
                UriKind.Absolute,
                out var uri))
            {
                return false;
            }

            return uri.Scheme == Uri.UriSchemeHttp ||
                   uri.Scheme == Uri.UriSchemeHttps;
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }
}