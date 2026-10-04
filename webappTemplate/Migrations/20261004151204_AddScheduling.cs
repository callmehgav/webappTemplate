using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webappTemplate.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScheduleEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Resource = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Color = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    IsAllDay = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsBlocked = table.Column<bool>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleEvents", x => x.Id);
                    table.CheckConstraint("CK_ScheduleEvents_Dates", "\"EndsAt\" > \"StartsAt\"");
                });

            migrationBuilder.CreateTable(
                name: "ScheduleSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CalendarEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequestsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    BookingButtonLabel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    RequestHeading = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    ResourceLabel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    DetailsLabel = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    TimeZoneId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    BufferMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    SlotMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    BusinessHoursJson = table.Column<string>(type: "TEXT", nullable: false),
                    ResourcesJson = table.Column<string>(type: "TEXT", nullable: false),
                    ServicesJson = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleEvents_EndsAt",
                table: "ScheduleEvents",
                column: "EndsAt");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleEvents_StartsAt",
                table: "ScheduleEvents",
                column: "StartsAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScheduleEvents");

            migrationBuilder.DropTable(
                name: "ScheduleSettings");
        }
    }
}
