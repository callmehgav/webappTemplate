using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/contact/settings")]
    public sealed class ContactSettingsController : ControllerBase
    {
        private readonly AppDbContext _database;

        public ContactSettingsController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            CancellationToken cancellationToken)
        {
            var email = await _database.EmailSettings
                .AsNoTracking()
                .Select(settings => settings.RecipientEmail)
                .SingleOrDefaultAsync(cancellationToken);

            return Ok(new
            {
                email = email ?? string.Empty
            });
        }
    }
}
