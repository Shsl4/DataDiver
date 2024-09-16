from typing import Any

from flask import jsonify, Response

INTERNAL_ERROR_MESSAGE = "An unexpected internal error occurred."


def internal_server_error(message=INTERNAL_ERROR_MESSAGE, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new internal server error response.
    :param message: The error message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "Internal Server Error",
        "message": message,
        **additional
    }
    return jsonify(response), 500


def not_found(message: str, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new not found response.
    :param message: The error message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "Not Found",
        "message": message,
        **additional
    }
    return jsonify(response), 404


def method_not_allowed(message: str, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new not allowed response.
    :param message: The error message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "Method Not Allowed",
        "message": message,
        **additional
    }
    return jsonify(response), 405


def bad_request(message: str, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new bad request response.
    :param message: The error message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "Bad Request",
        "message": message,
        **additional
    }
    return jsonify(response), 400


def unsupported_media(message: str, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new unsupported media response.
    :param message: The error message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "Unsupported Media Type",
        "message": message,
        **additional
    }
    return jsonify(response), 415


def ok(message: str, additional: dict[str, Any] = None) -> tuple[Response, int]:
    """
    Creates a new ok response.
    :param message: The status message.
    :param additional: Additional response data.
    :return: A tuple containing the response and status code.
    """
    if additional is None:
        additional = {}

    response = {
        "name": "OK",
        "message": message,
        **additional
    }
    return jsonify(response), 200
