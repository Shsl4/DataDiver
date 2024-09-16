using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Options;
using web.Server.Controllers;
using web.Server.Models;

namespace web.Server.Services;

public class AiService
{
    /// <summary>
    /// The path to the AI service
    /// </summary>
    private readonly string _serviceUrl;
    
    /// <summary>
    /// An HTTP client used to perform requests
    /// </summary>
    private readonly HttpClient _client = new();

    /// <summary>
    /// Initializes the AI service
    /// </summary>
    /// <param name="options">The Service options to use</param>
    public AiService(IOptions<ServiceOptions> options) => this._serviceUrl = options.Value.AiServiceUrl;

    /// <summary>
    /// Forwards a Post request with JSON content to the AI service
    /// </summary>
    /// <param name="uri">The API endpoint to use</param>
    /// <param name="data">The payload to send</param>
    /// <returns>A task with the response json element</returns>
    public async Task<ObjectResult> PostJson(string uri, JsonElement data)
    {
        return await JsonHandler(await _client.PostAsJsonAsync($"{_serviceUrl}/{uri}", data));
    }
    
    /// <summary>
    /// Forwards a post request to the AI service
    /// </summary>
    /// <param name="uri">The API endpoint to use</param>
    /// <param name="id">The parameter to use</param>
    /// <returns>A task with the response json element</returns>
    public async Task<ObjectResult> Post(string uri, string? id = null)
    {
        var path = id == null ? $"{_serviceUrl}/{uri}" : $"{_serviceUrl}/{uri}/{id}";
        return await JsonHandler(await _client.PostAsync(path, null));
    }
    
    /// <summary>
    /// Forwards a get request to the AI service
    /// </summary>
    /// <param name="uri">The API endpoint to use</param>
    /// <param name="id">The parameter to use</param>
    /// <returns>A task with the response json element</returns>
    public async Task<ObjectResult> Get(string uri, string? id = null)
    {
        var path = id == null ? $"{_serviceUrl}/{uri}" : $"{_serviceUrl}/{uri}/{id}";
        return await JsonHandler(await _client.GetAsync(path));
    }
    
    public async Task<IActionResult> GetFile(string uri, string? id = null)
    {
        var path = id == null ? $"{_serviceUrl}/{uri}" : $"{_serviceUrl}/{uri}/{id}";
        var response = await _client.GetAsync(path);
        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, await response.Content.ReadFromJsonAsync<JsonElement>());
        }

        var contentStream = await response.Content.ReadAsStreamAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";

        return new FileStreamResult(contentStream, contentType);
    }
    
    /// <summary>
    /// Forwards a delete request to the AI service
    /// </summary>
    /// <param name="uri">The API endpoint to use</param>
    /// <param name="id">The parameter to use</param>
    /// <returns>A task with the response json element</returns>
    public async Task<ObjectResult> Delete(string uri, string id)
    {
        return await JsonHandler(await _client.DeleteAsync($"{_serviceUrl}/{uri}/{id}"));
    }
    
    /// <summary>
    /// A common handler for responses from the AI service
    /// Returns the appropriate error code and return data
    /// Returns an internal server error in case the response is null (Should never happen)
    /// </summary>
    /// <param name="response">The response data from the AI Service</param>
    /// <returns>The transformed response</returns>
    private static async Task<ObjectResult> JsonHandler(HttpResponseMessage? response)
    {
        if (response != null)
        {
            return StatusCode((int)response.StatusCode, await response.Content.ReadFromJsonAsync<JsonElement>());
        }

        return StatusCode(StatusCodes.Status500InternalServerError, new Response
        {
            Name = "Internal Server Error",
            Message = "An unexpected internal error occurred."
        });   
    }
    
    /// <summary>
    /// Returns a basic ObjectResult with a status code and an optional object
    /// </summary>
    /// <param name="statusCode">The status code to use</param>
    /// <param name="value">An optional object to add</param>
    /// <returns>The new ObjectResult</returns>
    private static ObjectResult StatusCode([ActionResultStatusCode] int statusCode, [ActionResultObjectValue] object? value)
    {
        return new ObjectResult(value)
        {
            StatusCode = statusCode
        };
    }
    
}