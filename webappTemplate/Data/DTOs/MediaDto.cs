using webappTemplate.Data.Models;
using Microsoft.AspNetCore.Http;

namespace webappTemplate.Data.DTOs
{
    public sealed class UploadMediaRequest
    {
        public IFormFile? File { get; set; }

        public MediaUsage Usage { get; set; }

        public int DisplayOrder { get; set; }

        public string? AltText { get; set; }

        public double FocalPointX { get; set; } = 50;

        public double FocalPointY { get; set; } = 50;
    }

    public sealed class UpdateMediaRequest
    {
        public string? AltText { get; set; }

        public int DisplayOrder { get; set; }

        public double FocalPointX { get; set; } = 50;

        public double FocalPointY { get; set; } = 50;
    }

    public sealed class AdminMediaResponse
    {
        public Guid Id { get; set; }

        public MediaUsage Usage { get; set; }

        public required string OriginalFileName { get; set; }

        public required string ContentType { get; set; }

        public required string ContentUrl { get; set; }

        public long ByteLength { get; set; }

        public int DisplayOrder { get; set; }

        public string? AltText { get; set; }

        public double FocalPointX { get; set; }

        public double FocalPointY { get; set; }
    }

    public sealed class PublicMediaResponse
    {
        public Guid Id { get; set; }

        public MediaUsage Usage { get; set; }

        public required string ContentUrl { get; set; }

        public required string ContentType { get; set; }

        public int DisplayOrder { get; set; }

        public string? AltText { get; set; }

        public double FocalPointX { get; set; }

        public double FocalPointY { get; set; }
    }
}
