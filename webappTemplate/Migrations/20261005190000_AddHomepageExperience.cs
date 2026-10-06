using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261005190000_AddHomepageExperience")]
    public partial class AddHomepageExperience : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CalendarPreviewEnabled",
                table: "HomeFeatureSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "GalleryPreviewEnabled",
                table: "HomeFeatureSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ServicesEnabled",
                table: "HomeFeatureSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(name: "H1Color", table: "SiteBrandingSettings", type: "TEXT", maxLength: 7, nullable: false, defaultValue: "#2b2430");
            migrationBuilder.AddColumn<string>(name: "H1FontFamily", table: "SiteBrandingSettings", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "Georgia");
            migrationBuilder.AddColumn<int>(name: "H1FontSize", table: "SiteBrandingSettings", type: "INTEGER", nullable: false, defaultValue: 88);
            migrationBuilder.AddColumn<string>(name: "H2Color", table: "SiteBrandingSettings", type: "TEXT", maxLength: 7, nullable: false, defaultValue: "#2b2430");
            migrationBuilder.AddColumn<string>(name: "H2FontFamily", table: "SiteBrandingSettings", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "Georgia");
            migrationBuilder.AddColumn<int>(name: "H2FontSize", table: "SiteBrandingSettings", type: "INTEGER", nullable: false, defaultValue: 58);
            migrationBuilder.AddColumn<string>(name: "H3Color", table: "SiteBrandingSettings", type: "TEXT", maxLength: 7, nullable: false, defaultValue: "#514252");
            migrationBuilder.AddColumn<string>(name: "H3FontFamily", table: "SiteBrandingSettings", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "Georgia");
            migrationBuilder.AddColumn<int>(name: "H3FontSize", table: "SiteBrandingSettings", type: "INTEGER", nullable: false, defaultValue: 30);

            migrationBuilder.CreateTable(
                name: "ServiceOfferings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsVisible = table.Column<bool>(type: "INTEGER", nullable: false),
                    MediaItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceOfferings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceOfferings_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(name: "IX_ServiceOfferings_DisplayOrder", table: "ServiceOfferings", column: "DisplayOrder");
            migrationBuilder.CreateIndex(name: "IX_ServiceOfferings_MediaItemId", table: "ServiceOfferings", column: "MediaItemId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ServiceOfferings");
            migrationBuilder.DropColumn(name: "CalendarPreviewEnabled", table: "HomeFeatureSettings");
            migrationBuilder.DropColumn(name: "GalleryPreviewEnabled", table: "HomeFeatureSettings");
            migrationBuilder.DropColumn(name: "ServicesEnabled", table: "HomeFeatureSettings");
            migrationBuilder.DropColumn(name: "H1Color", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H1FontFamily", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H1FontSize", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H2Color", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H2FontFamily", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H2FontSize", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H3Color", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H3FontFamily", table: "SiteBrandingSettings");
            migrationBuilder.DropColumn(name: "H3FontSize", table: "SiteBrandingSettings");
        }
    }
}
