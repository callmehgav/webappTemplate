namespace webappTemplate.Data.Models
{
    public sealed class ScheduleEvent
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string EventType { get; set; } = "Appointment";
        public string? Resource { get; set; }
        public string Color { get; set; } = "#356bd6";
        public DateTimeOffset StartsAt { get; set; }
        public DateTimeOffset EndsAt { get; set; }
        public bool IsAllDay { get; set; }
        public bool IsBlocked { get; set; }
        public string? Notes { get; set; }
        public DateTimeOffset CreatedUtc { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
