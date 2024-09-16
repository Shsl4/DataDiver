
using System.Net;
using System.Threading.RateLimiting;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Office.Word;
using Microsoft.AspNetCore.RateLimiting;
using web.Server.Controllers;
using web.Server.Models;
using web.Server.Serializers;
using web.Server.Services;

namespace web.Server
{
    public class Program
    {
        
        /// <summary>
        /// Custom middleware for handling exceptions that occurs inside controllers
        /// Returns a custom internal server error when an exception is unhandled
        /// </summary>
        /// <param name="next">The next request</param>
        /// <param name="logger">The logger to use</param>
        public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            public async Task InvokeAsync(HttpContext context)
            {
                try
                {
                    await next(context);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An unhandled exception occurred.");
                    
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                    var response = new Response
                    {
                        Name = "Internal Server Error",
                        Message = "An unexpected internal error occurred."
                    };
                
                    await context.Response.WriteAsJsonAsync(response);
                }
                
            }

        }
        
        public class NotFoundMiddleware(RequestDelegate next)
        {
            public async Task InvokeAsync(HttpContext context)
            {
                await next(context);

                if (!context.Response.Headers.IsReadOnly && context.Response.StatusCode == StatusCodes.Status404NotFound)
                {
                    var response = new Response
                    {
                        Name = "Not found",
                        Message = "The requested resource could not be found"
                    };
                        
                    await context.Response.WriteAsJsonAsync(response);
                }
            }
        }

        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin", config => 
                    config.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod());
            });
            
            // Add a rate limiter of 1 request per second for the AI service
            builder.Services.AddRateLimiter(opts => opts.AddFixedWindowLimiter(policyName: "ai", options =>
            {
                options.PermitLimit = 1;
                options.Window = TimeSpan.FromSeconds(1);
                options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                options.QueueLimit = 1;
            }));
            
            builder.Services.Configure<ServiceOptions>(builder.Configuration.GetSection("Services"));
            builder.Services.AddSingleton<AiService>();
            builder.Services.AddSingleton<DatabaseService>();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddControllers();

            builder.WebHost.UseKestrel(option => option.AddServerHeader = false);

            var app = builder.Build();

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseMiddleware<ErrorHandlingMiddleware>();
            app.UseMiddleware<NotFoundMiddleware>();

            app.UseRateLimiter();

            if (app.Environment.IsDevelopment())
            {
                // Use cors in dev mode only
                app.UseCors("AllowSpecificOrigin");
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHsts();
            }
            
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
            app.MapFallbackToFile("/index.html");
            
            await app.RunAsync();
        }
    }
}
