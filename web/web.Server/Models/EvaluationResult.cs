using MongoDB.Bson.Serialization.Attributes;

namespace web.Server.Models;

public class EvaluationResult
{
    
    [BsonElement("result_id")] 
    public string ResultId { get; set; } = string.Empty;
    
    [BsonElement("criterion")] 
    public string Criterion { get; set; } = string.Empty;
    
    [BsonElement("grade")] 
    public double Grade { get; set; } = 0.0;
    
    [BsonElement("remark")] 
    public string Remark { get; set; } = string.Empty;
    
    [BsonElement("timestamp")] 
    public string Timestamp { get; set; } = string.Empty;
    
    [BsonElement("llm")] 
    public string Llm { get; set; } = string.Empty;
    
    [BsonElement("sources")] 
    public Dictionary<string, List<int>> Sources { get; set; } = [];
    
}