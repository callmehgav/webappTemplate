using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;

#nullable disable

namespace webappTemplate.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261001200000_AllowHeroMedia")]
    public partial class AllowHeroMedia : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                PRAGMA foreign_keys = OFF;

                DROP TABLE IF EXISTS "__MediaItems_temp";

                CREATE TABLE "__MediaItems_temp" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_MediaItems" PRIMARY KEY,
                    "ImageData" BLOB NOT NULL,
                    "OriginalFileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "ByteLength" INTEGER NOT NULL,
                    "Usage" INTEGER NOT NULL,
                    "AltText" TEXT NULL,
                    "FocalPointX" REAL NOT NULL,
                    "FocalPointY" REAL NOT NULL,
                    CONSTRAINT "CK_MediaItems_ContentType" CHECK ("ContentType" LIKE 'image/%' OR "ContentType" LIKE 'video/%'),
                    CONSTRAINT "CK_MediaItems_FocalPointX" CHECK ("FocalPointX" >= 0 AND "FocalPointX" <= 100),
                    CONSTRAINT "CK_MediaItems_FocalPointY" CHECK ("FocalPointY" >= 0 AND "FocalPointY" <= 100),
                    CONSTRAINT "CK_MediaItems_ImageData" CHECK ("ByteLength" > 0 AND length("ImageData") = "ByteLength"),
                    CONSTRAINT "CK_MediaItems_Usage" CHECK ("Usage" >= 0 AND "Usage" <= 7)
                );

                INSERT INTO "__MediaItems_temp" (
                    "Id", "ImageData", "OriginalFileName", "ContentType",
                    "ByteLength", "Usage", "AltText", "FocalPointX", "FocalPointY"
                )
                SELECT
                    "Id", "ImageData", "OriginalFileName", "ContentType",
                    "ByteLength", "Usage", "AltText", "FocalPointX", "FocalPointY"
                FROM "MediaItems";

                DROP TABLE "MediaItems";
                ALTER TABLE "__MediaItems_temp" RENAME TO "MediaItems";
                CREATE INDEX "IX_MediaItems_Usage" ON "MediaItems" ("Usage");

                PRAGMA foreign_keys = ON;
                """,
                suppressTransaction: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                PRAGMA foreign_keys = OFF;

                DROP TABLE IF EXISTS "__MediaItems_temp";

                CREATE TABLE "__MediaItems_temp" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_MediaItems" PRIMARY KEY,
                    "ImageData" BLOB NOT NULL,
                    "OriginalFileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "ByteLength" INTEGER NOT NULL,
                    "Usage" INTEGER NOT NULL,
                    "AltText" TEXT NULL,
                    "FocalPointX" REAL NOT NULL,
                    "FocalPointY" REAL NOT NULL,
                    CONSTRAINT "CK_MediaItems_ContentType" CHECK ("ContentType" LIKE 'image/%'),
                    CONSTRAINT "CK_MediaItems_FocalPointX" CHECK ("FocalPointX" >= 0 AND "FocalPointX" <= 100),
                    CONSTRAINT "CK_MediaItems_FocalPointY" CHECK ("FocalPointY" >= 0 AND "FocalPointY" <= 100),
                    CONSTRAINT "CK_MediaItems_ImageData" CHECK ("ByteLength" > 0 AND length("ImageData") = "ByteLength"),
                    CONSTRAINT "CK_MediaItems_Usage" CHECK ("Usage" >= 0 AND "Usage" <= 6)
                );

                INSERT INTO "__MediaItems_temp" (
                    "Id", "ImageData", "OriginalFileName", "ContentType",
                    "ByteLength", "Usage", "AltText", "FocalPointX", "FocalPointY"
                )
                SELECT
                    "Id", "ImageData", "OriginalFileName", "ContentType",
                    "ByteLength", "Usage", "AltText", "FocalPointX", "FocalPointY"
                FROM "MediaItems"
                WHERE "Usage" <= 6 AND "ContentType" LIKE 'image/%';

                DROP TABLE "MediaItems";
                ALTER TABLE "__MediaItems_temp" RENAME TO "MediaItems";
                CREATE INDEX "IX_MediaItems_Usage" ON "MediaItems" ("Usage");

                PRAGMA foreign_keys = ON;
                """,
                suppressTransaction: true);
        }
    }
}
