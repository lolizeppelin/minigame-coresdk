// eslint-disable-next-line import/no-extraneous-dependencies
import {
    GameOrder, GameRole, HandlerResult, HandlerResults,
    Result, Results, Tracker, User, UserInfo, VersionInfo
} from "minigame-typings";
import { Md5 } from "ts-md5";
import { sha1 } from "js-sha1";

/*-------------------- 常量 --------------------*/

const Pattern = /^\d+(\.\d+){0,2}$/

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
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function NoneHandlerResults(result: Results) {
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
        if (r.code === 0) {
            resp.success.push(r)
        } else {
            resp.failure += 1
            resp.errors.push(r)
        }
    })

    return resp
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
    prefix = prefix ?? result.code === 0 ? "result success" : "result failed"
    let payload = ""
    if (typeof result.payload === 'string') {
        payload = result.payload
    } else if (result.payload === null || result.payload === undefined) {
        payload = ""
    } else {
        try {
            payload = JSON.stringify(payload)
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
     * 支付方式
     * @protected
     */
    protected _payment_handlers: Record<string, HandlerPaymentMethods> = {}

    /**
     * 初始化接口列表
     */
    protected initialization: Promise<Result>[] = []

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
            throw Error("not login")
        }
        return this._user
    }

    /**
     * 确认是否登录
     */
    get authenticated(): boolean {
        return this._user === null
    }

    protected Initialize(...initializers: Promise<Result>[]) {
        initializers.forEach(p => {
            this.initialization.push(p)
        })
    }

    protected async WaitInit(): Promise<Results> {
        if (this.initialization.length === 0) {
            return new Promise<Results>(resolve => {
                resolve(NewResults("initializer"))
            })
        }
        return Promise.all(this.initialization).then(
            results => {
                console.log("core sdk initialized")
                return NewResults("initializer", results)
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
                payload: this.user,
            })
            return
        }
        this.WaitInit().then(
            initializations => {
                if (initializations.failure !== 0) {
                    callback({
                        code: ErrCodeInitialize,
                        trigger: initializations.trigger,
                        payload: initializations,
                    })
                    return
                }
                this._get_authenticate(params, (users) => {
                    // 认证完成追踪
                    this.PushEvent("login.authenticate", users)
                    this._login(users, info => {
                        const user: User = {
                            sdk: info.user,
                            channel: users.channel ?? info.user,
                            platform: users.platform,
                            registered: info.registered
                        }
                        // 用户登录追踪
                        this.UserLogin(user)
                        // 重上报调用
                        this.RetryReport({user: user})
                        this._user = user
                        callback({
                            code: CodeSuccess,
                            trigger: "login.sdk",
                            payload: user
                        })
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
            if (result.code !== 0) {
                callback(result)
                return
            }
            const trigger = result.trigger
            const handler = this._payment_handlers[trigger]
            if (!handler) {
                callback(result)
            }
            handler(order, {params, info: result.payload}, callback)
        })
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
    RetryReport(payload: { user?: User, role?: GameRole }) {
        Object.keys(this._trackers).forEach(key => {
            const tracker = this._trackers[key]
            tracker.Retry(payload)
        })
    }


    private handlerTrace(method: string, authenticated: boolean,
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
                fn(options, (res: Result) => resolve(res))
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
        this.handlerTrace("PushEvent", false, {event, params}, callback)
    }

    /**
     * 用户创建追踪
     * @param callback
     */
    UserCreate(callback?: HandlerResults): void {
        this.handlerTrace("UserCreate", true, {}, callback)
    }

    /**
     * 用户登录追踪
     * @param user
     * @param callback
     */
    UserLogin(user: User, callback?: HandlerResults): void {
        this.handlerTrace("UserLogin", false, {user}, callback)
    }

    /**
     * 用户登出追踪
     * @param role
     * @param callback
     */
    UserLogout(role: GameRole | null, callback?: HandlerResults): void {
        const options: Record<string, any> = {}
        if (role) options.role = role
        this.handlerTrace("UserLogout", true, options, callback)
    }

    /**
     * 用户通用事件追踪
     * @param event
     * @param params
     * @param callback
     */
    UserEvent(event: string, params: Record<string, any>,
              callback?: HandlerResults): void {
        this.handlerTrace("UserEvent", true, {event, params}, callback)
    }

    /**
     * 角色登录追踪
     * @param role
     * @param callback
     */
    RoleLogin(role: GameRole, callback?: HandlerResults): void {
        this.handlerTrace("RoleLogin", true, {role}, callback)
    }

    /**
     * 角色创建追踪
     * @param role
     * @param callback
     */
    RoleCreate(role: GameRole, callback?: HandlerResults): void {
        this.handlerTrace("RoleCreate", true, {role}, callback)
    }

    /**
     * 角色升级追踪
     * @param role     角色
     * @param level    升级的等级
     * @param callback
     */
    RoleUpLevel(role: GameRole, level: number, callback?: HandlerResults): void {
        this.handlerTrace("RoleUpLevel", true, {role, level}, callback)
    }

    /**
     * 角色支付追踪
     * @param role
     * @param order
     * @param callback
     */
    RoleRecharged(role: GameRole, order: GameOrder,
                  callback?: HandlerResults): void {
        this.handlerTrace("RoleRecharged", true, {role, order}, callback)
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
        this.handlerTrace("RoleEvent", true, {role, event, params}, callback)
    }

}


/**
 * 空Tracker
 */
export class BaseTracker {

    // @ts-ignore
    protected name: string

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

    /**
     * 触发器名
     * @constructor
     */
    get trigger(): string {
        return this.name
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
        handler(payload, callback)

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
        handler(payload, callback)
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


    RoleRecharged(payload: { user: User, role: GameRole, order: GameOrder },
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
        handler(payload, callback)
    }

    /* eslint-disable */
}