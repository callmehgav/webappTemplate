using Microsoft.EntityFrameworkCore;
using webappTemplate.Data;

namespace webappTemplate.Services
{
    public sealed class ScheduleMaintenanceService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ScheduleMaintenanceService> _logger;

        public ScheduleMaintenanceService(
            IServiceScopeFactory scopeFactory,
            ILogger<ScheduleMaintenanceService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await RemoveExpiredEventsAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task RemoveExpiredEventsAsync(CancellationToken cancellationToken)
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTimeOffset.UtcNow.AddMonths(-3);
            var removed = await database.ScheduleEvents
                .Where(item => item.EndsAt < cutoff)
                .ExecuteDeleteAsync(cancellationToken);

            if (removed > 0)
            {
                _logger.LogInformation("Removed {Count} expired schedule events.", removed);
            }
        }
    }
}
