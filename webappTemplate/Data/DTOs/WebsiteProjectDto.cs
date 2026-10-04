namespace webappTemplate.Data.DTOs
{
    public sealed class SaveWebsiteProjectRequest
    {
        public required string EyebrowText { get; set; }

        public required string TitleText { get; set; }

        public required string Subtext { get; set; }

        public string? Url { get; set; }

        public string? StatusText { get; set; }

        public Guid? ThumbnailMediaItemId { get; set; }

        public int DisplayOrder { get; set; }
    }

    public sealed class WebsiteProjectResponse
    {
        public Guid Id { get; set; }

        public required string EyebrowText { get; set; }

        public required string TitleText { get; set; }

        public required string Subtext { get; set; }

        public string? Url { get; set; }

        public string? StatusText { get; set; }

        public Guid? ThumbnailMediaItemId { get; set; }

        public WebsiteProjectThumbnailResponse? Thumbnail { get; set; }

        public int DisplayOrder { get; set; }
    }

    public sealed class WebsiteProjectThumbnailResponse
    {
        public Guid Id { get; set; }

        public required string ContentUrl { get; set; }

        public required string ContentType { get; set; }

        public string? AltText { get; set; }
    }
}