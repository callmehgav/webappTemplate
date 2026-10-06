using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;
using webappTemplate.Data.Models;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/home-features")]
    public sealed class HomeFeaturesController : ControllerBase
    {
        private readonly AppDbContext _database;

        public HomeFeaturesController(AppDbContext database)
        {
            _database = database;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            return Ok(ToResponse(settings));
        }

        [Authorize]
        [HttpPut("admin/settings")]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] HomeFeatureSettingsRequest request,
            CancellationToken cancellationToken)
        {
            var youtubeUrl = request.YouTubeUrl?.Trim() ?? string.Empty;
            if (request.YouTubeEnabled && !IsValidYouTubeUrl(youtubeUrl))
            {
                return BadRequest(new { message = "Enter a valid YouTube URL before enabling the feature." });
            }

            if (request.MapEnabled &&
                (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180))
            {
                return BadRequest(new { message = "Enter valid latitude and longitude coordinates." });
            }

            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            settings.YouTubeEnabled = request.YouTubeEnabled;
            settings.YouTubeUrl = Limit(youtubeUrl, 500);
            settings.YouTubeHeading = Limit(Clean(request.YouTubeHeading, "Latest on YouTube"), 150);
            settings.ServicesEnabled = request.ServicesEnabled;
            settings.GalleryPreviewEnabled = request.GalleryPreviewEnabled;
            settings.CalendarPreviewEnabled = request.CalendarPreviewEnabled;
            settings.MapEnabled = request.MapEnabled;
            settings.LocationName = Limit(Clean(request.LocationName, "Find us"), 150);
            settings.LocationAddress = Limit(request.LocationAddress?.Trim() ?? string.Empty, 500);
            settings.Latitude = Math.Clamp(request.Latitude, -90, 90);
            settings.Longitude = Math.Clamp(request.Longitude, -180, 180);
            settings.MapZoom = Math.Clamp(request.MapZoom, 1, 19);
            settings.UpdatedUtc = DateTimeOffset.UtcNow;

            await _database.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse(settings));
        }

        private async Task<HomeFeatureSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
        {
            var settings = await _database.HomeFeatureSettings.SingleOrDefaultAsync(cancellationToken);
            if (settings is not null) return settings;

            settings = new HomeFeatureSettings { Id = 1 };
            _database.HomeFeatureSettings.Add(settings);
            await _database.SaveChangesAsync(cancellationToken);
            return settings;
        }

        private static object ToResponse(HomeFeatureSettings settings) => new
        {
            settings.YouTubeEnabled,
            settings.YouTubeUrl,
            settings.YouTubeHeading,
            settings.ServicesEnabled,
            settings.GalleryPreviewEnabled,
            settings.CalendarPreviewEnabled,
            settings.MapEnabled,
            settings.LocationName,
            settings.LocationAddress,
            settings.Latitude,
            settings.Longitude,
            settings.MapZoom
        };

        private static bool IsValidYouTubeUrl(string value)
        {
            if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return false;
            }

            var host = uri.Host.ToLowerInvariant();
            return host == "youtu.be" || host.EndsWith(".youtu.be") ||
                   host == "youtube.com" || host.EndsWith(".youtube.com") ||
                   host == "youtube-nocookie.com" || host.EndsWith(".youtube-nocookie.com");
        }

        private static string Clean(string? value, string fallback) =>
            string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        private static string Limit(string value, int maxLength) =>
            value.Length <= maxLength ? value : value[..maxLength];
    }

    public sealed record HomeFeatureSettingsRequest(
        bool YouTubeEnabled,
        string? YouTubeUrl,
        string? YouTubeHeading,
        bool ServicesEnabled,
        bool GalleryPreviewEnabled,
        bool CalendarPreviewEnabled,
        bool MapEnabled,
        string? LocationName,
        string? LocationAddress,
        double Latitude,
        double Longitude,
        int MapZoom);
}
