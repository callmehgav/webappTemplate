using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using webappTemplate.Data;
namespace webappTemplate.Migrations {
 [DbContext(typeof(AppDbContext))]
 [Migration("20261008120000_ReusableSiteSettings")]
 public class ReusableSiteSettings : Migration {
  protected override void Up(MigrationBuilder migrationBuilder) {
   migrationBuilder.AddColumn<string>(name: "ServicesEyebrow", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "What we offer");
   migrationBuilder.AddColumn<string>(name: "ServicesHeading", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Made for memorable gatherings");
   migrationBuilder.AddColumn<string>(name: "ServicesDescription", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Flexible spaces and thoughtful details for celebrations of every size.");
   migrationBuilder.AddColumn<string>(name: "GalleryEyebrow", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "A glimpse of the venue");
   migrationBuilder.AddColumn<string>(name: "GalleryHeading", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Picture your day here");
   migrationBuilder.AddColumn<string>(name: "CalendarEyebrow", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Plan ahead");
   migrationBuilder.AddColumn<string>(name: "CalendarHeading", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Find a date that feels right");
   migrationBuilder.AddColumn<string>(name: "CalendarDescription", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Browse current availability, then send the details you have in mind. We’ll help with the rest.");
   migrationBuilder.AddColumn<string>(name: "SocialEyebrow", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Stay connected");
   migrationBuilder.AddColumn<string>(name: "SocialHeading", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Follow along");
   migrationBuilder.AddColumn<string>(name: "ContactHeading", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Contact Us");
   migrationBuilder.AddColumn<string>(name: "MapEyebrow", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "Location");
   migrationBuilder.AddColumn<string>(name: "LocationsJson", table: "HomeFeatureSettings", type: "TEXT", nullable: false, defaultValue: "[]");
   migrationBuilder.AddColumn<string>(name: "ButtonColor", table: "SiteBrandingSettings", type: "TEXT", nullable: false, defaultValue: "#356bd6");
   migrationBuilder.AddColumn<string>(name: "ButtonTextColor", table: "SiteBrandingSettings", type: "TEXT", nullable: false, defaultValue: "#ffffff");
   migrationBuilder.AddColumn<string>(name: "PFontFamily", table: "SiteBrandingSettings", type: "TEXT", nullable: false, defaultValue: "Arial");
   migrationBuilder.AddColumn<int>(name: "PFontSize", table: "SiteBrandingSettings", type: "INTEGER", nullable: false, defaultValue: 16);
   migrationBuilder.AddColumn<string>(name: "PColor", table: "SiteBrandingSettings", type: "TEXT", nullable: false, defaultValue: "#514252");
  }
  protected override void Down(MigrationBuilder migrationBuilder) {
   migrationBuilder.DropColumn(name: "ServicesEyebrow", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "ServicesHeading", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "ServicesDescription", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "GalleryEyebrow", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "GalleryHeading", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "CalendarEyebrow", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "CalendarHeading", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "CalendarDescription", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "SocialEyebrow", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "SocialHeading", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "ContactHeading", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "MapEyebrow", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "LocationsJson", table: "HomeFeatureSettings");
   migrationBuilder.DropColumn(name: "ButtonColor", table: "SiteBrandingSettings");
   migrationBuilder.DropColumn(name: "ButtonTextColor", table: "SiteBrandingSettings");
   migrationBuilder.DropColumn(name: "PFontFamily", table: "SiteBrandingSettings");
   migrationBuilder.DropColumn(name: "PFontSize", table: "SiteBrandingSettings");
   migrationBuilder.DropColumn(name: "PColor", table: "SiteBrandingSettings");
  }
 }
}
