import hashlib
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from config import Config

TIME_FORMAT = "%d/%m/%Y %H:%M"


@dataclass
class EvaluationResult:
    result_id: str
    criterion: str
    grade: float
    remark: str
    timestamp: str
    llm: str
    sources: dict[str, list[int]]


@dataclass
class EvaluationData:
    scenario: str
    criteria: list[str]
    answers: dict[str, str]
    results: dict[str, list[EvaluationResult]]

    def add_result(self, answer: str, result: EvaluationResult):
        self._get_result_list(answer).append(result)

    def _get_result_list(self, answer: str):
        key = hashlib.sha256(answer.encode()).hexdigest()
        if key in self.answers:
            return self.results[key]

        self.answers[key] = answer
        self.results[key] = []
        return self.results[key]

    @staticmethod
    def empty():
        return EvaluationData("", [], dict(), dict())


@dataclass
class HistoryEntry:
    type: str
    content: str
    timestamp: datetime


@dataclass
class AIHistoryEntry:
    type: str
    content: str
    timestamp: str
    llm: str
    sources: dict[str, list[int]]


class AlgorithmType(Enum):
    sim = "similarity"
    sst = "similarity_score_threshold"
    mmr = "mmr"

    @staticmethod
    def from_value(value: str):
        for member in AlgorithmType:
            if member.value == value:
                return member
        raise ValueError(f"{value} is not a valid AlgorithmType value")


class SessionType(Enum):
    chat = "chat"
    evaluation = "evaluation"

    @staticmethod
    def from_value(value: str):
        for member in SessionType:
            if member.value == value:
                return member
        raise ValueError(f"{value} is not a valid SessionType value")


@dataclass
class SSTParams:
    k: int
    score_threshold: float

    @staticmethod
    def new(k: int = 12, score_threshold: float = 0.3):
        return SSTParams(k, score_threshold)


@dataclass
class SimilarityParams:
    k: int

    @staticmethod
    def new(k: int = 4):
        return SimilarityParams(k)


@dataclass
class MMRParams:
    fetch_k: int
    lambda_mult: float

    @staticmethod
    def new(fetch_k: int = 20, lambda_mult: float = 0.5):
        return MMRParams(fetch_k, lambda_mult)


@dataclass
class SessionConfig:
    _id: str
    display_name: str
    session_type: SessionType
    llm_name: str
    retriever_name: str
    algorithm_type: AlgorithmType
    algorithm_params: MMRParams | SSTParams | SimilarityParams

    @staticmethod
    def default(session_id: str, display_name: str, session_type: SessionType):
        return SessionConfig(session_id,
                             display_name,
                             session_type,
                             Config.valid_llms[0],
                             Config.valid_retrievers[2],
                             AlgorithmType.sst,
                             SSTParams.new())

    @staticmethod
    def from_dict(data: dict[str, Any]):
        alg_type = AlgorithmType(data['algorithm_type'])
        session_type = SessionType(data['session_type'])

        if alg_type == AlgorithmType.mmr:
            params = MMRParams(**data['algorithm_params'])
        elif alg_type == AlgorithmType.sst:
            params = SSTParams(**data['algorithm_params'])
        else:
            params = SimilarityParams(**data['algorithm_params'])

        return SessionConfig(data["_id"], data["display_name"], session_type, data['llm_name'], data['retriever_name'],
                             alg_type, params)

    @property
    def id(self):
        return self._id


def custom_asdict(data):
    def convert_value(obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, set):
            return list(obj)
        return obj

    return dict((k, convert_value(v)) for k, v in data)
