from typing import TypeVar, Type

T = TypeVar('T')


def require_type(data: dict, element: str, t: Type[T]) -> T:
    """
    Checks if an element exists in the data dictionary, ensures its type and returns it.
    :param data: The dictionary to be checked
    :param element: The element to be checked
    :param t: The type to be checked
    :return: The type cast value
    :raises KeyError if the element does not exist.
    :raises TypeError if the element type does not match the required type.
    """
    if element not in data.keys():
        raise KeyError(f"The key '{element}' is required but was not found.")
    if not isinstance(data[element], t):
        raise TypeError(f"{element}: Expected {t.__name__} but got {type(data[element]).__name__} instead")
    return data[element]


def require_unit(data: dict, element: str) -> float:
    """
    Checks if an element exists in the data dictionary, ensures it is a float in range (0.0 - 1.0) and returns it.
    :param data: The dictionary to be checked
    :param element: The element to be checked
    :return: The float value
    :raises KeyError if the element does not exist.
    :raises TypeError if the element is not a float.
    :raises ValueError if the element is not in range (0.0 - 1.0).
    """
    value = require_type(data, element, float)
    if value < 0.0 or value > 1.0:
        raise ValueError(f"{element} must be between 0.0 and 1.0, but got {value}")
    return value


def require_bound(data: dict, element: str, r: range) -> int:
    """
    Checks if an element exists in the data dictionary, ensures it is an int in range and returns it.
    :param data: The dictionary to be checked
    :param element: The element to be checked
    :param r: The range to be checked
    :return: The int value
    :raises KeyError if the element does not exist.
    :raises TypeError if the element is not an int.
    :raises ValueError if the element is not in range.
    """
    value = require_type(data, element, int)
    if value not in r:
        raise ValueError(f"{element} must be between {r.start} and {r.stop}, but got {value}")
    return value
