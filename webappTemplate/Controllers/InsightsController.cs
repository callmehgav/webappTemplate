using webappTemplate.Services;
using webappTemplate.Data.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using webappTemplate.Data.Models;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class InsightsController : ControllerBase
    {
        private readonly InsightsService _insightsService;

        public InsightsController(
            InsightsService insightsService)
        {
            _insightsService = insightsService;
        }

        [HttpPost("track")]
        public async Task<IActionResult> Track(
            [FromBody] InsightsEventDto dto,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(dto.Key))
            {
                return BadRequest(
                    new
                    {
                        success = false,
                        message = "An insight key is required."
                    });
            }

            if (dto.Amount <= 0)
            {
                return BadRequest(
                    new
                    {
                        success = false,
                        message =
                            "The amount must be greater than zero."
                    });
            }

            await _insightsService.AddAsync(
                dto.Key,
                dto.Amount,
                cancellationToken);

            return Ok(new { success = true });
        }

        [Authorize]
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            CancellationToken cancellationToken)
        {
            var insights =
                await _insightsService.GetAllAsync(
                    cancellationToken);

            return Ok(insights);
        }
    }
}