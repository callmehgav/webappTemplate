namespace webappTemplate
{
    public class AppSettings
    {
        public SmtpSettings Smtp { get; set; } = new SmtpSettings();
    }

    public class SmtpSettings
    {
        public string Host { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
    }
}
