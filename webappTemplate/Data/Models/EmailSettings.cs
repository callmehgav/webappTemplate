namespace webappTemplate.Data.Models
{
    public sealed class EmailSettings
    {
        public int Id { get; set; }

        public string SenderName { get; set; } =
            "Website Contact";

        public string SenderEmail { get; set; } =
            string.Empty;

        public string RecipientEmail { get; set; } =
            string.Empty;

        public string PublicPhoneNumber { get; set; } =
            string.Empty;

        public string EncryptedPassword { get; set; } =
            string.Empty;

        public DateTimeOffset UpdatedUtc { get; set; } =
            DateTimeOffset.UtcNow;
    }
}
