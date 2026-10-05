using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261004203000_AddHomeFeatureSettings")]
    public partial class AddHomeFeatureSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HomeFeatureSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    YouTubeEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    YouTubeUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    YouTubeHeading = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    MapEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LocationName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    LocationAddress = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    MapZoom = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeFeatureSettings", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "HomeFeatureSettings");
        }
    }
}
