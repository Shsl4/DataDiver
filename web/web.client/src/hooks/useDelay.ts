/**
 * An asynchronous delay function
 * @param {number} ms The time to wait in milliseconds
 */
function useDelay(ms: number = 0): [Promise<void>, () => void] {
    let timeoutId: NodeJS.Timeout;
    let rejectPromise: (reason?: any) => void;

    const promise = new Promise<void>((resolve, reject) => {
        rejectPromise = reject;
        timeoutId = setTimeout(resolve, ms);
    });

    function cancel() {
        clearTimeout(timeoutId);
        rejectPromise(new Error("Cancelled"));
    }

    return [promise, cancel];
}

export default useDelay;
