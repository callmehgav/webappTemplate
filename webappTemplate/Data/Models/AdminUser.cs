namespace webappTemplate.Data.Models
{
    public sealed class AdminUser
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public required string Username { get; set; }

        public required string NormalizedUsername { get; set; }

        // Generated and verified by Microsoft's
        // PasswordHasher<AdminUser>.
        public required string PasswordHash { get; set; }

        public DateTimeOffset CreatedUtc { get; set; } =
            DateTimeOffset.UtcNow;

        public DateTimeOffset? LastLoginUtc { get; set; }

        public DateTimeOffset UpdatedUtc { get; set; } =
            DateTimeOffset.UtcNow;
    }
}