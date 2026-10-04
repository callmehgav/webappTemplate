using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webappTemplate.Migrations
{
    /// <inheritdoc />
    public partial class dbinit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    NormalizedUsername = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    LastLoginUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InsightMetrics",
                columns: table => new
                {
                    Key = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Value = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InsightMetrics", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "MediaItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ImageData = table.Column<byte[]>(type: "BLOB", nullable: false),
                    OriginalFileName = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    ByteLength = table.Column<long>(type: "INTEGER", nullable: false),
                    Usage = table.Column<int>(type: "INTEGER", nullable: false),
                    AltText = table.Column<string>(type: "TEXT", nullable: true),
                    FocalPointX = table.Column<double>(type: "REAL", nullable: false),
                    FocalPointY = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaItems", x => x.Id);
                    table.CheckConstraint("CK_MediaItems_ContentType", "\"ContentType\" LIKE 'image/%'");
                    table.CheckConstraint("CK_MediaItems_FocalPointX", "\"FocalPointX\" >= 0 AND \"FocalPointX\" <= 100");
                    table.CheckConstraint("CK_MediaItems_FocalPointY", "\"FocalPointY\" >= 0 AND \"FocalPointY\" <= 100");
                    table.CheckConstraint("CK_MediaItems_ImageData", "\"ByteLength\" > 0 AND length(\"ImageData\") = \"ByteLength\"");
                    table.CheckConstraint("CK_MediaItems_Usage", "\"Usage\" >= 0 AND \"Usage\" <= 5");
                });

            migrationBuilder.CreateTable(
                name: "SiteContent",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContentKey = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    Format = table.Column<int>(type: "INTEGER", nullable: false),
                    IsVisible = table.Column<bool>(type: "INTEGER", nullable: false),
                    UpdatedByAdminUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteContent", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteContent_AdminUsers_UpdatedByAdminUserId",
                        column: x => x.UpdatedByAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SocialLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Platform = table.Column<int>(type: "INTEGER", nullable: false),
                    DisplayStyle = table.Column<int>(type: "INTEGER", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Handle = table.Column<string>(type: "TEXT", nullable: true),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    BackgroundMediaItemId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SocialLinks_MediaItems_BackgroundMediaItemId",
                        column: x => x.BackgroundMediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminUsers_NormalizedUsername",
                table: "AdminUsers",
                column: "NormalizedUsername",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MediaItems_Usage",
                table: "MediaItems",
                column: "Usage");

            migrationBuilder.CreateIndex(
                name: "IX_SiteContent_ContentKey",
                table: "SiteContent",
                column: "ContentKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SiteContent_UpdatedByAdminUserId",
                table: "SiteContent",
                column: "UpdatedByAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialLinks_BackgroundMediaItemId",
                table: "SocialLinks",
                column: "BackgroundMediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialLinks_DisplayOrder",
                table: "SocialLinks",
                column: "DisplayOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InsightMetrics");

            migrationBuilder.DropTable(
                name: "SiteContent");

            migrationBuilder.DropTable(
                name: "SocialLinks");

            migrationBuilder.DropTable(
                name: "AdminUsers");

            migrationBuilder.DropTable(
                name: "MediaItems");
        }
    }
}
