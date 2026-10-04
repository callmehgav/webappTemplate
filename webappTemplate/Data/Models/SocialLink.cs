namespace webappTemplate.Data.Models
{
    public enum SocialPlatform
    {
        Custom = 0,
        YouTube = 1,
        Instagram = 2,
        TikTok = 3,
        AppleMusic = 4,
        GitHub = 5,
        LinkedIn = 6,
        Facebook = 7,
        Website = 8
    }

    public enum SocialLinkDisplayStyle
    {
        Compact = 0,
        TitleCard = 1
    }

    public sealed class SocialLink
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public SocialPlatform Platform { get; set; }

        public SocialLinkDisplayStyle DisplayStyle { get; set; }

        public required string Label { get; set; }

        public string? Handle { get; set; }

        public required string Url { get; set; }

        public Guid? BackgroundMediaItemId { get; set; }

        public MediaItem? BackgroundMediaItem { get; set; }

        public int DisplayOrder { get; set; }
    }
}