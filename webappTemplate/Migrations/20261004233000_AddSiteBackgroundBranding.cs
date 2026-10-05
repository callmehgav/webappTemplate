using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261004233000_AddSiteBackgroundBranding")]
    public partial class AddSiteBackgroundBranding : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteBrandingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BackgroundColor = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    UseBackgroundImage = table.Column<bool>(type: "INTEGER", nullable: false),
                    BackgroundMediaItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteBrandingSettings", x => x.Id);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO "SiteBrandingSettings" (
                    "Id", "BackgroundColor", "UseBackgroundImage", "BackgroundMediaItemId", "UpdatedUtc"
                ) VALUES (
                    1, '#e9eef5', 0, NULL, '2026-10-04 00:00:00+00:00'
                );
                """);

            RebuildMediaItems(migrationBuilder, 9, false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SiteBrandingSettings");
            RebuildMediaItems(migrationBuilder, 8, true);
        }

        private static void RebuildMediaItems(MigrationBuilder migrationBuilder, int maximumUsage, bool discardPageBackgrounds)
        {
            var usageFilter = discardPageBackgrounds ? " WHERE \"Usage\" <= 8" : string.Empty;
            migrationBuilder.Sql(
                $$"""
                PRAGMA foreign_keys = OFF;
                DROP TABLE IF EXISTS "__MediaItems_temp";
                CREATE TABLE "__MediaItems_temp" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_MediaItems" PRIMARY KEY,
                    "ImageData" BLOB NOT NULL,
                    "OriginalFileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "ByteLength" INTEGER NOT NULL,
                    "Usage" INTEGER NOT NULL,
                    "DisplayOrder" INTEGER NOT NULL,
                    "AltText" TEXT NULL,
                    "FocalPointX" REAL NOT NULL,
                    "FocalPointY" REAL NOT NULL,
                    CONSTRAINT "CK_MediaItems_ContentType" CHECK ("ContentType" LIKE 'image/%' OR "ContentType" LIKE 'video/%'),
                    CONSTRAINT "CK_MediaItems_FocalPointX" CHECK ("FocalPointX" >= 0 AND "FocalPointX" <= 100),
                    CONSTRAINT "CK_MediaItems_FocalPointY" CHECK ("FocalPointY" >= 0 AND "FocalPointY" <= 100),
                    CONSTRAINT "CK_MediaItems_ImageData" CHECK ("ByteLength" > 0 AND length("ImageData") = "ByteLength"),
                    CONSTRAINT "CK_MediaItems_Usage" CHECK ("Usage" >= 0 AND "Usage" <= {{maximumUsage}})
                );
                INSERT INTO "__MediaItems_temp" (
                    "Id", "ImageData", "OriginalFileName", "ContentType", "ByteLength",
                    "Usage", "DisplayOrder", "AltText", "FocalPointX", "FocalPointY"
                )
                SELECT
                    "Id", "ImageData", "OriginalFileName", "ContentType", "ByteLength",
                    "Usage", "DisplayOrder", "AltText", "FocalPointX", "FocalPointY"
                FROM "MediaItems"{{usageFilter}};
                DROP TABLE "MediaItems";
                ALTER TABLE "__MediaItems_temp" RENAME TO "MediaItems";
                CREATE INDEX "IX_MediaItems_Usage" ON "MediaItems" ("Usage");
                CREATE INDEX "IX_MediaItems_Usage_DisplayOrder" ON "MediaItems" ("Usage", "DisplayOrder");
                PRAGMA foreign_keys = ON;
                """,
                suppressTransaction: true);
        }
    }
}
