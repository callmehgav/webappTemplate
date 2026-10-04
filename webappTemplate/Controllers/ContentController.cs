using webappTemplate.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class ContentController : ControllerBase
    {
        private readonly AppDbContext _database;

        public ContentController(
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
                    .Where(item => item.IsVisible)
                    .OrderBy(item => item.ContentKey)
                    .Select(item => new
                    {
                        item.ContentKey,
                        item.Title,
                        item.Content,
                        item.Format
                    })
                    .ToListAsync(cancellationToken);

            return Ok(content);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(
            string key,
            CancellationToken cancellationToken)
        {
            var normalizedKey =
                key.Trim().ToLowerInvariant();

            var content =
                await _database.SiteContent
                    .AsNoTracking()
                    .Where(item =>
                        item.IsVisible &&
                        item.ContentKey ==
                        normalizedKey)
                    .Select(item => new
                    {
                        item.ContentKey,
                        item.Title,
                        item.Content,
                        item.Format
                    })
                    .SingleOrDefaultAsync(
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

            return Ok(content);
        }
    }
}