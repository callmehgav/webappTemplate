using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261004234500_AddAmbientBackgroundMode")]
    public partial class AddAmbientBackgroundMode : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UseAmbientBackground",
                table: "SiteBrandingSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UseAmbientBackground",
                table: "SiteBrandingSettings");
        }
    }
}
