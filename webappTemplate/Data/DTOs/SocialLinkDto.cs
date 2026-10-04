using webappTemplate.Data.Models;

namespace webappTemplate.Data.DTOs
{
    public sealed class SaveSocialLinkRequest
    {
        public SocialPlatform Platform { get; set; }

        public SocialLinkDisplayStyle DisplayStyle { get; set; }

        public required string Label { get; set; }

        public string? Handle { get; set; }

        public required string Url { get; set; }

        public Guid? BackgroundMediaItemId { get; set; }

        public int DisplayOrder { get; set; }
    }

    public sealed class SocialLinkResponse
    {
        public Guid Id { get; set; }

        public SocialPlatform Platform { get; set; }

        public SocialLinkDisplayStyle DisplayStyle { get; set; }

        public required string Label { get; set; }

        public string? Handle { get; set; }

        public required string Url { get; set; }

        public Guid? BackgroundMediaItemId { get; set; }

        public BackgroundMediaResponse? BackgroundMedia { get; set; }

        public int DisplayOrder { get; set; }
    }

    public sealed class PublicSocialLinkResponse
    {
        public Guid Id { get; set; }

        public SocialPlatform Platform { get; set; }

        public SocialLinkDisplayStyle DisplayStyle { get; set; }

        public required string Label { get; set; }

        public string? Handle { get; set; }

        public required string Url { get; set; }

        public int DisplayOrder { get; set; }

        public BackgroundMediaResponse? BackgroundMedia { get; set; }
    }

    public sealed class BackgroundMediaResponse
    {
        public Guid Id { get; set; }

        public required string ContentUrl { get; set; }

        public required string ContentType { get; set; }

        public string? AltText { get; set; }

        public double FocalPointX { get; set; }

        public double FocalPointY { get; set; }
    }
}