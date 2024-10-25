using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.WebSockets;
using System.Threading.Tasks;
using webappTemplate;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container
        builder.Services.AddControllers();

        // Allow CORS (to allow requests from Angular)
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngularApp",
                builder => builder.WithOrigins("http://localhost:4200")
                                  .AllowAnyHeader()
                                  .AllowAnyMethod());
        });

        var app = builder.Build();

        // Enable WebSockets
        app.UseWebSockets();

        // Create an instance of Conduit to handle WebSocket communication
        var conduit = new Conduit();

        // Middleware to handle WebSocket requests
        app.Use(async (context, next) =>
        {
            if (context.Request.Path == "/ws")
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    await conduit.ListenWebSocketAsync(webSocket);  // Delegate to Conduit
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

        app.UseCors("AllowAngularApp");
        app.UseHttpsRedirection();
        app.UseRouting();
        app.UseAuthorization();

        app.MapControllers();
        app.Run();
    }
}
