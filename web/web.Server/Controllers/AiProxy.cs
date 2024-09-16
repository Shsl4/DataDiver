using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using web.Server.Services;

namespace web.Server.Controllers;

/// <summary>
/// A custom response body
/// </summary>
public class Response
{
    public string Name { get; set; } = "";
    public string Message { get; set; } = "";
}

/// <summary>
/// An API controller that forwards request to the private AI backend.
/// For more information about the endpoints and their parameters, check
/// the AI service python source code
/// </summary>
/// <param name="service"></param>
[ApiController]
[EnableRateLimiting("ai")]
[Route("/api/ai")]
public class AiProxy(AiService service) : ControllerBase
{
        
    [HttpPost("new_session")]
    public async Task<IActionResult> NewChat(JsonElement element)
    {
        return await service.PostJson("new_session", element);
    }
    
    [HttpPost("ask")]
    public async Task<IActionResult> Ask(JsonElement json)
    {
        return await service.PostJson("ask", json);
    }
    
    [HttpPost("eval")]
    public async Task<IActionResult> Eval(JsonElement json)
    {
        return await service.PostJson("eval", json);
    }
    
    [HttpPost("config")]
    public async Task<IActionResult> UseConfig(JsonElement json)
    {
        return await service.PostJson("config", json);
    }
    
    [HttpPost("algorithm")]
    public async Task<IActionResult> UseAlgorithm(JsonElement json)
    {
        return await service.PostJson("algorithm", json);
    }
    
    [HttpPost("retriever")]
    public async Task<IActionResult> UseRetriever(JsonElement json)
    {
        return await service.PostJson("retriever", json);
    }
    
    [HttpPost("criteria")]
    public async Task<IActionResult> UseCriteria(JsonElement json)
    {
        return await service.PostJson("criteria", json);
    }
    
    [HttpPost("scenario")]
    public async Task<IActionResult> UseScenario(JsonElement json)
    {
        return await service.PostJson("scenario", json);
    }
    
    [HttpPost("llm/{llm}")]
    public async Task<IActionResult> UseLlm(string llm)
    {
        return await service.Post("llm", llm);
    }
    
    [HttpPost("session/{id}")]
    public async Task<IActionResult> UseSession(string id)
    {
        return await service.Post("session", id);
    }
    
    [HttpGet("document/{**path}")]
    public async Task<IActionResult> GetDocument(string path)
    {
        return await service.GetFile("document", path);
    }
    
    [HttpDelete("session/{id}")]
    public async Task<IActionResult> DeleteSession(string id)
    {
        return await service.Delete("session", id);
    }
    
    [HttpGet("session/{id}")]
    public async Task<IActionResult> GetSession(string id)
    {
        return await service.Get("session", id);
    }
    
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        return await service.Get("sessions");
    }
    
}