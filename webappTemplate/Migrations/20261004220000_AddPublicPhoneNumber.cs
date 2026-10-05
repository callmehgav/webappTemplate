using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261004220000_AddPublicPhoneNumber")]
    public partial class AddPublicPhoneNumber : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicPhoneNumber",
                table: "EmailSettings",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublicPhoneNumber",
                table: "EmailSettings");
        }
    }
}
