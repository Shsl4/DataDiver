using System.Text;
using Microsoft.AspNetCore.Mvc;
using web.Server.Models;
using web.Server.Serializers;
using web.Server.Services;

namespace web.Server.Controllers;

[ApiController]
[Route("/api/export")]
public class ExportController(DatabaseService service) : ControllerBase
{

    [HttpGet("eval/xlsx/{id}")]
    public async Task<ActionResult> GetEvalExcelFile(string id)
    {
        var collection = service.GetEvaluationCollection(id);
        var list = await collection.GetAll();
        if (list.Count == 0)
        {
            return StatusCode(StatusCodes.Status404NotFound, new Response
            {
                Name = "No data",
                Message = $"There is no evaluation data tied with session '{id}'"
            });  
        }

        return File(ExcelSerializer.Serialize(list[0]), "application/xlsx", $"eval-{id}.xlsx");
    }
    
    [HttpGet("eval/json/{id}")]
    public async Task<ActionResult> GetEvalJsonFile(string id)
    {
        var collection = service.GetEvaluationCollection(id);
        var list = await collection.GetAll();
        if (list.Count == 0)
        {
            return StatusCode(StatusCodes.Status404NotFound, new Response
            {
                Name = "No data",
                Message = $"There is no evaluation data tied with session '{id}'"
            });  
        }

        return File(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(list[0])), "application/json", $"eval-{id}.json");
    }
    
    [HttpGet("chat/xlsx/{id}")]
    public async Task<ActionResult> GetChatXlsxFile(string id)
    {
        var collection = service.GetCollection<HistoryEntry>("history", id);
        var list = await collection.GetAll();
        if (list.Count == 0)
        {
            return StatusCode(StatusCodes.Status404NotFound, new Response
            {
                Name = "No data",
                Message = $"There is no history data tied with session '{id}'"
            });  
        }

        return File(ExcelSerializer.Serialize(list), "application/xlsx", $"history-{id}.xlsx");
    }
    
    [HttpGet("chat/json/{id}")]
    public async Task<ActionResult> GetChatJsonFile(string id)
    {
        var collection = service.GetCollection<HistoryEntry>("history", id);
        var list = await collection.GetAll();
        if (list.Count == 0)
        {
            return StatusCode(StatusCodes.Status404NotFound, new Response
            {
                Name = "No data",
                Message = $"There is no history data tied with session '{id}'"
            });  
        }

        return File(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(list)), "application/json", $"history-{id}.json");
    }
    
}