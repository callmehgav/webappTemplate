using System.Text.Json;
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
            if (request.MapEnabled && request.Locations is { Count: 0 })
                return BadRequest(new { message = "Add a location before enabling the map." });
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

            if (request.Locations is { Count: > 20 } || request.Locations?.Any(l => !double.IsFinite(l.Latitude) || !double.IsFinite(l.Longitude) || l.Latitude is < -90 or > 90 || l.Longitude is < -180 or > 180) == true)
                return BadRequest(new { message = "Use up to 20 locations with valid coordinates." });
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            settings.ContactHeading = Limit(request.ContactHeading?.Trim() ?? settings.ContactHeading, 1000);
            settings.MapEyebrow = Limit(request.MapEyebrow?.Trim() ?? settings.MapEyebrow, 1000);
            settings.ServicesEyebrow = Limit(request.ServicesEyebrow?.Trim() ?? "What we offer", 1000);
            settings.ServicesHeading = Limit(request.ServicesHeading?.Trim() ?? "Made for memorable gatherings", 1000);
            settings.ServicesDescription = Limit(request.ServicesDescription?.Trim() ?? "Flexible spaces and thoughtful details for celebrations of every size.", 1000);
            settings.GalleryEyebrow = Limit(request.GalleryEyebrow?.Trim() ?? "A glimpse of the venue", 1000);
            settings.GalleryHeading = Limit(request.GalleryHeading?.Trim() ?? "Picture your day here", 1000);
            settings.CalendarEyebrow = Limit(request.CalendarEyebrow?.Trim() ?? "Plan ahead", 1000);
            settings.CalendarHeading = Limit(request.CalendarHeading?.Trim() ?? "Find a date that feels right", 1000);
            settings.CalendarDescription = Limit(request.CalendarDescription?.Trim() ?? "Browse current availability, then send the details you have in mind. We’ll help with the rest.", 1000);
            settings.SocialEyebrow = Limit(request.SocialEyebrow?.Trim() ?? "Stay connected", 1000);
            settings.SocialHeading = Limit(request.SocialHeading?.Trim() ?? "Follow along", 1000);
            if (request.Locations is not null)
                settings.LocationsJson = JsonSerializer.Serialize(request.Locations.Select(l => new HomeMapLocation(Limit(l.Name?.Trim() ?? "", 150), Limit(l.Address?.Trim() ?? "", 500), l.Latitude, l.Longitude)));
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
            settings.MapZoom,
            settings.ContactHeading,
            settings.MapEyebrow,
            settings.ServicesEyebrow,
            settings.ServicesHeading,
            settings.ServicesDescription,
            settings.GalleryEyebrow,
            settings.GalleryHeading,
            settings.CalendarEyebrow,
            settings.CalendarHeading,
            settings.CalendarDescription,
            settings.SocialEyebrow,
            settings.SocialHeading,
            Locations = JsonSerializer.Deserialize<List<HomeMapLocation>>(settings.LocationsJson)
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
        int MapZoom,
        string? ContactHeading = null,
        string? MapEyebrow = null,
        string? ServicesEyebrow = null,
        string? ServicesHeading = null,
        string? ServicesDescription = null,
        string? GalleryEyebrow = null,
        string? GalleryHeading = null,
        string? CalendarEyebrow = null,
        string? CalendarHeading = null,
        string? CalendarDescription = null,
        string? SocialEyebrow = null,
        string? SocialHeading = null,
        List<HomeMapLocation>? Locations = null);

    public sealed record HomeMapLocation(string? Name, string? Address, double Latitude, double Longitude);
}
