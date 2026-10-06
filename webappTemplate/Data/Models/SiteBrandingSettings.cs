namespace webappTemplate.Data.Models
{
    public sealed class SiteBrandingSettings
    {
        public int Id { get; set; }

        public string BackgroundColor { get; set; } = "#e9eef5";

        public bool UseBackgroundImage { get; set; }

        public bool UseAmbientBackground { get; set; } = true;

        public Guid? BackgroundMediaItemId { get; set; }

        public string H1FontFamily { get; set; } = "Georgia";
        public int H1FontSize { get; set; } = 88;
        public string H1Color { get; set; } = "#2b2430";
        public string H2FontFamily { get; set; } = "Georgia";
        public int H2FontSize { get; set; } = 58;
        public string H2Color { get; set; } = "#2b2430";
        public string H3FontFamily { get; set; } = "Georgia";
        public int H3FontSize { get; set; } = 30;
        public string H3Color { get; set; } = "#514252";

        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
