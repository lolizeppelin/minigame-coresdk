/**
 * 异步事件,用于模拟http事件
 */
// eslint-disable-next-line max-classes-per-file
export class EventEmitter {

    private events: { [key: string]: MiniGameTypes.Callback[] } = {};

    On(event: string, listener: MiniGameTypes.Callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    Off(event: string, listener: MiniGameTypes.Callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    Emit(event: string) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener());
    }
}


/**
 * 异步队列
 */
export class AsyncQueue<T> {


    static readonly EventKey = 'Async.Query.Event'


    private queue: T[] = [];

    private emitter = new EventEmitter();

    // 添加元素到队列中
    Push(item: T) {
        this.queue.push(item);
        // 触发事件通知有新元素加入
        this.emitter.Emit(AsyncQueue.EventKey);
    }

    // 获取队列中的元素
    Pop(): T | undefined {
        return this.queue.shift();
    }

    // 检查队列是否为空
    get empty(): boolean {
        return this.queue.length === 0;
    }

    // 监听队列中有新元素加入的事件
    Listen(listener: () => void) {
        this.emitter.On(AsyncQueue.EventKey, listener);
    }
}


/**
 * 执行异步队列
 * @param queue
 * @param handler
 * @constructor
 */
export function ProcessQueue<T>(queue: AsyncQueue<T>, handler: (item: T) => Promise<void>) {
    const processNext = () => {
        if (queue.empty) {
            queue.Listen(processNext);
            return;
        }
        const item = queue.Pop();
        if (!item) {
            queue.Listen(processNext);
            return;
        }
        handler(item).then(_ => processNext())

    };
    // 开始处理队列中的元素
    processNext();
}