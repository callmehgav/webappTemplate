namespace webappTemplate.Data.Models
{
    public sealed class ScheduleSettings
    {
        public int Id { get; set; }
        public bool CalendarEnabled { get; set; } = true;
        public bool RequestsEnabled { get; set; } = true;
        public string BookingButtonLabel { get; set; } = "Request an appointment";
        public string RequestHeading { get; set; } = "Request a time";
        public string ResourceLabel { get; set; } = "Personnel";
        public string DetailsLabel { get; set; } = "Additional details";
        public string TimeZoneId { get; set; } = "America/New_York";
        public int BufferMinutes { get; set; } = 15;
        public int SlotMinutes { get; set; } = 30;
        public string BusinessHoursJson { get; set; } = "[]";
        public string ResourcesJson { get; set; } = "[]";
        public string ServicesJson { get; set; } = "[]";
        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
