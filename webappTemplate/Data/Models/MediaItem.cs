namespace webappTemplate.Data.Models
{
    public enum MediaUsage
    {
        Other = 0,
        LinkTitleCard = 1,
        AboutBackground = 2,
        AboutProfilePicture = 3,
        ContactBackground = 4,
        WebsiteThumbnail = 5,
        SiteLogo = 6,
        HeroMedia = 7
    }

    public sealed class MediaItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // The original image or video bytes stored as a SQLite BLOB.
        public required byte[] ImageData { get; set; }

        public required string OriginalFileName { get; set; }

        // Examples: image/png, image/webp, video/mp4, and video/webm.
        public required string ContentType { get; set; }

        // Stored separately so admin lists do not need to load the BLOB.
        public long ByteLength { get; set; }

        // Determines where the image can be used on the website.
        public MediaUsage Usage { get; set; }

        public string? AltText { get; set; }

        // Percentage-based crop position.
        public double FocalPointX { get; set; } = 50;

        public double FocalPointY { get; set; } = 50;
    }
}
