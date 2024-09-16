import { useState } from "react";

/**
 * The array state type
 */
type ArrayState<T> = [
    data: T[],
    add: (data: T) => void,
    remove: (removeCondition: (obj: T, index: number) => boolean) => void,
    update: (index: number, updatedObject: T) => void,
    insert: (element: T) => void,
    set: (data: T[]) => void
];

/**
 * A custom hook allowing to manage the state of an array object by providing interaction functions
 * @param defaultValue The default state value
 * @return The array data and manipulation functions
 */
function useArrayState<T>(defaultValue?: T[]): ArrayState<T> {
    const [elements, setElements] = useState<T[]>(defaultValue ?? []);

    /**
     * Updates the array state with new data
     * @param data The new array data
     */
    function set(data: T[]) {
        return setElements(data);
    }

    /**
     * Appends an element to the array
     * @param newObject The element to add
     */
    function add(newObject: T) {
        setElements(oldValue => [...oldValue, newObject]);
    }

    /**
     * Removes elements from the array according to a filter
     * @param removeCondition The condition to remove elements
     */
    function remove(removeCondition: (obj: T, index: number) => boolean) {
        setElements(oldValue => oldValue.filter((obj, index) => !removeCondition(obj, index)));
    }

    /**
     * Updates the object at index
     * @param index The index of the object to replace
     * @param updatedObject The new object
     */
    function update(index: number, updatedObject: T) {
        setElements(oldValue => {
            if (index < 0 || index >= oldValue.length) {
                console.error(`Index ${index} is out of bounds for array of length ${oldValue.length}`);
                return oldValue;
            }
            const updatedArray = [...oldValue];
            updatedArray[index] = updatedObject;
            return updatedArray;
        });
    }

    /**
     * Inserts an object at the head of the array
     * @param element The new object
     */
    function unshift(element: T) {
        setElements(oldValue => {
            let arr = [...oldValue];
            arr.unshift(element);
            return arr;
        });
    }

    return [elements, add, remove, update, unshift, set];
}

export default useArrayState;
