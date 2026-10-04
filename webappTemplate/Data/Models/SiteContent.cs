namespace webappTemplate.Data.Models
{
    public enum SiteContentFormat
    {
        PlainText = 0,
        Markdown = 1
    }

    public sealed class SiteContent
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // Stable identifier such as about.body.
        public required string ContentKey { get; set; }

        public string? Title { get; set; }

        public required string Content { get; set; }

        public SiteContentFormat Format { get; set; } =
            SiteContentFormat.Markdown;

        public bool IsVisible { get; set; } = true;

        // Records which administrator last changed the content.
        public Guid? UpdatedByAdminUserId { get; set; }

        public AdminUser? UpdatedByAdminUser { get; set; }

        // The API changes this value after every successful update.
        // An outdated value indicates that another edit occurred first.
        public string ConcurrencyStamp { get; set; } =
            Guid.NewGuid().ToString("N");

        public DateTimeOffset CreatedUtc { get; set; } =
            DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedUtc { get; set; } =
            DateTimeOffset.UtcNow;
    }
}