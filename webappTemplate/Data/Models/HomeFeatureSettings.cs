namespace webappTemplate.Data.Models
{
    public sealed class HomeFeatureSettings
    {
        public int Id { get; set; }
        public bool YouTubeEnabled { get; set; }
        public string YouTubeUrl { get; set; } = string.Empty;
        public string YouTubeHeading { get; set; } = "Latest on YouTube";
        public bool ServicesEnabled { get; set; } = true;
        public bool GalleryPreviewEnabled { get; set; } = true;
        public bool CalendarPreviewEnabled { get; set; } = true;
        public bool MapEnabled { get; set; }
        public string LocationName { get; set; } = "Find us";
        public string LocationAddress { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int MapZoom { get; set; } = 15;
        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
