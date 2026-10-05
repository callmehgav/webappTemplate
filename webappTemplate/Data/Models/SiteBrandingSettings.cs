namespace webappTemplate.Data.Models
{
    public sealed class SiteBrandingSettings
    {
        public int Id { get; set; }

        public string BackgroundColor { get; set; } = "#e9eef5";

        public bool UseBackgroundImage { get; set; }

        public bool UseAmbientBackground { get; set; } = true;

        public Guid? BackgroundMediaItemId { get; set; }

        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
