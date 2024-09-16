using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using web.Server.Models;

namespace web.Server.Services;

/// <summary>
/// A convenience object providing CRUD operations for a collection and object type
/// </summary>
/// <param name="database">The database to use</param>
/// <param name="collectionName">The name of the collection to use</param>
/// <typeparam name="T">The type of object to manage</typeparam>
public class CrudInstance<T>(IMongoDatabase database, string collectionName) where T : IMongoObject {
    
    /// <summary>
    /// A reference to the collection to manipulate
    /// </summary>
    private readonly IMongoCollection<T> _collection = database.GetCollection<T>(collectionName);

    /// <summary>
    /// Retrieves an object from the collection by ID
    /// </summary>
    /// <param name="id">The ID of the object to retrieve</param>
    /// <returns>The target object, if any</returns>
    public async Task<T?> Get(string id)
    {
        return await _collection.Find(x => x.GetId() == id).FirstOrDefaultAsync();
    }

    /// <summary>
    /// Returns all the objects contained in the collection
    /// </summary>
    /// <returns>The objects</returns>
    public async Task<List<T>> GetAll()
    {
        return await _collection.Find(x => true).ToListAsync();
    }

    /// <summary>
    /// Adds a new object to the collection
    /// </summary>
    /// <param name="element">The object to add</param>
    public async Task Create(T element)
    {
        await _collection.InsertOneAsync(element);
    }

    /// <summary>
    /// Adds multiple objects to the collection
    /// </summary>
    /// <param name="elements">The objects to ass</param>
    public async Task CreateMultiple(List<T> elements)
    {
        await _collection.InsertManyAsync(elements);
    }

    /// <summary>
    /// Updates a single object to the collection
    /// </summary>
    /// <param name="id">The ID of the object to update</param>
    /// <param name="element">The new object value</param>
    /// <returns>The update result</returns>
    public async Task<ReplaceOneResult> Update(string id, T element)
    {
        return await _collection.ReplaceOneAsync(x => x.GetId() == id, element);
    }

    /// <summary>
    /// Deletes an objet in the collection by ID
    /// </summary>
    /// <param name="id">The ID of the object to delete</param>
    /// <returns>The deletion result</returns>
    public async Task<DeleteResult> Delete(string id)
    {
        return await _collection.DeleteOneAsync(x => x.GetId() == id);
    }

    /// <summary>
    /// Deletes multiple objects from the collection
    /// </summary>
    /// <param name="ids">The IDs of the objects to delete</param>
    /// <returns>The deletion result</returns>
    public async Task<DeleteResult> DeleteMultiple(List<string> ids)
    {
        return await _collection.DeleteManyAsync(x => ids.Contains(x.GetId()));
    }

    /// <summary>
    /// Drops the entire collection
    /// </summary>
    public async Task Drop()
    {
        await database.DropCollectionAsync(collectionName);
    }
}

/// <summary>
/// A service used to communicate with MongoDB
/// </summary>
public class DatabaseService
{

    /// <summary>
    /// MongoDB client used to access the database
    /// </summary>
    private readonly MongoClient _mongoClient;
    
    /// <summary>
    /// A reference to the database containing evaluation data
    /// </summary>
    private readonly IMongoDatabase _evaluationDatabase;
    
    /// <summary>
    /// Initializes the database service using the provided options
    /// </summary>
    /// <param name="options">The connection options</param>
    public DatabaseService(IOptions<ServiceOptions> options)
    {
        this._mongoClient = new MongoClient(options.Value.DatabaseUrl);
        this._evaluationDatabase = _mongoClient.GetDatabase("evaluation");
    }
    
    /// <summary>
    /// Gets or creates the requested database and collection
    /// </summary>
    /// <param name="database">The database to get</param>
    /// <param name="collection">The collection to get</param>
    /// <typeparam name="T">The type of object stored in the collection</typeparam>
    /// <returns>A CrudInstance object of the desired type</returns>
    public CrudInstance<T> GetCollection<T>(string database, string collection) where T: IMongoObject
    {
        return new CrudInstance<T>(this._mongoClient.GetDatabase(database), collection);
    }

    /// <summary>
    /// Gets the evaluation data collection for the provided session
    /// </summary>
    /// <param name="sessionId">The session to use</param>
    /// <returns>A CrudInstance to manipulate the session's evaluation data</returns>
    public CrudInstance<EvaluationData> GetEvaluationCollection(string sessionId)
    {
        return new CrudInstance<EvaluationData>(this._evaluationDatabase, sessionId);
    }

}