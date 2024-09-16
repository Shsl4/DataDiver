declare global {
    interface String {
        isEmpty(): boolean;
        capitalize(): string;
    }

    interface Array<T> {
        last(): T | undefined;
    }
}

String.prototype.isEmpty = function (): boolean {
    return this.trim().length == 0;
};

String.prototype.capitalize = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Array.prototype.last = function (): T | undefined {
    if (this.length == 0) return undefined;
    return this[this.length - 1];
};

export {};
