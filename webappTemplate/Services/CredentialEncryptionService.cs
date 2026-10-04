using System.Security.Cryptography;
using System.Text;

namespace webappTemplate.Services
{
    public sealed class CredentialEncryptionService
    {
        private const int KeyLength = 32;
        private const int NonceLength = 12;
        private const int TagLength = 16;

        private readonly byte[] _key;

        public CredentialEncryptionService(
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<CredentialEncryptionService> logger)
        {
            var databasePath = configuration["DATABASE_PATH"];

            if (string.IsNullOrWhiteSpace(databasePath))
            {
                databasePath = Path.Combine(
                    environment.ContentRootPath,
                    "Data",
                    "data.db");
            }
            else if (!Path.IsPathRooted(databasePath))
            {
                databasePath = Path.GetFullPath(
                    databasePath,
                    environment.ContentRootPath);
            }

            var dataDirectory =
                Path.GetDirectoryName(databasePath)
                ?? environment.ContentRootPath;

            Directory.CreateDirectory(dataDirectory);

            var keyPath = Path.Combine(
                dataDirectory,
                "email-encryption.key");

            if (File.Exists(keyPath))
            {
                var encodedKey = File.ReadAllText(keyPath).Trim();
                _key = Convert.FromBase64String(encodedKey);

                if (_key.Length != KeyLength)
                {
                    throw new InvalidOperationException(
                        "The email encryption key is invalid.");
                }

                logger.LogInformation(
                    "Loaded the email credential encryption key.");

                return;
            }

            _key = RandomNumberGenerator.GetBytes(KeyLength);
            File.WriteAllText(
                keyPath,
                Convert.ToBase64String(_key));

            logger.LogInformation(
                "Created the email credential encryption key.");
        }

        public string Encrypt(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException(
                    "A credential is required.",
                    nameof(value));
            }

            var plaintext = Encoding.UTF8.GetBytes(value);
            var nonce = RandomNumberGenerator.GetBytes(NonceLength);
            var ciphertext = new byte[plaintext.Length];
            var tag = new byte[TagLength];

            using var aes = new AesGcm(_key, TagLength);
            aes.Encrypt(nonce, plaintext, ciphertext, tag);

            var encrypted = new byte[
                NonceLength + TagLength + ciphertext.Length];

            Buffer.BlockCopy(
                nonce,
                0,
                encrypted,
                0,
                NonceLength);
            Buffer.BlockCopy(
                tag,
                0,
                encrypted,
                NonceLength,
                TagLength);
            Buffer.BlockCopy(
                ciphertext,
                0,
                encrypted,
                NonceLength + TagLength,
                ciphertext.Length);

            return Convert.ToBase64String(encrypted);
        }

        public string Decrypt(string encryptedValue)
        {
            var encrypted = Convert.FromBase64String(
                encryptedValue);

            if (encrypted.Length <= NonceLength + TagLength)
            {
                throw new CryptographicException(
                    "The encrypted credential is invalid.");
            }

            var nonce = encrypted[..NonceLength];
            var tag = encrypted[
                NonceLength..(NonceLength + TagLength)];
            var ciphertext = encrypted[
                (NonceLength + TagLength)..];
            var plaintext = new byte[ciphertext.Length];

            using var aes = new AesGcm(_key, TagLength);
            aes.Decrypt(
                nonce,
                ciphertext,
                tag,
                plaintext);

            return Encoding.UTF8.GetString(plaintext);
        }
    }
}
