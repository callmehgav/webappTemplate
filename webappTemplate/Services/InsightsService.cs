using webappTemplate.Data;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Services
{
    public sealed class InsightsService
    {
        private const int MaximumKeyLength = 150;

        private readonly AppDbContext _database;

        public InsightsService(
            AppDbContext database)
        {
            _database = database;
        }

        public async Task AddAsync(
            string key,
            long amount,
            CancellationToken cancellationToken = default)
        {
            var normalizedKey = NormalizeKey(key);

            await _database.Database.ExecuteSqlInterpolatedAsync(
                $"""
                INSERT INTO "InsightMetrics"
                    ("Key", "Value")
                VALUES
                    ({normalizedKey}, {amount})
                ON CONFLICT("Key") DO UPDATE SET
                    "Value" =
                        "InsightMetrics"."Value" +
                        excluded."Value";
                """,
                cancellationToken);
        }

        public async Task<Dictionary<string, long>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _database.InsightMetrics
                .AsNoTracking()
                .OrderBy(metric => metric.Key)
                .ToDictionaryAsync(
                    metric => metric.Key,
                    metric => metric.Value,
                    cancellationToken);
        }

        private static string NormalizeKey(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException(
                    "The insight key is required.",
                    nameof(key));
            }

            var normalizedKey =
                key.Trim().ToLowerInvariant();

            if (normalizedKey.Length > MaximumKeyLength)
            {
                throw new ArgumentException(
                    $"The insight key cannot exceed " +
                    $"{MaximumKeyLength} characters.",
                    nameof(key));
            }

            return normalizedKey;
        }
    }
}