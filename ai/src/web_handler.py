import os
import sys
import traceback
from dataclasses import asdict
from typing import Callable, Type

import requests
import waitress
from colorama import Fore, Style
from flask import Flask, request, send_from_directory
from pymongo.errors import ConnectionFailure
from werkzeug.exceptions import UnsupportedMediaType, BadRequest, NotFound, MethodNotAllowed

from config import Config
from models import custom_asdict, AlgorithmType, SessionType
from pipeline import Pipeline, SSTParams, MMRParams, SimilarityParams
from responses import internal_server_error, ok, bad_request, unsupported_media, not_found, method_not_allowed
from restrictions import require_type, require_bound, require_unit


def simplify_path(directory: str, full_path: str) -> str:
    directory = os.path.normpath(directory)
    full_path = os.path.normpath(full_path)

    try:
        start_index = full_path.index(directory)
    except ValueError:
        raise ValueError(f"The directory '{directory}' was not found in '{full_path}'")

    simplified_path = full_path[start_index + len(directory) + 1:]

    return simplified_path.replace(os.path.sep, '/')


class WebHandler:

    def __init__(self, name: str, pipeline: Pipeline):
        self.app = Flask(name)
        self.pipeline = pipeline

    def run(self):

        ##### URL Endpoints ####

        # Retrieve session configuration and history. Arguments (URL): id
        self.add_endpoint("/session/<string:session_id>", self.get_session, ["GET"])

        # Uses a session by its ID. Arguments (URL): id
        self.add_endpoint("/session/<string:session_id>", self.use_session, ["POST"])

        # Deletes a session by its ID. Arguments (URL): id
        self.add_endpoint("/session/<string:session_id>", self.delete_session, ["DELETE"])

        # Uses a different llm. Arguments (URL): llm
        self.add_endpoint("/llm/<string:llm>", self.use_llm, ["POST"])

        # Retrieves a source document. Arguments (URL): document
        self.add_endpoint("/document/<path:document>", self.get_document, ["GET"])

        # Returns all the existing sessions. Arguments: None
        self.add_endpoint("/sessions", self.get_sessions, ["GET"])

        ##### JSON Endpoints ####

        # Updates the current session configuration. Arguments (JSON): name -> str,
        # llm -> str, retriever -> str, alg -> str, params...
        self.add_endpoint("/config", self.update_config, ["POST"])

        # Uses a different llm. Arguments (JSON): retriever -> str
        self.add_endpoint("/retriever", self.use_retriever, ["POST"])

        # Enables similarity score threshold mode. Arguments (JSON): algorithm -> str, params...
        self.add_endpoint("/algorithm", self.use_algorithm, ["POST"])

        # Main endpoint, used to ask a question. Arguments (JSON): question -> str
        # Requires to use a session with /session or /create_session before calling
        self.add_endpoint("/ask", self.ask, ["POST"])

        # Main endpoint, used to evaluate an answer. Arguments (JSON): question -> str
        self.add_endpoint("/eval", self.eval, ["POST"])

        # Creates a new chat session, activates and returns its ID. Arguments (JSON): name -> str,
        # type -> str, llm -> str, retriever -> str, alg -> str, params...
        self.add_endpoint("/new_session", self.new_session, ["POST"])

        self.add_endpoint("/criteria", self.use_criteria, ["POST"])
        
        self.add_endpoint("/scenario", self.use_scenario, ["POST"])

        # Default python handlers. Defaults to returning a bad request with the appropriate message
        self.add_error_handler(TypeError, WebHandler.handle_type_error)
        self.add_error_handler(ValueError, WebHandler.handle_value_error)
        self.add_error_handler(KeyError, WebHandler.handle_key_error)
        self.add_error_handler(RuntimeError, WebHandler.handle_runtime_error)

        # Specific error handlers. Returns the appropriate error codes
        self.add_error_handler(UnsupportedMediaType, WebHandler.handle_unsupported_media)
        self.add_error_handler(BadRequest, WebHandler.handle_bad_request)
        self.add_error_handler(NotFound, WebHandler.handle_not_found)
        self.add_error_handler(MethodNotAllowed, WebHandler.handle_not_allowed)
        self.add_error_handler(ConnectionFailure, WebHandler.mongo_connection_failure)

        # Fallback exception handler. Prints a stacktrace and returns an internal server error
        self.add_error_handler(Exception, WebHandler.handle_exception)

        print(f"{Fore.CYAN}[*] MongoDB path: {Config.mongo_path}{Style.RESET_ALL}", flush=True)

        # Listen on all addresses using the configured port
        waitress.serve(self.app, host="0.0.0.0", port=Config.listen_port)

    def add_endpoint(self, endpoint: str, handler: Callable, methods: list[str]):
        self.app.add_url_rule(endpoint, None, handler, methods=methods)

    def add_error_handler(self, code: Type[Exception] | int, handler: Callable):
        self.app.register_error_handler(code, handler)

    def ask(self):
        try:
            data = request.get_json()
            sources, answer = self.pipeline.ask(require_type(data, 'question', str))
            return ok("Generated answer", additional={"answer": answer, "sources": sources})
        except requests.exceptions.ConnectionError:
            print(f"{Fore.RED}[-] Could not reach ollama, is the service running?{Style.RESET_ALL}", file=sys.stderr)
            return internal_server_error()

    def eval(self):
        try:
            data = request.get_json()
            criterion = require_type(data, 'criterion', str)
            answer = require_type(data, 'answer', str)
            result = self.pipeline.evaluate(criterion, answer)
            return ok("Generated answer", additional={"result": result})
        except requests.exceptions.ConnectionError:
            print(f"{Fore.RED}[-] Could not reach ollama, is the service running?{Style.RESET_ALL}", file=sys.stderr)
            return internal_server_error()

    def delete_session(self, session_id: str):
        if not self.pipeline.session_exists(session_id):
            raise ValueError(f"The session '{session_id}' does not exist")

        self.pipeline.delete_session(session_id)

        return ok(f"Deleted session {session_id}")

    def use_session(self, session_id: str):
        if not self.pipeline.use_session(session_id):
            raise ValueError(f"The session '{session_id}' does not exist")
        return ok(f"Now using session {self.pipeline.session_config.id}")

    def get_document(self, document: str):
        doc = simplify_path("resources", document)
        return send_from_directory("resources", doc)

    def use_algorithm(self):
        data = request.get_json()
        alg = AlgorithmType.from_value(require_type(data, 'algorithm', str))
        params = self.require_valid_parameters(data, alg)
        self.pipeline.use_algorithm(alg, params)
        return ok("Updated to similarity score threshold mode")

    def use_llm(self, llm: str):
        self.pipeline.use_llm(llm)
        return ok(f"Using {llm}")

    def get_session(self, session_id: str):
        session = self.pipeline.mongodb.get_session_config(session_id)

        if not session:
            raise ValueError(f"The session '{session_id}' does not exist")

        if self.pipeline.session_config.session_type == SessionType.chat:
            return ok(f"Retrieved session configuration", {"session": {
                "config": asdict(session, dict_factory=custom_asdict),
                "history": self.pipeline.dump_history(session_id)
            }})
        else:
            return ok(f"Retrieved session configuration", {"session": {
                "config": asdict(session, dict_factory=custom_asdict),
                "data": self.pipeline.mongodb.get_evaluation_data(session_id)
            }})

    def get_sessions(self):
        sessions = self.pipeline.mongodb.get_sessions()
        my_dict = dict()
        for session_id in sessions:
            config = self.pipeline.mongodb.get_session_config(session_id)
            if config.session_type == SessionType.chat:
                my_dict[session_id] = {
                    "config": asdict(config, dict_factory=custom_asdict),
                    "history": self.pipeline.dump_history(session_id)
                }
            elif config.session_type == SessionType.evaluation:
                my_dict[session_id] = {
                    "config": asdict(config, dict_factory=custom_asdict),
                    "data": self.pipeline.mongodb.get_evaluation_data(session_id)
                }
                
        return ok(f"Retrieved sessions", {"sessions": my_dict})

    def use_retriever(self):
        data = request.get_json()
        retriever = require_type(data, "retriever", str)
        self.pipeline.use_retriever(retriever)
        return ok(f"Using {retriever}")

    def new_session(self):
        data = request.get_json()
        name = require_type(data, "name", str)
        session_type = SessionType.from_value(require_type(data, "type", str))
        llm = require_type(data, "llm", str)
        retriever = require_type(data, "retriever", str)
        alg = AlgorithmType.from_value(require_type(data, 'algorithm', str))
        params = self.require_valid_parameters(data, alg)

        self.pipeline.create_and_use_session(name, session_type, llm, retriever, alg, params)
        return ok(f"Now using session {self.pipeline.session_config.id}",
                  {"session_id": self.pipeline.session_config.id})

    def use_criteria(self):
        data = request.get_json()
        criteria = require_type(data, 'criteria', list)
        self.pipeline.use_criteria(criteria)
        return ok("Updated the criteria")

    def use_scenario(self):
        data = request.get_json()
        scenario = require_type(data, 'scenario', str)
        self.pipeline.use_scenario(scenario)
        return ok("Updated the criteria")

    def update_config(self):
        data = request.get_json()
        name = require_type(data, "name", str)
        llm = require_type(data, "llm", str)
        retriever = require_type(data, "retriever", str)
        alg = AlgorithmType.from_value(require_type(data, 'algorithm', str))
        params = self.require_valid_parameters(data, alg)

        self.pipeline.use_name(name)
        self.pipeline.use_algorithm(alg, params)
        self.pipeline.use_llm(llm)
        self.pipeline.use_retriever(retriever)

        return ok(f"Updated configuration for session {self.pipeline.session_config.id}")

    @staticmethod
    def require_valid_parameters(data: dict, alg: AlgorithmType) -> SSTParams | MMRParams | SimilarityParams:
        match alg:
            case AlgorithmType.sst:
                return SSTParams(require_bound(data, 'k', range(3, 100)), require_unit(data, 'score_threshold'))
            case AlgorithmType.sim:
                return SimilarityParams(require_bound(data, 'k', range(3, 100)))
            case AlgorithmType.mmr:
                return MMRParams(require_bound(data, 'fetch_k', range(3, 100)), require_unit(data, "lambda_mult"))

    @staticmethod
    def handle_exception(e: Exception):
        traceback.print_exc(file=sys.stderr)
        return internal_server_error()

    @staticmethod
    def handle_type_error(e: TypeError):
        return bad_request(e.args[0] if e.args else 'unknown')

    @staticmethod
    def handle_value_error(e: ValueError):
        return bad_request(e.args[0] if e.args else 'unknown')

    @staticmethod
    def handle_runtime_error(e: RuntimeError):
        return bad_request(e.args[0] if e.args else 'unknown')

    @staticmethod
    def handle_key_error(e: KeyError):
        return bad_request(e.args[0] if e.args else 'unknown')

    @staticmethod
    def handle_unsupported_media(e: UnsupportedMediaType):
        return unsupported_media(e.description)

    @staticmethod
    def handle_bad_request(e: BadRequest):
        return bad_request(e.description)

    @staticmethod
    def handle_not_found(e: NotFound):
        return not_found(e.description)

    @staticmethod
    def handle_not_allowed(e: MethodNotAllowed):
        return method_not_allowed(e.description)

    @staticmethod
    def mongo_connection_failure(e: ConnectionFailure):
        print("[-] Failed to connect to MongoDB", file=sys.stderr)
        return internal_server_error()
