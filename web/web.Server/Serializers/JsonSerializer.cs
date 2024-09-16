using System.Text.Json;
using System.Text.Json.Serialization;

namespace web.Server.Serializers;

public static class JsonSerializer
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        IncludeFields = true,
        WriteIndented = true
    };
    
    /// <summary>
    /// Deserializes a JSON string to an object format
    /// </summary>
    /// <param name="contents">The string to deserialize</param>
    /// <typeparam name="T">The type of object to deserialize</typeparam>
    /// <returns></returns>
    /// <exception cref="InvalidDataException">In case the string cannot be deserialized to the input object type</exception>
    public static T Deserialize<T>(string contents)
    {
        var result = System.Text.Json.JsonSerializer.Deserialize<T>(contents, Options);

        if (result == null) throw new InvalidDataException("Invalid json data");
                
        return result;
    }
    
    /// <summary>
    /// Serializes an object to a JSON string
    /// </summary>
    /// <param name="obj">The object to serialize</param>
    /// <typeparam name="T">The type of object to serialize</typeparam>
    /// <returns>The JSON string</returns>
    public static string Serialize<T>(T obj)
    {
        return System.Text.Json.JsonSerializer.Serialize(obj, Options);
    }
}