using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers();  // Add controllers support

        // Add CORS policy (allowing Angular app, running at localhost:4200)
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngularApp",
                builder => builder.WithOrigins("http://localhost:4200")
                                  .AllowAnyHeader()
                                  .AllowAnyMethod());
        });

        // Optional: Add any other services you might need (like Swagger for API docs)
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Middleware pipeline

        // Enable WebSockets
        app.UseWebSockets();

        app.UseRouting();
        app.UseAuthorization();

        app.MapGet("/", () => "WebSocket server running");

        // WebSocket endpoint to handle WebSocket connections
        app.Use(async (context, next) =>
        {
            if (context.Request.Path == "/ws")
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    await EchoWebSocketAsync(webSocket);
                }
                else
                {
                    context.Response.StatusCode = 400;
                }
            }
            else
            {
                await next();
            }
        });

        // Use Swagger middleware (for API documentation)
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Enable CORS
        app.UseCors("AllowAngularApp");

        // Use HTTPS redirection middleware (forces HTTPS for security)
        app.UseHttpsRedirection();

        // Use routing middleware (enables routing)
        app.UseRouting();

        // Use authorization (if authentication is added later, placeholder)
        app.UseAuthorization();

        // Map controllers to endpoints (for API routes)
        app.MapControllers();

        // Run the application
        app.Run();
    }

    // Make this method static since we're calling it from the static Main method
    public static async Task EchoWebSocketAsync(WebSocket webSocket)
    {
        var buffer = new byte[1024 * 4];
        var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        while (!result.CloseStatus.HasValue)
        {
            // Echo received data back to the client
            await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType, result.EndOfMessage, CancellationToken.None);

            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }

        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
    }
}
