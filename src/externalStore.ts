type Listener = () => void;

export class ExternalStore<T> {
    private readonly listeners = new Set<Listener>();

    constructor(private current: T) {}

    get = (): T => this.current;

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    protected set(value: T): void {
        this.current = value;
        this.listeners.forEach((listener) => listener());
    }
}
