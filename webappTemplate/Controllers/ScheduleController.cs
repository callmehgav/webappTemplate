using System.Net.Mail;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;
using webappTemplate.Data.Models;
using webappTemplate.Services;

namespace webappTemplate.Controllers
{
    [ApiController]
    [Route("api/schedule")]
    public sealed class ScheduleController : ControllerBase
    {
        private readonly AppDbContext _database;
        private readonly IEmailService _emailService;
        private readonly ILogger<ScheduleController> _logger;

        public ScheduleController(
            AppDbContext database,
            IEmailService emailService,
            ILogger<ScheduleController> logger)
        {
            _database = database;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            return Ok(ToSettingsResponse(settings));
        }

        [HttpGet("events")]
        public async Task<IActionResult> GetEvents(
            [FromQuery] DateTimeOffset? from,
            [FromQuery] DateTimeOffset? to,
            CancellationToken cancellationToken)
        {
            var start = (from ?? DateTimeOffset.UtcNow.AddMonths(-3)).UtcDateTime;
            var end = (to ?? DateTimeOffset.UtcNow.AddMonths(12)).UtcDateTime;
            var events = await _database.ScheduleEvents
                .AsNoTracking()
                .Where(item => item.EndsAt >= start && item.StartsAt <= end)
                .OrderBy(item => item.StartsAt)
                .Select(item => new
                {
                    item.Id,
                    title = item.IsBlocked ? "Unavailable" : "Scheduled",
                    item.EventType,
                    item.Label,
                    item.Color,
                    item.StartsAt,
                    item.EndsAt,
                    item.IsAllDay,
                    item.IsBlocked
                })
                .ToListAsync(cancellationToken);

            return Ok(events);
        }

        [HttpPost("requests")]
        public async Task<IActionResult> SubmitRequest(
            [FromBody] BookingRequest request,
            CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);

            if (!settings.RequestsEnabled)
            {
                return BadRequest(new { success = false, message = "Booking requests are currently closed." });
            }

            if (string.IsNullOrWhiteSpace(request.Name) ||
                !IsValidEmail(request.Email) ||
                string.IsNullOrWhiteSpace(request.Phone) ||
                request.RequestedAt == default ||
                !request.ConsentAccepted)
            {
                return BadRequest(new { success = false, message = "Complete the required contact, time, and consent fields." });
            }

            var requestedLocal = DateTime.SpecifyKind(request.RequestedAt, DateTimeKind.Unspecified);
            var requestStart = ConvertToUtc(requestedLocal, settings.TimeZoneId);
            var buffer = TimeSpan.FromMinutes(Math.Max(settings.BufferMinutes, 0));
            var requestEnd = requestStart.AddMinutes(Math.Max(settings.SlotMinutes, 1));
            var conflict = await _database.ScheduleEvents.AnyAsync(item =>
                item.StartsAt < requestEnd.Add(buffer) &&
                item.EndsAt.AddMinutes(settings.BufferMinutes) > requestStart,
                cancellationToken);

            var encoder = HtmlEncoder.Default;
            string Safe(string? value) => encoder.Encode(value?.Trim() ?? string.Empty);
            var services = request.Services?.Where(value => !string.IsNullOrWhiteSpace(value)) ?? [];
            var details = Safe(request.AdditionalDetails).Replace("\n", "<br/>");
            var html = $"""
                <h2>New scheduling request</h2>
                <p><strong>Customer:</strong> {Safe(request.Name)}<br/>
                <strong>Email:</strong> {Safe(request.Email)}<br/>
                <strong>Phone:</strong> {Safe(request.Phone)}<br/>
                <strong>Customer status:</strong> {Safe(request.CustomerStatus)}<br/>
                <strong>Requested time:</strong> {requestedLocal:dddd, MMMM d, yyyy h:mm tt} ({Safe(settings.TimeZoneId)})<br/>
                <strong>{Safe(settings.LabelFieldName)}:</strong> {Safe(request.Label)}<br/>
                <strong>Services:</strong> {Safe(string.Join(", ", services))}</p>
                <p><strong>{Safe(settings.DetailsLabel)}:</strong><br/>{details}</p>
                {(conflict ? "<p><strong>Calendar warning:</strong> This request overlaps a scheduled or buffered time.</p>" : string.Empty)}
                """;

            try
            {
                await _emailService.SendAsync(
                    $"Scheduling request from {request.Name.Trim()}",
                    html,
                    request.Email.Trim(),
                    cancellationToken);

                await _emailService.SendToAsync(
                    request.Email.Trim(),
                    "We received your scheduling request",
                    $"<p>Thanks, {Safe(request.Name)}. We received your request for <strong>{requestedLocal:dddd, MMMM d, yyyy h:mm tt}</strong> ({Safe(settings.TimeZoneId)}).</p><p>This is not a confirmed booking. We will contact you after reviewing availability.</p>",
                    request.Email.Trim(),
                    cancellationToken);

                return Ok(new { success = true, conflict });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to send scheduling request email.");
                return StatusCode(500, new { success = false, message = "The request could not be sent." });
            }
        }

        [Authorize]
        [HttpGet("admin/events")]
        public async Task<IActionResult> GetAdminEvents(CancellationToken cancellationToken)
        {
            var cutoff = DateTime.UtcNow.AddMonths(-3);
            var events = await _database.ScheduleEvents
                .AsNoTracking()
                .Where(item => item.EndsAt >= cutoff)
                .OrderBy(item => item.StartsAt)
                .ToListAsync(cancellationToken);
            return Ok(events);
        }

        [Authorize]
        [HttpPut("admin/settings")]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] ScheduleSettingsRequest request,
            CancellationToken cancellationToken)
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            settings.CalendarEnabled = request.CalendarEnabled;
            settings.RequestsEnabled = request.RequestsEnabled;
            settings.BookingButtonLabel = Clean(request.BookingButtonLabel, "Request an appointment");
            settings.RequestHeading = Clean(request.RequestHeading, "Request a time");
            settings.LabelFieldName = Clean(request.LabelFieldName, "Label");
            settings.DetailsLabel = Clean(request.DetailsLabel, "Additional details");
            settings.TimeZoneId = Clean(request.TimeZoneId, "America/New_York");
            settings.BufferMinutes = Math.Clamp(request.BufferMinutes, 0, 240);
            settings.SlotMinutes = Math.Clamp(request.SlotMinutes, 5, 240);
            settings.BusinessHoursJson = JsonSerializer.Serialize(request.BusinessHours ?? []);
            settings.LabelsJson = JsonSerializer.Serialize(request.Labels ?? []);
            settings.ServicesJson = JsonSerializer.Serialize(request.Services ?? []);
            settings.UpdatedUtc = DateTimeOffset.UtcNow;
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(ToSettingsResponse(settings));
        }

        [Authorize]
        [HttpPost("admin/events")]
        public async Task<IActionResult> CreateEvent(
            [FromBody] ScheduleEventRequest request,
            CancellationToken cancellationToken)
        {
            var validation = ValidateEvent(request);
            if (validation is not null) return BadRequest(new { message = validation });

            var item = new ScheduleEvent { Id = Guid.NewGuid() };
            ApplyEvent(item, request);
            _database.ScheduleEvents.Add(item);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(item);
        }

        [Authorize]
        [HttpPut("admin/events/{id:guid}")]
        public async Task<IActionResult> UpdateEvent(
            Guid id,
            [FromBody] ScheduleEventRequest request,
            CancellationToken cancellationToken)
        {
            var validation = ValidateEvent(request);
            if (validation is not null) return BadRequest(new { message = validation });

            var item = await _database.ScheduleEvents.FindAsync([id], cancellationToken);
            if (item is null) return NotFound();
            ApplyEvent(item, request);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(item);
        }

        [Authorize]
        [HttpDelete("admin/events/{id:guid}")]
        public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken cancellationToken)
        {
            var item = await _database.ScheduleEvents.FindAsync([id], cancellationToken);
            if (item is null) return NotFound();
            _database.ScheduleEvents.Remove(item);
            await _database.SaveChangesAsync(cancellationToken);
            return Ok(new { success = true });
        }

        private async Task<ScheduleSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
        {
            var settings = await _database.ScheduleSettings.SingleOrDefaultAsync(cancellationToken);
            if (settings is not null) return settings;
            settings = new ScheduleSettings { Id = 1 };
            _database.ScheduleSettings.Add(settings);
            await _database.SaveChangesAsync(cancellationToken);
            return settings;
        }

        private static object ToSettingsResponse(ScheduleSettings settings) => new
        {
            settings.CalendarEnabled,
            settings.RequestsEnabled,
            settings.BookingButtonLabel,
            settings.RequestHeading,
            settings.LabelFieldName,
            settings.DetailsLabel,
            settings.TimeZoneId,
            settings.BufferMinutes,
            settings.SlotMinutes,
            businessHours = Deserialize<List<BusinessHours>>(settings.BusinessHoursJson) ?? [],
            labels = Deserialize<List<CalendarLabel>>(settings.LabelsJson) ?? [],
            services = Deserialize<List<string>>(settings.ServicesJson) ?? []
        };

        private static T? Deserialize<T>(string json)
        {
            try { return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
            catch { return default; }
        }

        private static void ApplyEvent(ScheduleEvent item, ScheduleEventRequest request)
        {
            item.Title = request.Title.Trim();
            item.EventType = Clean(request.EventType, "Other");
            var isClosed = item.EventType.Equals("Closed", StringComparison.OrdinalIgnoreCase);
            item.Label = isClosed || string.IsNullOrWhiteSpace(request.Label)
                ? null
                : request.Label.Trim();
            item.Color = Clean(request.Color, "#356bd6");
            item.StartsAt = request.StartsAt.UtcDateTime;
            item.EndsAt = request.EndsAt.UtcDateTime;
            item.IsAllDay = request.IsAllDay || isClosed;
            item.IsBlocked = item.IsAllDay || isClosed;
            item.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
            item.UpdatedUtc = DateTimeOffset.UtcNow;
        }

        private static string? ValidateEvent(ScheduleEventRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title)) return "An event name is required.";
            if (request.EndsAt <= request.StartsAt) return "The event must end after it starts.";
            return null;
        }

        private static string Clean(string? value, string fallback) =>
            string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        private static bool IsValidEmail(string value)
        {
            try { return new MailAddress(value.Trim()).Address == value.Trim(); }
            catch { return false; }
        }

        private static DateTime ConvertToUtc(DateTime local, string timeZoneId)
        {
            try
            {
                var timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
                return TimeZoneInfo.ConvertTimeToUtc(local, timeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.SpecifyKind(local, DateTimeKind.Utc);
            }
            catch (InvalidTimeZoneException)
            {
                return DateTime.SpecifyKind(local, DateTimeKind.Utc);
            }
        }
    }

    public sealed record BusinessHours(int DayOfWeek, string Start, string End, bool IsClosed);
    public sealed record CalendarLabel(string Name, string Color);
    public sealed record ScheduleSettingsRequest(
        bool CalendarEnabled,
        bool RequestsEnabled,
        string BookingButtonLabel,
        string RequestHeading,
        string LabelFieldName,
        string DetailsLabel,
        string TimeZoneId,
        int BufferMinutes,
        int SlotMinutes,
        List<BusinessHours>? BusinessHours,
        List<CalendarLabel>? Labels,
        List<string>? Services);
    public sealed record ScheduleEventRequest(
        string Title,
        string EventType,
        string? Label,
        string Color,
        DateTimeOffset StartsAt,
        DateTimeOffset EndsAt,
        bool IsAllDay,
        string? Notes);
    public sealed record BookingRequest(
        string Name,
        string Email,
        string Phone,
        DateTime RequestedAt,
        string CustomerStatus,
        string? Label,
        List<string>? Services,
        string? AdditionalDetails,
        bool ConsentAccepted);
}
