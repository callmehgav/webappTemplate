using webappTemplate.Data;

namespace webappTemplate.Services
{
    public sealed class MediaAssetService
    {
        private readonly AppDbContext _database;

        public MediaAssetService(AppDbContext database)
        {
            _database = database;
        }

        public async Task DeleteAsync(
            Guid? mediaId,
            CancellationToken cancellationToken)
        {
            if (!mediaId.HasValue)
            {
                return;
            }

            var media = await _database.MediaItems.FindAsync(
                new object[] { mediaId.Value },
                cancellationToken);

            if (media is not null)
            {
                _database.MediaItems.Remove(media);
            }
        }

        public async Task ReplaceAsync(
            Guid? previousMediaId,
            Guid? nextMediaId,
            CancellationToken cancellationToken)
        {
            if (previousMediaId == nextMediaId)
            {
                return;
            }

            await DeleteAsync(
                previousMediaId,
                cancellationToken);
        }
    }
}