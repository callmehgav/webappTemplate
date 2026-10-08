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
        public string ServicesEyebrow { get; set; } = "What we offer";
        public string ServicesHeading { get; set; } = "Made for memorable gatherings";
        public string ServicesDescription { get; set; } = "Flexible spaces and thoughtful details for celebrations of every size.";
        public string GalleryEyebrow { get; set; } = "A glimpse of the venue";
        public string GalleryHeading { get; set; } = "Picture your day here";
        public string CalendarEyebrow { get; set; } = "Plan ahead";
        public string CalendarHeading { get; set; } = "Find a date that feels right";
        public string CalendarDescription { get; set; } = "Browse current availability, then send the details you have in mind. We’ll help with the rest.";
        public string SocialEyebrow { get; set; } = "Stay connected";
        public string SocialHeading { get; set; } = "Follow along";
        public string ContactHeading { get; set; } = "Contact Us";
        public string MapEyebrow { get; set; } = "Location";
        public string LocationsJson { get; set; } = "[]";
        public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;
    }
}
