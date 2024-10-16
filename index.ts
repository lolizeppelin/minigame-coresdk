// eslint-disable-next-line max-classes-per-file
import 'url-search-params-polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
    GameOrder, GameRole, HandlerResult, HandlerResults, Callback, PluginLoder, SharedInfo,
    Result, Results, Tracker, User, VersionInfo, Payment, Plugin, ApplicationInfo, CacheStorage,
    ExtHandler, LoginHook, HandlerPayMethod, HandlerPay
} from "minigame-typings";
import { Md5 } from "ts-md5";
import { sha1 } from "js-sha1";
import log, { Logger } from 'loglevel'
import base64url from "base64url";


log.setLevel("error", false)

/*-------------------- 常量 --------------------*/

const Pattern = /^\d+(\.\d+){0,2}$/


export const TimerTokenRefresh = 'sys.token.refresh'

export const AppInitialize = 'app.initialize'

export const HandlerAuthenticate = 'handler.authenticate'  // 认证

export const HandlerLogin = 'handler.login'  // 登录

export const HandlerPayMethods = 'handler.pay.methods'  // 支付方式

export const HookPayed = 'handler.payed'  // 支付方式

/**
 * 未知错误
 */
export const ErrUnknown = -1

/**
 * 成功
 */
export const CodeSuccess = 0

/**
 * SDK错误
 */
export const ErrCodeSDK = 1

/**
 * 渠道错误
 */
export const ErrCodeChannel = 2

/**
 * 认证错误
 */
export const ErrCodePlatform = 3

/**
 * 未认证错误
 */
export const ErrCodeUnAuthenticate = 11

/**
 * 初始化错误
 */
export const ErrCodeInitialize = 12

/**
 * 参数错误
 */
export const ErrCodeParameters = 13


/**
 * 对象未找到错误
 */
export const ErrCodeNotFound = 14

/**
 *
 */
export const ErrCodeHandlerNotFound = 15


export const ErrHooks = {
    initialize: "error.init",
    plugin: "error.plugin",
    login: "error.login",
    pay: "error.pay"
}


/*-------------------- 方法 --------------------*/

function format(input: number, padLength: number): string {
    let s = input.toString()
    while (s.length < padLength) {
        s = "0" + s
    }
    return s
}

/**
 * 公共logleve模块
 */
export function getLogger(): Logger {
    return log
}


/**
 * 空handler
 * @param result
 */
export function NoneHandlerResults(result: Results): void {
    /**
     * empty
     */
}

/**
 * 空handler
 */
export function NoneHandlerResult(result: Result): void {
    /**
     * empty
     */
}


/**
 * 转为为批量错误
 * @param trigger
 * @param results
 * @constructor
 */
export function NewResults(trigger: string, results?: Result[]) {
    const resp: Results = {
        failure: 0,
        trigger: trigger,
        success: [],
        errors: []
    }
    if (!results) {
        return resp
    }
    results.forEach(r => {
        if (r.code === CodeSuccess) {
            resp.success.push(r)
        } else {
            resp.failure += 1
            resp.errors.push(r)
        }
    })

    return resp
}


/** base64 api **/

export function Base64URLFromBase64(text: string): string {
    return base64url.fromBase64(text)
}

export function Base64ToBase64URL(payload: string | Buffer): string {
    return base64url.toBase64(payload)
}


export function Base64URLEncode(payload: string | Buffer, encoding?: string): string {
    return base64url.encode(payload, encoding)
}


export function Base64URLDecode(text: string, encoding?: string): string {
    return base64url.decode(text, encoding)
}

/** base64 api **/

/**
 * url query解析方法
 * @param query
 */
export function ParseQuery(query?: string): Record<string, string> {
    if (!query) return {}
    const parameters = new URLSearchParams(query);
    const m: Record<string, string> = {}
    parameters.forEach((v, k) => {
        m[k] = v
    })
    return m
}

/**
 * url query 生成方法
 * @param data
 * @constructor
 */
export function BuildQuery(data?: Record<string, string>): string {
    if (!data) return ""
    const parameters = new URLSearchParams();
    parameters.forEach((v, k) => {
        parameters.set(k, v);
    })
    Object.keys(data).forEach(k => {
        parameters.set(k, data[k]);
    })
    parameters.sort();
    return parameters.toString()
}

/**
 *
 * @param params url params
 * @param blank 是否忽略空白字段
 */
export function ParamsMerge(params: Record<string, string>, blank: boolean): string {
    let s = '';
    Object.keys(params).sort().forEach(key => {
        if (blank || params[key] !== "") {
            s += key + "=" + params[key] + "&"
        }
    })
    if (s.endsWith('&')) {
        return s.slice(0, -1);
    }
    return s
}

/**
 * url 参数合并(key+value模式)
 * @param params url params
 * @param blank 是否忽略空白字段
 */
export function ParamsCompress(params: Record<string, string>, blank: boolean): string {
    let s = '';
    Object.keys(params).sort().forEach(key => {
        if (blank || params[key] !== "") {
            s += params[key]
        }
    })
    return s;
}

export function Md5Sum(s: string): string {
    return Md5.hashStr(s)
}

export function Sha1Sum(s: string): string {
    return sha1(s)
}

export function Sha1Hmac(s: string, key: string): string {
    return sha1.hmac(key, s)
}

/**
 * 当前unix时间(秒)
 */
export function UnixNow(): number {
    return Math.floor(Date.now() / 1000)
}

/**
 * 当前时间 格式  1970-01-01 00:00:00
 */
export function DateTimeNow(): string {
    const date = new Date();
    return `${format(date.getFullYear(), 4)}-${format(date.getMonth() + 1, 2)}-${format(date.getDate(), 2)} ${format(date.getHours(), 2)}:${format(date.getMinutes(), 2)}:${format(date.getSeconds(), 2)}`;
}

/**
 * url解析
 * @param url
 */
export function ParseURL(url: string) {
    const match = url.match(/^(https?:)\/\/(([^:/?#]*)(?::([0-9]+))?)(\/?[^?#]*)(\?[^#]*|)(#.*|)$/);
    if (!match) throw Error("Parse url failed")
    return {
        href: url,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}


/**
 * 替换为 sandbox url
 * @param url
 * @param sandbox
 */
function SandboxUrl(url: string, sandbox: boolean): string {
    const obj = ParseURL(url);
    const link = sandbox ? `${obj.protocol}//sandbox.${obj.host}${obj.pathname}` :
        `${obj.protocol}//${obj.host}${obj.pathname}`
    return link.endsWith('/') ? link.slice(0, -1) : link
}

/**
 * 标准版本解析
 * @param version
 */
export function LoadVersion(version: string): VersionInfo | null {

    if (!Pattern.test(version)) return null
    let major = 0
    let minor = 0
    let patch = 0

    const parts = version.split(".")
    switch (parts.length) {
        case 1:
            major = parseInt(parts[0], 10)
            break
        case 2:
            major = parseInt(parts[0], 10)
            minor = parseInt(parts[1], 10)
            break
        case 3:
            major = parseInt(parts[0], 10)
            minor = parseInt(parts[1], 10)
            patch = parseInt(parts[2], 10)
            break
        default:
            return null
    }
    return {major, minor, patch}
}


/**
 *
 * @param v1
 * @param v2
 * @constructor
 */
export function CmpVer(v1: VersionInfo, v2: VersionInfo): -1 | 0 | 1 {

    if (v1.major > v2.major) {
        return 1;
    }
    if (v1.major < v2.major) {
        return -1;
    }
    // If major versions are equal, compare minor versions
    if (v1.minor > v2.minor) {
        return 1;
    }
    if (v1.minor < v2.minor) {
        return -1;
    }

    // If minor versions are equal, compare patch versions
    if (v1.patch > v2.patch) {
        return 1;
    }
    if (v1.patch < v2.patch) {
        return -1;
    }
    // If all versions are equal, return 0
    return 0;

}


/**
 * 尝试从result中提取出文本
 * @param result
 * @param prefix
 */
export function ResultMessage(result: Result, prefix?: string): string {
    prefix = prefix ?? result.code === CodeSuccess ? "result success" : "result failed"
    let payload = ""
    if (typeof result.payload === 'string') {
        payload = result.payload
    } else if (result.payload === null || result.payload === undefined) {
        payload = ""
    } else {
        try {
            payload = JSON.stringify(result.payload)
        } catch {
            try {
                payload = result.payload.toString()
            } catch {
                payload = ""
            }
        }
    }
    return `${prefix}, trigger: '${result.trigger}', payload: '${payload}'`
}

/**
 * 延迟调用
 * @param ms
 * @constructor
 */
export function Delay(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

/**
 * 自动重试异步方法
 * @param trigger     调用触发器
 * @param callback    回调函数
 * @param options     重试参数(默认重试3次、间隔3s)
 * @constructor
 */
export function CallbackWithRetry(trigger: string, callback: () => Promise<Result>,
                                  options?: {
                                      /**
                                       * 重试次数
                                       */
                                      times: number;
                                      /**
                                       * 重试延迟
                                       */
                                      delay: number;
                                      /**
                                       * 首次请求延迟
                                       */
                                      first?: number;
                                      /**
                                       * 延迟递增
                                       */
                                      increment?: boolean;
                                      /**
                                       * 最大延迟
                                       */
                                      max?: number
                                  }): Promise<Result> {
    const opt = options ?? {times: 3, delay: 3000}
    const retryTimes = opt.times > 0 ? opt.times : 1

    return new Promise((resolve, reject) => {
        const retry = (attempt: number) => {
            callback().then(resolve).catch((e) => {
                if (attempt > retryTimes) {
                    reject(e);
                    return
                }
                /* ----延迟计算---- */
                let delay = 0
                if (attempt === 0) {
                    delay = opt.first ?? opt.delay
                } else {
                    delay = opt.increment ? attempt * opt.delay : opt.delay
                    if (opt.max && delay > opt.max) {
                        delay = opt.max
                    }
                }

                if (delay <= 0) {
                    log.debug(`async retry: ${trigger} ${attempt} times`)
                    retry(attempt + 1)
                } else {
                    log.debug(`async retry: ${trigger} ${attempt} times, delay ${delay} ms`)
                    Delay(delay).then(_ => retry(attempt + 1));
                }

            });
        };

        retry(0);
    });
}


/*-------------------- 类 --------------------*/

/**
 * 核心SDK
 */
export class CoreSDK {


    protected _after_authenticate: Callback[] = []

    protected _after_login: LoginHook[] = []

    private handlers: Record<string, ExtHandler> = {}

    /**
     * 定时器
     * @protected
     */
    protected _timers: Record<string, Callback> = {}

    /**
     * hook
     * @protected
     */
    protected _hooks: Record<string, HandlerResult[]> = {}

    /**
     * Promise 异步值回调
     * @protected
     */
    protected _observers: Record<string, Callback[]> = {}

    /**
     * 初始化接口列表
     */
    protected _initializations: Promise<Result>[] = []

    /**
     * 追踪器
     * @private
     */
    private readonly _trackers: Record<string, Tracker> = {};

    /**
     * 登录用户信息
     * @protected
     */
    protected _user: User | null = null;

    protected _shared: SharedInfo = {
        link: {
            title: "",
            query: {},
            url: "",
            path: ""
        },
        callback: _ => {
            /** empty **/
        }

    }

    /**
     * 应用信息
     * @private
     */
    private _app: ApplicationInfo;
    /**
     * 缓存接口
     * @private
     */
    public readonly storage: CacheStorage;


    /**
     * 已经加载的插件
     * @protected
     */
    protected readonly _plugins: Plugin[] = [];

    /** 插件加载器
     * plugin loaders
     */
    private readonly _loaders: Record<string, PluginLoder> = {}

    private _initializes: Promise<Results> | null = null

    /**
     * 获取用户信息
     */
    public get user(): User {
        if (this._user === null) {
            log.trace("get user without login")
            throw Error("not login")
        }
        return this._user
    }

    /**
     * 分享信息
     */
    get shared() {
        return this._shared.link
    }

    /**
     * 应用
     */
    public get app(): ApplicationInfo {
        return this._app
    }

    /**
     * 确认是否登录
     */
    public get authenticated(): boolean {
        return this._user !== null
    }

    constructor(app: ApplicationInfo, storage: CacheStorage) {
        this._app = app
        this.storage = storage
    }

    /**
     * 设置日志等级
     * @param level
     * @constructor
     */
    public SetLogLevel(level: "error" | "warn" | "info" | "debug") {
        log.setLevel(level)
    }

    /* ---内部--- */

    /**
     * 注册支付
     * @param trigger
     * @param handler
     * @constructor
     * @protected
     */
    protected RegPay(trigger: string, handler: HandlerPay): void {
        this.handlers[trigger] = handler
    }

    /**
     * 注册支付方式获取
     * @param handler
     * @constructor
     * @protected
     */
    protected RegPayMethods(handler: HandlerPayMethod): void {
        this.handlers[HandlerPayMethods] = handler
    }

    /**
     * 注册处理函数
     * @param name
     * @param handler
     * @constructor
     * @protected
     */
    protected RegHandler(name: string, handler: ExtHandler): void {
        this.handlers[name] = handler
    }

    /**
     * handler调用
     * @param name
     * @param params
     * @param callback
     */
    protected Call(name: string, params: any, callback?: HandlerResult) {
        const handler = this.handlers[name]
        if (!handler && callback) {
            callback({code: ErrCodeParameters, trigger: "sdk.handler.call", payload: "handler not found"})
        }
        handler(params, callback ?? NoneHandlerResult)
    }

    /**
     * 注册插件加载器
     * @param name
     * @param loader
     * @constructor
     */
    protected RegPlugin(name: string, loader: PluginLoder) {
        this._loaders[name] = loader
    }

    /* ---公用--- */

    /**
     * 注册追踪器
     * @param name
     * @param tracker
     */
    public RegTracker(name: string, tracker: Tracker) {
        this._trackers[name] = tracker
    }

    /**
     * 消息推送
     * @param name
     * @param result
     * @constructor
     */
    public Publish(name: string, result: Result) {
        this._Publish(`user.${name}`, result)
    }

    /**
     * 注册用户钩子
     * @param name
     * @param callback
     * @constructor
     */
    public RegHook(name: string, callback: HandlerResult) {
        this._RegHook(`user.${name}`, callback)
    }

    /**
     * 注册钩子
     * @param name
     * @param callback
     */
    protected _RegHook(name: string, callback: HandlerResult) {
        if (this._hooks[name]) {
            this._hooks[name] = []
        }
        log.info('register hook: ', name)
        this._hooks[name].push(callback)
    }

    /**
     * 消息推送
     * @param name
     * @param result
     * @constructor
     */
    protected _Publish(name: string, result: Result) {
        const handlers = this._hooks[name]
        if (!handlers) return
        handlers.forEach(h => {
            h(result)
        })
    }

    /**
     * 加载插件
     * @private
     */
    private _LoadPlugins(): void {
        const plugins = this.app.plugins
        if (!plugins || plugins.length === 0) {
            return;
        }
        plugins.forEach(cfg => {
            if (cfg.disabled) return
            const CLS = this._loaders[cfg.name]
            if (!CLS) {
                // 插件代码未能加载
                log.error("plugin loader is missing: ", cfg.name)
                this._Publish(ErrHooks.plugin, {code: ErrCodeInitialize, trigger: 'plugin.missing', payload: cfg.name});
                return;
            }
            try {
                const plugin = new CLS(cfg, this)
                this._plugins.push(plugin)
            } catch (e) {
                log.error("load plugin is failed: ", cfg.name)
                log.debug("plugin error: ", e)
                this._Publish(ErrHooks.plugin, {code: ErrCodeInitialize, trigger: 'plugin.load', payload: e});
            }
        })
    }

    /**
     * 新建一个Observable
     * @param key
     * @constructor
     * @protected
     */
    protected _Subscribe(key: string): Promise<Result> {
        return new Promise<Result>(resolve => {
            if (!(key in this._observers)) {
                this._observers[key] = []
            }
            this._observers[key].push(resolve)
        })
    }

    /**
     * 发送观察结果
     * @param key
     * @param result
     * @protected
     */
    protected _Complete(key: string, result: Result): boolean {
        if (!(key in this._observers)) {
            this._observers[key] = []
        }
        const observers = this._observers[key]
        delete this._observers[key]
        observers.forEach(observer => {
            observer(result)
        })
        return true
    }


    /**
     * 初始化对象插入(避免多次调用)
     * @param initializers
     * @protected
     */
    protected _Initialize(...initializers: Promise<Result>[]) {
        initializers.forEach(p => {
            this._initializations.push(p)
        })
    }

    /**
     * 等待初始化完成
     * @protected
     */
    protected _WaitInit(): Promise<Results> {
        if (!this._initializes) {
            this._initializes = this._initializations.length === 0 ? new Promise<Results>(resolve => {
                resolve(NewResults("initializer"))
            }) : Promise.all(this._initializations).then(results => {
                // 初始化app对象
                results.some(result => {
                    if (result.trigger === AppInitialize) {
                        this._app = result.payload
                        return true; // 结束 some 循环
                    }
                    return false;
                });
                // 初始化插件
                const r = NewResults("initializer", results)
                if (r.failure > 0) {
                    this._Publish(ErrHooks.initialize, {
                        code: ErrCodeInitialize, trigger: 'core.wait.init',
                        payload: r.errors
                    });
                }
                this._LoadPlugins()
                if (this._plugins.length > 0) {
                    this._plugins.forEach(p => {
                        p.AfterInitialize(r)
                    })
                }
                return r
            })
        }
        return this._initializes
    }

    /**
     * 启动定时器
     * @param timer
     * @param options
     * @protected
     */
    protected _StartTimer(timer: string, options?: any) {
        const t = this._timers[timer]
        if (!t) {
            log.warn(`timer '${timer}' not found`)
            return
        }
        log.info(`timer '${timer}' started`)
        t(options)
        delete this._timers[timer]
    }

    /**
     * 刷新token
     * @param params
     * @param user
     * @param callback
     * @protected
     */
    protected _RefreshToken(params: Record<string, any>, user: User, callback?: HandlerResult) {
        if (!this.authenticated) return
        const handler = this.handlers[TimerTokenRefresh]
        if (!handler) return
        handler({params, user}, callback ?? NoneHandlerResult)
    }


    /**
     * 重上报触发
     * @param payload
     * @constructor
     */
    protected _RetryReport(payload: { user?: User, role?: GameRole }) {
        Object.keys(this._trackers).forEach(key => {
            const tracker = this._trackers[key]
            tracker.Retry(payload)
        })
    }

    private _HandlerTrace(method: string, authenticated: boolean,
                          options: Record<string, any>, callback?: HandlerResults) {
        const trigger = `core.sdk.${method}`
        const cb = callback ?? NoneHandlerResults
        if (authenticated) {
            if (!this.authenticated) {
                cb({
                    failure: -1,
                    trigger: `${trigger}.UnAuthenticated`,
                    success: [],
                    errors: []
                })
                return
            }
            options.user = this.user
        }
        const promises: Promise<Result>[] = []
        Object.keys(this._trackers).forEach(name => {
            const tracker = this._trackers[name]
            log.debug(`tracer: '${name}' call: '${method}'`)
            promises.push(new Promise(resolve => {
                // @ts-ignore
                const fn = tracker[method]
                if (!fn) {
                    resolve({
                        code: ErrCodeNotFound, trigger: name,
                        payload: `method:${method} not found from tracker: ${name}`
                    })
                    return
                }
                fn.call(tracker, options, (res: Result) => resolve(res))
            }))
        })
        if (promises.length <= 0) {
            cb(NewResults(trigger))
        }
        Promise.all(promises).then(results => {
                cb(NewResults(trigger, results))
            }
        )
    }


    /* -------登录--------- */

    /**
     * 登录
     */
    Login(params: Record<string, any>, callback: HandlerResult) {
        if (this.authenticated) {
            callback({
                code: CodeSuccess,
                trigger: "already.login",
                payload: this.user
            })
            return
        }
        this._WaitInit().then(
            initializations => {
                if (initializations.failure !== 0) {
                    log.error("initialization failure count: ", initializations.failure)
                    callback({
                        code: ErrCodeInitialize,
                        trigger: initializations.trigger,
                        payload: initializations
                    })
                    return
                }
                const handler = this.handlers[HandlerAuthenticate]
                if (!handler) {
                    callback({code: ErrCodeSDK, trigger: "sdk.login", payload: "authenticate handler not found"})
                }
                handler(params, result => {
                    if (result.code !== CodeSuccess) {
                        this._Publish(ErrHooks.login, result);
                        callback(result)
                        return
                    }
                    log.info("authenticate success")
                    log.debug("authenticate payload: ", result.payload)
                    this._after_authenticate.forEach(h => h(result.payload))
                    // 认证完成追踪
                    this.PushEvent("login.authenticate", result.payload)
                    const _handler = this.handlers[HandlerLogin]
                    if (!handler) {
                        callback({code: ErrCodeSDK, trigger: "login", payload: "login handler not found"})
                    }
                    _handler(result.payload, _result => {
                        if (_result.code !== CodeSuccess) {
                            this._Publish(ErrHooks.login, _result);
                            callback(_result)
                            return
                        }
                        log.info("login success")
                        log.debug("login payload: ", _result.payload)
                        // 登录后调用
                        this._after_login.forEach(h => h(_result.payload))
                        // 重上报调用
                        this._RetryReport({user: _result.payload})
                        // 设置用户
                        this._user = _result.payload
                        // 插件登录后
                        if (this._plugins.length > 0) {
                            this._plugins.forEach(p => p.AfterLogin(_result.payload))
                        }
                        // 用户登录追踪
                        this.UserLogin(_result.payload)
                        callback({
                            code: CodeSuccess,
                            trigger: "login.sdk",
                            payload: _result.payload
                        })
                        // 启动token刷新定时器
                        this._StartTimer(TimerTokenRefresh, params)
                    })

                })

            }
        )
    }

    /* -------支付--------- */

    /**
     * 支付
     * @param order
     * @param params
     * @param callback
     */
    Pay(order: GameOrder, params: Record<string, any>, callback: HandlerResult) {

        if (!this.authenticated) {
            this._Publish(ErrHooks.pay, {code: ErrCodeUnAuthenticate, trigger: 'pay', payload: order});
            callback({
                code: ErrCodeUnAuthenticate,
                trigger: "user.null",
                payload: "not login"
            })
            return
        }
        const handler = this.handlers[HandlerPayMethods]
        if (!handler) {
            callback({code: ErrCodeSDK, trigger: "pay", payload: "pay handler not found"})
        }
        const user = this.user
        handler({order, params, user}, result => {
            if (result.code !== CodeSuccess) {
                this._Publish(ErrHooks.pay, result);
                log.error("get payment methods failed: ", result.trigger)
                log.debug("get payment response: ", result.payload)
                callback(result)
                return
            }
            const trigger = result.trigger
            log.debug("pay with handler: ", trigger)
            const _handler = this.handlers[trigger]
            if (!_handler) {
                const res = {code: ErrCodeHandlerNotFound, trigger: 'pay.methods', payload: result}
                this._Publish(ErrHooks.pay, res);
                log.error("pay handler: ", trigger, ", not found")
                callback(res)
                return
            }
            _handler({order, params, user, payment: result.payload}, _result => {
                if (_result.code !== CodeSuccess) {
                    this._Publish(ErrHooks.pay, _result);
                } else {
                    this._Publish(HookPayed,
                        {
                            code: CodeSuccess, trigger: _result.trigger,
                            payload: {
                                request: {order, params, user, payment: result.payload},
                                response: _result.payload
                            }
                        })
                }
                callback(_result)
            })
        })
    }


    /* ------------ 上报 ------------ */


    /**
     * 未登录事件
     * @param event
     * @param params
     * @param callback
     * @constructor
     */
    PushEvent(event: string, params: Record<string, any>, callback?: HandlerResults): void {
        this._HandlerTrace("PushEvent", false, {event, params}, callback)
    }

    /**
     * 用户创建追踪
     * @param callback
     */
    UserCreate(callback?: HandlerResults): void {
        this._HandlerTrace("UserCreate", true, {}, callback)
    }

    /**
     * 用户登录追踪
     * @param user
     * @param callback
     */
    UserLogin(user: User, callback?: HandlerResults): void {
        this._HandlerTrace("UserLogin", false, {user}, callback)
    }

    /**
     * 用户登出追踪
     * @param role
     * @param callback
     */
    UserLogout(role: GameRole | null, callback?: HandlerResults): void {
        const options: Record<string, any> = {}
        if (role) options.role = role
        this._HandlerTrace("UserLogout", true, options, callback)
    }

    /**
     * 用户通用事件追踪
     * @param event
     * @param params
     * @param callback
     */
    UserEvent(event: string, params: Record<string, any>,
              callback?: HandlerResults): void {
        this._HandlerTrace("UserEvent", true, {event, params}, callback)
    }

    /**
     * 用户支付追踪
     * @param id    本地订单号
     * @param payment  支付信息
     * @param params
     * @param callback
     */
    UserRecharged(id: string, payment: Payment, params: Record<string, any>,
                  callback?: HandlerResults): void {
        this._HandlerTrace("UserRecharged", true, {id, params, payment}, callback)
    }


    /**
     * 角色登录追踪
     * @param role
     * @param callback
     */
    RoleLogin(role: GameRole, callback?: HandlerResults): void {
        this._HandlerTrace("RoleLogin", true, {role}, callback)
    }

    /**
     * 角色创建追踪
     * @param role
     * @param callback
     */
    RoleCreate(role: GameRole, callback?: HandlerResults): void {
        this._HandlerTrace("RoleCreate", true, {role}, callback)
    }

    /**
     * 角色升级追踪
     * @param role     角色
     * @param level    升级的等级
     * @param callback
     */
    RoleUpLevel(role: GameRole, level: number, callback?: HandlerResults): void {
        this._HandlerTrace("RoleUpLevel", true, {role, level}, callback)
    }

    /**
     * 角色支付追踪
     * @param id    本地订单号
     * @param order 下单信息
     * @param payment  支付信息
     * @param params
     * @param callback
     */
    RoleRecharged(id: string, order: GameOrder, payment: Payment, params: Record<string, any>,
                  callback?: HandlerResults): void {
        this._HandlerTrace("RoleRecharged", true, {id, params, order, payment}, callback)
    }

    /**
     * 角色通用事件追踪
     * @param event
     * @param role
     * @param params
     * @param callback
     */
    RoleEvent(event: string, role: GameRole, params: Record<string, any> | null,
              callback?: HandlerResults): void {
        this._HandlerTrace("RoleEvent", true, {role, event, params}, callback)
    }

}


/**
 * 空Tracker
 */
export class BaseTracker implements Tracker {

    private readonly name: string

    constructor(name: string) {
        this.name = name
    }

    /**
     * 触发器名
     * @constructor
     */
    get trigger(): string {
        return this.name
    }


    /**
     * 无用户事件
     * @protected
     */
    protected _event_handlers: Record<string,
        (payload: {
            event: string;
            params: Record<string, any>;
        }, callback: HandlerResult) => void> = {}

    /**
     * 用户事件
     * @protected
     */
    protected _user_event_handlers: Record<string,
        (payload: {
            event: string;
            user: User;
            params: Record<string, any>;
        }, callback: HandlerResult) => void> = {}

    /**
     * 角色事件
     * @protected
     */
    protected _role_event_handlers: Record<string, (payload: {
        event: string;
        user: User;
        role: GameRole;
        params: Record<string, any> | null;
    }, callback: HandlerResult) => void> = {}

    /**
     * 注册响应事件
     * @param events
     * @constructor
     */
    RegEvent(events: {
        event?: {
            event: string;
            handler: (payload: {
                event: string;
                params: Record<string, any>;
            }, callback: HandlerResult) => void
        };
        user?: {
            event: string;
            handler: (payload: {
                event: string;
                user: User;
                params: Record<string, any>;
            }, callback: HandlerResult) => void;
        };
        role?: {
            event: string;
            handler: (payload: {
                event: string;
                user: User;
                role: GameRole;
                params: Record<string, any> | null;
            }, callback: HandlerResult) => void;
        };
    }): void {
        if (events.event) {
            this._event_handlers[events.event.event] = events.event.handler
        }
        if (events.user) {
            this._user_event_handlers[events.user.event] = events.user.handler
        }
        if (events.role) {
            this._role_event_handlers[events.role.event] = events.role.handler
        }
    }

    Retry(payload: { user?: User, role?: GameRole }): void {
        // do retry
    }


    PushEvent(payload: {
        event: string;
        params: Record<string, any>,
    }, callback: HandlerResult): void {
        const handler = this._event_handlers[payload.event]
        if (!handler) {
            callback({code: CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)

    }


    UserCreate(payload: { user: User }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    UserLogin(payload: { user: User }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    UserLogout(payload: { user: User, role: GameRole | null }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    UserRecharged(payload: { id: string; user: User; params: Record<string, any>; payment: Payment },
                  callback: HandlerResult) {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }

    UserEvent(payload: { event: string, user: User, params: Record<string, any> },
              callback: HandlerResult): void {
        const handler = this._user_event_handlers[payload.event]
        if (!handler) {
            callback({code: CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)
    }


    RoleLogin(payload: { user: User, role: GameRole }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    RoleCreate(payload: { user: User, role: GameRole }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    RoleUpLevel(payload: { user: User, role: GameRole, level: number }, callback: HandlerResult): void {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    RoleRecharged(payload: { id: string; user: User; params: Record<string, any>; order: GameOrder; payment: Payment },
                  callback: HandlerResult) {
        callback({code: CodeSuccess, trigger: this.name, payload: null})
    }


    RoleEvent(payload: { event: string, user: User, role: GameRole, params: Record<string, any> | null },
              callback: HandlerResult): void {
        const handler = this._role_event_handlers[payload.event]
        if (!handler) {
            callback({code: CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)
    }

}
