namespace webappTemplate.Data.DTOs
{
    public sealed class InsightsEventDto
    {
        public required string Key { get; set; }

        public long Amount { get; set; } = 1;
    }
}
