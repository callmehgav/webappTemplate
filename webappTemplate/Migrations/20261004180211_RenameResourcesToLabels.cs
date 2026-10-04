using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webappTemplate.Migrations
{
    /// <inheritdoc />
    public partial class RenameResourcesToLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ResourcesJson",
                table: "ScheduleSettings",
                newName: "LabelsJson");

            migrationBuilder.RenameColumn(
                name: "ResourceLabel",
                table: "ScheduleSettings",
                newName: "LabelFieldName");

            migrationBuilder.RenameColumn(
                name: "Resource",
                table: "ScheduleEvents",
                newName: "Label");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LabelsJson",
                table: "ScheduleSettings",
                newName: "ResourcesJson");

            migrationBuilder.RenameColumn(
                name: "LabelFieldName",
                table: "ScheduleSettings",
                newName: "ResourceLabel");

            migrationBuilder.RenameColumn(
                name: "Label",
                table: "ScheduleEvents",
                newName: "Resource");
        }
    }
}
