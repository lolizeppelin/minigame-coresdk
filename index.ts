// eslint-disable-next-line max-classes-per-file
import 'url-search-params-polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
    GameOrder, GameRole, HandlerResult, HandlerResults, Callback,
    Result, Results, Tracker, User, UserInfo, VersionInfo
} from "minigame-typings";
import { Md5 } from "ts-md5";
import { sha1 } from "js-sha1";
import log from 'loglevel'


log.setLevel("error", false)

/*-------------------- 常量 --------------------*/

const Pattern = /^\d+(\.\d+){0,2}$/


export const TimerTokenRefresh = 'sys.token.refresh'

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


/*-------------------- 接口 --------------------*/

/**
 * 订单处理函数
 */
export interface HandlerPayment {
    (order: GameOrder, params: Record<string, any>, callback: HandlerResult): void
}

/**
 * 支付方式处理函数
 */
export interface HandlerPaymentMethods {
    (order: GameOrder, options: { params: Record<string, any>, info: any }, callback: HandlerResult): void
}


/**
 * 支付方式获取函数
 */
export interface GetPayMethods {
    (order: GameOrder, params: Record<string, any>, handler: HandlerResult): void
}

/**
 * 平台 认证函数
 */
export interface Authenticate {
    (params: Record<string, any>,
     onSuccess: (users: { channel?: UserInfo, platform: UserInfo, options?: Record<string, any> }) => void,
     onFailed: HandlerResult): void
}

/**
 * sdk 登录函数
 */
export interface SDKLogin {
    (params: { channel?: UserInfo, platform: UserInfo, options?: Record<string, any> },
     onSuccess: (info: { user: UserInfo; registered: boolean; options: Record<string, any> }) => void,
     onFailed: HandlerResult): void
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
 * 空handler
 * @param result
 */
export function NoneHandlerResults(result: Results) {
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
    return `${ format(date.getFullYear(), 4) }-${ format(date.getMonth() + 1, 2) }-${ format(date.getDate(), 2) } ${ format(date.getHours(), 2) }:${ format(date.getMinutes(), 2) }:${ format(date.getSeconds(), 2) }`;
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
    const link = sandbox ? `${ obj.protocol }//sandbox.${ obj.host }${ obj.pathname }` :
        `${ obj.protocol }//${ obj.host }${ obj.pathname }`
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
    return `${ prefix }, trigger: '${ result.trigger }', payload: '${ payload }'`
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
 * 按次数重试
 * @param trigger
 * @param callback
 * @param retryTimes
 * @param options
 * @constructor
 */
export function CallbackWithRetry(trigger: string, callback: () => Promise<Result>, retryTimes: number,
                                  options?: { first: number, next: number, increment: boolean }): Promise<Result> {
    const opt = options ?? {first: 3000, next: 500, increment: false}
    return new Promise((resolve, reject) => {
        const retry = (attempt: number) => {
            callback().then(resolve).catch((res: Result) => {
                if (attempt > retryTimes) {
                    reject(res);
                } else {
                    // eslint-disable-next-line no-nested-ternary
                    const delay = attempt === 0
                        ? 3000
                        : (opt.increment ? attempt * opt.next : opt.next);
                    log.debug(`async retry: ${ trigger } ${ attempt } times, delay ${ delay } ms`)
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

    /**
     * 登录
     * @protected
     */
        // @ts-ignore
    protected _login: SDKLogin
    /**
     * 认证
     * @protected
     */
        // @ts-ignore
    protected _get_authenticate: Authenticate
    /**
     * 获取支付方式
     * @protected
     */
        // @ts-ignore
    protected _get_payment_methods: GetPayMethods

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
    protected _observers: Record<string, Callback> = {}

    /**
     * 支付方式
     * @protected
     */
    protected _payment_handlers: Record<string, HandlerPaymentMethods> = {}

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

    /**
     * 获取用户信息
     */
    get user(): User {
        if (this._user === null) {
            log.trace("get user without login")
            throw Error("not login")
        }
        return this._user
    }

    /**
     * 确认是否登录
     */
    get authenticated(): boolean {
        return this._user !== null
    }

    /**
     * 设置日志等级
     * @param level
     * @constructor
     */
    SetLogLevel(level: "error" | "warn" | "info" | "debug") {
        log.setLevel(level)
    }


    /**
     * 注册用户钩子
     * @param name
     * @param callback
     * @constructor
     */
    RegHook(name: string, callback: HandlerResult) {
        this._RegHook(`user.${ name }`, callback)
    }

    /**
     * 注册钩子
     * @param name
     * @param callback
     */
    _RegHook(name: string, callback: HandlerResult) {
        if (this._hooks[name]) {
            this._hooks[name] = []
        }
        log.info('register hook: ', name)
        this._hooks[name].push(callback)
    }

    /**
     * 新建一个Observable
     * @param key
     * @constructor
     * @protected
     */
    protected _Subscribe(key: string): Promise<Result> | null {
        if (this._observers[key]) {
            return null
        }
        return new Promise<Result>(resolve => {
            this._observers[key] = resolve
        })
    }

    /**
     * 发送观察结果
     * @param key
     * @param result
     * @protected
     */
    protected _Complete(key: string, result: Result): boolean {
        const observer = this._observers[key]
        if (!observer) return false;
        observer(result)
        delete this._observers[key]
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
    protected async _WaitInit(): Promise<Results> {
        if (this._initializations.length === 0) {
            return new Promise<Results>(resolve => {
                resolve(NewResults("initializer"))
            })
        }
        const results = await Promise.all(this._initializations);
        return NewResults("initializer", results);
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
            log.warn(`timer '${ timer }' not found`)
            return
        }
        log.info(`timer '${ timer }' started`)
        t(options)
        delete this._timers[timer]
    }


    /* ------------ 上报 ------------ */

    /**
     * 注册追踪器
     * @param name
     * @param tracker
     */
    RegTracker(name: string, tracker: Tracker) {
        this._trackers[name] = tracker
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
        const trigger = `core.sdk.${ method }`
        const cb = callback ?? NoneHandlerResults
        if (authenticated) {
            if (!this.authenticated) {
                cb({
                    failure: -1,
                    trigger: `${ trigger }.UnAuthenticated`,
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
            log.debug(`tracer: '${ name }' call: '${ method }'`)
            promises.push(new Promise(resolve => {
                // @ts-ignore
                const fn = tracker[method]
                if (!fn) {
                    resolve({
                        code: ErrCodeNotFound, trigger: name,
                        payload: `method:${ method } not found from tracker: ${ name }`
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
     * @param order
     * @param params
     * @param callback
     */
    RoleRecharged(order: GameOrder, params: Record<string, any>,
                  callback?: HandlerResults): void {
        this._HandlerTrace("RoleRecharged", true, {params, order}, callback)
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


    /* -------登录--------- */

    /**
     * 登录
     */
    Login(params: Record<string, any>, callback: HandlerResult) {
        if (this.authenticated) {
            callback({
                code: CodeSuccess,
                trigger: "already.login",
                payload: this.user,
            })
            return
        }
        this._WaitInit().then(
            initializations => {
                if (initializations.failure !== 0) {
                    log.error("initialization failure count: ", initializations.failure)
                    if (log.getLevel() <= 1) {
                        initializations.errors.forEach(err => {
                            log.debug("error trigger: ", err.trigger, " detail: ", err.payload)
                        })
                    }
                    callback({
                        code: ErrCodeInitialize,
                        trigger: initializations.trigger,
                        payload: initializations,
                    })
                    return
                }
                this._get_authenticate(params, (users) => {
                    log.info("authenticate success")
                    log.debug("authenticate payload: ", users)
                    // 认证完成追踪
                    this.PushEvent("login.authenticate", users)
                    this._login(users, info => {
                        log.info("login success")
                        log.debug("login payload: ", info)
                        const user: User = {
                            sdk: info.user,
                            channel: users.channel ?? info.user,
                            platform: users.platform,
                            registered: info.registered
                        }
                        // 用户登录追踪
                        this.UserLogin(user)
                        // 重上报调用
                        this._RetryReport({user: user})
                        this._user = user
                        callback({
                            code: CodeSuccess,
                            trigger: "login.sdk",
                            payload: user
                        })
                        // 启动token刷新定时器
                        this._StartTimer(TimerTokenRefresh, params)
                    }, callback)
                }, callback)
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
            callback({
                code: ErrCodeUnAuthenticate,
                trigger: "user.null",
                payload: "not login",
            })
            return
        }
        this._get_payment_methods(order, params, (result: Result) => {
            if (result.code !== CodeSuccess) {
                log.error("get payment methods failed: ", result.trigger)
                log.debug("get payment response: ", result.payload)
                callback(result)
                return
            }
            const trigger = result.trigger
            log.debug("pay with handler: ", trigger)
            const handler = this._payment_handlers[trigger]
            if (!handler) {
                log.error("pay handler: ", trigger, ", not found")
                result.code = ErrCodeHandlerNotFound
                callback(result)
            }
            handler.call(this, order, {params, info: result.payload}, callback)
        })
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

    /* eslint-disable */

    Retry(payload: { user?: User, role?: GameRole }): void {

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


    RoleRecharged(payload: { user: User, order: GameOrder, params: Record<string, any> },
                  callback: HandlerResult): void {
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

    /* eslint-disable */
}