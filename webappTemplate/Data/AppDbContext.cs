using webappTemplate.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace webappTemplate.Data
{
    public sealed class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<AdminUser> AdminUsers =>
            Set<AdminUser>();

        public DbSet<MediaItem> MediaItems =>
            Set<MediaItem>();


        public DbSet<SocialLink> SocialLinks =>
            Set<SocialLink>();

        public DbSet<SiteContent> SiteContent =>
            Set<SiteContent>();

        public DbSet<InsightMetric> InsightMetrics =>
            Set<InsightMetric>();

        public DbSet<EmailSettings> EmailSettings =>
            Set<EmailSettings>();

        public DbSet<ScheduleSettings> ScheduleSettings =>
            Set<ScheduleSettings>();

        public DbSet<ScheduleEvent> ScheduleEvents =>
            Set<ScheduleEvent>();

        public DbSet<HomeFeatureSettings> HomeFeatureSettings =>
            Set<HomeFeatureSettings>();

        public DbSet<SiteBrandingSettings> SiteBrandingSettings =>
            Set<SiteBrandingSettings>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureAdminUsers(modelBuilder);
            ConfigureEmailSettings(modelBuilder);
            ConfigureInsightMetrics(modelBuilder);
            ConfigureMediaItems(modelBuilder);
            ConfigureSocialLinks(modelBuilder);
            ConfigureSiteContent(modelBuilder);
            ConfigureSchedule(modelBuilder);
            ConfigureHomeFeatures(modelBuilder);
            ConfigureSiteBranding(modelBuilder);
        }

        private static void ConfigureSiteBranding(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SiteBrandingSettings>(entity =>
            {
                entity.ToTable("SiteBrandingSettings");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.BackgroundColor)
                    .HasMaxLength(7)
                    .IsRequired();
            });
        }

        private static void ConfigureHomeFeatures(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<HomeFeatureSettings>(entity =>
            {
                entity.ToTable("HomeFeatureSettings");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.YouTubeUrl).HasMaxLength(500).IsRequired();
                entity.Property(x => x.YouTubeHeading).HasMaxLength(150).IsRequired();
                entity.Property(x => x.LocationName).HasMaxLength(150).IsRequired();
                entity.Property(x => x.LocationAddress).HasMaxLength(500).IsRequired();
            });
        }

        private static void ConfigureSchedule(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ScheduleSettings>(entity =>
            {
                entity.ToTable("ScheduleSettings");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.BookingButtonLabel).HasMaxLength(100).IsRequired();
                entity.Property(x => x.RequestHeading).HasMaxLength(150).IsRequired();
                entity.Property(x => x.LabelFieldName).HasMaxLength(100).IsRequired();
                entity.Property(x => x.DetailsLabel).HasMaxLength(100).IsRequired();
                entity.Property(x => x.TimeZoneId).HasMaxLength(100).IsRequired();
                entity.Property(x => x.BusinessHoursJson).IsRequired();
                entity.Property(x => x.LabelsJson).IsRequired();
                entity.Property(x => x.ServicesJson).IsRequired();
            });

            modelBuilder.Entity<ScheduleEvent>(entity =>
            {
                entity.ToTable("ScheduleEvents", table =>
                {
                    table.HasCheckConstraint("CK_ScheduleEvents_Dates", "\"EndsAt\" > \"StartsAt\"");
                });
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
                entity.Property(x => x.EventType).HasMaxLength(100).IsRequired();
                entity.Property(x => x.Label).HasMaxLength(100);
                entity.Property(x => x.Color).HasMaxLength(20).IsRequired();
                entity.Property(x => x.Notes).HasMaxLength(2000);
                entity.HasIndex(x => x.StartsAt);
                entity.HasIndex(x => x.EndsAt);
            });
        }

        private static void ConfigureEmailSettings(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EmailSettings>(entity =>
            {
                entity.ToTable("EmailSettings");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.SenderName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.SenderEmail)
                    .HasMaxLength(254)
                    .IsRequired();

                entity.Property(x => x.RecipientEmail)
                    .HasMaxLength(254)
                    .IsRequired();

                entity.Property(x => x.PublicPhoneNumber)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.EncryptedPassword)
                    .IsRequired();
            });
        }

        private static void ConfigureAdminUsers(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdminUser>(entity =>
            {
                entity.ToTable("AdminUsers");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Username)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.NormalizedUsername)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.PasswordHash)
                    .HasMaxLength(1024)
                    .IsRequired();

                entity.HasIndex(x => x.NormalizedUsername)
                    .IsUnique();
            });
        }

        private static void ConfigureInsightMetrics(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<InsightMetric>(entity =>
            {
                entity.ToTable("InsightMetrics");

                entity.HasKey(x => x.Key);

                entity.Property(x => x.Key)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.Value)
                    .IsRequired();
            });
        }

        private static void ConfigureMediaItems(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MediaItem>(entity =>
            {
                entity.ToTable("MediaItems", table =>
                {
                    table.HasCheckConstraint(
                        "CK_MediaItems_ImageData",
                        "\"ByteLength\" > 0 AND length(\"ImageData\") = \"ByteLength\"");

                    table.HasCheckConstraint(
                        "CK_MediaItems_ContentType",
                        "\"ContentType\" LIKE 'image/%' OR \"ContentType\" LIKE 'video/%'");

                    table.HasCheckConstraint(
                        "CK_MediaItems_Usage",
                        "\"Usage\" >= 0 AND \"Usage\" <= 9");

                    table.HasCheckConstraint(
                        "CK_MediaItems_FocalPointX",
                        "\"FocalPointX\" >= 0 AND \"FocalPointX\" <= 100");

                    table.HasCheckConstraint(
                        "CK_MediaItems_FocalPointY",
                        "\"FocalPointY\" >= 0 AND \"FocalPointY\" <= 100");
                });

                entity.HasKey(x => x.Id);

                entity.Property(x => x.ImageData)
                    .HasColumnType("BLOB")
                    .IsRequired();

                entity.Property(x => x.OriginalFileName)
                    .HasMaxLength(512)
                    .IsRequired();

                entity.Property(x => x.ContentType)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.HasIndex(x => x.Usage);

                entity.HasIndex(x => new
                {
                    x.Usage,
                    x.DisplayOrder
                });
            });
        }
        private static void ConfigureSocialLinks(
        ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SocialLink>(entity =>
            {
                entity.ToTable("SocialLinks");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Label)
                    .IsRequired();

                entity.Property(x => x.Url)
                    .IsRequired();

                entity.HasIndex(x => x.DisplayOrder);

                entity.HasOne(x => x.BackgroundMediaItem)
                    .WithMany()
                    .HasForeignKey(x => x.BackgroundMediaItemId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private static void ConfigureSiteContent(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SiteContent>(entity =>
            {
                entity.ToTable("SiteContent");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.ContentKey)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.Title)
                    .HasMaxLength(200);

                entity.Property(x => x.Content)
                    .IsRequired();

                entity.Property(x => x.ConcurrencyStamp)
                    .HasMaxLength(64)
                    .IsConcurrencyToken();

                entity.HasIndex(x => x.ContentKey)
                    .IsUnique();

                entity.HasOne(x => x.UpdatedByAdminUser)
                    .WithMany()
                    .HasForeignKey(x => x.UpdatedByAdminUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
