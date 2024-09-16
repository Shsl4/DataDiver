using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web.Server.Models;

public class HistoryEntry : IMongoObject
{
        
    [BsonId] 
    [JsonIgnore]
    public ObjectId Id { get; set; }
    
    [BsonElement("type")] 
    public string Type { get; set; } = string.Empty;
    
    [BsonElement("content")] 
    public string Content { get; set; } = string.Empty;
    
    [BsonElement("timestamp")] 
    public string Timestamp { get; set; } = string.Empty;
    
    [BsonElement("llm")] 
    public string? Llm { get; set; } = null;

    [BsonElement("sources")] 
    public Dictionary<string, List<int>>? Sources { get; set; } = null;

    public string GetId()
    {
        return Id.ToString();
    }
    
}