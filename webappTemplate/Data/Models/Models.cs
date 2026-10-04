using System.Text.Json.Serialization;

namespace webappTemplate.Data.Models
{
    public class ContactFormModel
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
    public class AdminLoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    public class InstagramMediaResponse
    {
        public List<InstagramMediaItem> Data { get; set; } = new();
    }
    public class InstagramMediaItem
    {
        public string Id { get; set; } = string.Empty;
        public string Caption { get; set; }= string.Empty;

        [JsonPropertyName("media_type")]
        public string MediaType { get; set; }= string.Empty;

        [JsonPropertyName("media_url")]
        public string MediaUrl { get; set; }=   string.Empty;

        [JsonPropertyName("thumbnail_url")]
        public string ThumbnailUrl { get; set; } = string.Empty;

        public string Timestamp { get; set; } = string.Empty;
        public string Permalink { get; set; } = string.Empty;
    }

}
