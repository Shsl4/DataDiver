import os
from dataclasses import dataclass


@dataclass
class RetrieverConfig:
    llm_name: str
    embeddings_size: int

    @staticmethod
    def new(llm_name: str, model_size: int):
        return RetrieverConfig(llm_name, model_size)


class Config:
    is_docker = True if os.environ.get('DOCKER') else False
    listen_port = 7000
    mongo_path = os.environ.get("DatabaseUrl")
    if mongo_path is None:
        mongo_path = "mongodb://localhost:27017"
    valid_llms = ["mistral", "phi3", "llama3.1"]
    valid_retrievers = ["sentence-transformers/all-MiniLM-L12-v2",
                        "sentence-transformers/all-mpnet-base-v2",
                        "BAAI/bge-m3"]
    retrievers: dict[str, RetrieverConfig] = {
        "BAAI/bge-m3": RetrieverConfig.new("BAAI/bge-m3", 1024),
        "sentence-transformers/all-mpnet-base-v2": RetrieverConfig.new("sentence-transformers/all-mpnet-base-v2", 768),
        "sentence-transformers/all-MiniLM-L12-v2": RetrieverConfig.new("sentence-transformers/all-MiniLM-L12-v2", 384)
    }
    database_stores: dict[int, str] = {
        1024: "db/embed-1024/",
        768: "db/embed-768/",
        384: "db/embed-384/",
    }
