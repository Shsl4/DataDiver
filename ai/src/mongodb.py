from dataclasses import asdict

from dacite import from_dict
from pymongo import MongoClient

from config import Config
from models import SessionConfig, HistoryEntry, AIHistoryEntry, custom_asdict, EvaluationData

DEFAULT_TIMEOUT = 2500


class MongoDatabase:
    def __init__(self):
        self.client = MongoClient(Config.mongo_path,
                                  connectTimeoutMS=DEFAULT_TIMEOUT,
                                  socketTimeoutMS=DEFAULT_TIMEOUT,
                                  serverSelectionTimeoutMS=DEFAULT_TIMEOUT)
        self.history_database = self.client['history']
        self.evaluation_database = self.client['evaluation']
        self.configuration_database = self.client['config']

    def drop_all(self):
        self.history_database.drop_collection()
        self.configuration_database.drop_collection()

    def write_session_config(self, configuration: SessionConfig):
        if configuration.llm_name not in Config.valid_llms:
            raise ValueError(f"Invalid LLM: {configuration.llm_name}")
        if configuration.retriever_name not in Config.valid_retrievers:
            raise ValueError(f"Invalid Retriever: {configuration.llm_name}")
        collection = self.configuration_database["config"]
        collection.replace_one({"_id": configuration.id}, asdict(configuration, dict_factory=custom_asdict),
                               upsert=True)

    def get_session_config(self, session_id: str) -> SessionConfig | None:
        collection = self.configuration_database["config"]
        result = collection.find_one({"_id": session_id})

        if result is None:
            return None

        return SessionConfig.from_dict(result)

    def delete_session_config(self, session_id: str):
        collection = self.configuration_database["config"]
        collection.delete_one({"_id": session_id})

    def write_history(self, session_id: str, history: list[HistoryEntry | AIHistoryEntry]):
        collection = self.history_database[session_id]
        collection.drop()
        for entry in history:
            collection.insert_one(asdict(entry, dict_factory=custom_asdict))

    def write_evaluations(self, session_id: str, data: EvaluationData):
        collection = self.evaluation_database[session_id]
        collection.drop()
        collection.insert_one(asdict(data, dict_factory=custom_asdict))

    def delete_history(self, session_id: str):
        collection = self.history_database[session_id]
        collection.drop()

    def get_history(self, session_id: str) -> list[HistoryEntry | AIHistoryEntry]:
        collection = self.history_database[session_id]
        elements = collection.find()
        lst: list[HistoryEntry | AIHistoryEntry] = []

        for element in elements:
            if element["type"] == "ai":
                lst.append(AIHistoryEntry(element["type"],
                                          element["content"],
                                          element["timestamp"],
                                          element["llm"],
                                          element["sources"]))
            else:
                lst.append(HistoryEntry(element["type"],
                                        element["content"],
                                        element["timestamp"]))

        return lst

    def get_evaluation_data(self, session_id: str) -> EvaluationData:
        collection = self.evaluation_database[session_id]
        element = collection.find_one()

        if element is None:
            return EvaluationData.empty()

        return from_dict(data_class=EvaluationData, data=element)

    def get_sessions(self) -> list[str]:
        ids = []
        for doc in self.configuration_database["config"].find({}, {'_id': 1}):
            ids.append(doc['_id'])
        return ids
