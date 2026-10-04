using System.Security.Claims;
using webappTemplate.Data;
using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/admin/content")]
    public sealed class AdminContentController
        : ControllerBase
    {
        private readonly AppDbContext _database;

        public AdminContentController(
            AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            CancellationToken cancellationToken)
        {
            var content =
                await _database.SiteContent
                    .AsNoTracking()
                    .OrderBy(item => item.ContentKey)
                    .Select(item => new
                    {
                        item.Id,
                        item.ContentKey,
                        item.Title,
                        item.Content,
                        item.Format,
                        item.IsVisible,
                        item.ConcurrencyStamp,
                        item.UpdatedUtc
                    })
                    .ToListAsync(cancellationToken);

            return Ok(content);
        }

        
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] UpdateContentRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(
                    new
                    {
                        success = false,
                        message = "Content is required."
                    });
            }

            var content =
                await _database.SiteContent
                    .SingleOrDefaultAsync(
                        item => item.Id == id,
                        cancellationToken);

            if (content is null)
            {
                return NotFound(
                    new
                    {
                        success = false,
                        message = "Content was not found."
                    });
            }

            if (!string.Equals(
                    content.ConcurrencyStamp,
                    request.ConcurrencyStamp,
                    StringComparison.Ordinal))
            {
                return Conflict(
                    new
                    {
                        success = false,
                        message =
                            "This content was changed by another request."
                    });
            }

            if (!Guid.TryParse(
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier),
                    out var administratorId))
            {
                return Unauthorized();
            }

            content.Title =
                string.IsNullOrWhiteSpace(request.Title)
                    ? null
                    : request.Title.Trim();

            content.Content = request.Content;
            content.Format = request.Format;
            content.IsVisible = request.IsVisible;
            content.UpdatedByAdminUserId =
                administratorId;
            content.UpdatedUtc =
                DateTimeOffset.UtcNow;
            content.ConcurrencyStamp =
                Guid.NewGuid().ToString("N");

            try
            {
                await _database.SaveChangesAsync(
                    cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(
                    new
                    {
                        success = false,
                        message =
                            "This content was changed by another request."
                    });
            }

            return Ok(
                new
                {
                    success = true,
                    content.Id,
                    content.ContentKey,
                    content.Title,
                    content.Content,
                    content.Format,
                    content.IsVisible,
                    content.ConcurrencyStamp,
                    content.UpdatedUtc
                });
        }

        public sealed class UpdateContentRequest
        {
            public string? Title { get; set; }

            public required string Content { get; set; }

            public SiteContentFormat Format { get; set; }

            public bool IsVisible { get; set; }

            public required string ConcurrencyStamp
            {
                get;
                set;
            }
        }
    }
}