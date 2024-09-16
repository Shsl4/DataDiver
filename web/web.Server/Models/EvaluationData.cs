using System.Text.Json;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web.Server.Models;

public interface IMongoObject
{
    public string GetId();

}

public class EvaluationData : IMongoObject
{
    
    [BsonId] 
    [JsonIgnore]
    public ObjectId Id { get; set; }
    
    [BsonElement("scenario")] 
    public string Scenario { get; set; } = string.Empty;

    [BsonElement("criteria")] 
    public List<string> Criteria { get; set; } = [];

    [BsonElement("answers")] 
    public Dictionary<string, string> Answers { get; set; } = [];

    [BsonElement("results")] 
    public Dictionary<string, List<EvaluationResult>> Results { get; set; } = new();

    public string GetId()
    {
        return Id.ToString();
    }
    
}