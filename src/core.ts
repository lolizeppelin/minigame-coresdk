// eslint-disable-next-line max-classes-per-file
import "url-search-params-polyfill"
import { Options as URIOpts, URIComponent } from "fast-uri"
import log from "loglevel"
import * as consts from "./constants"
import { FileTypeMatch, NewResults, NoneHandlerResult, NoneHandlerResults, ParseURI } from "./utils"

/*-------------------- 类 --------------------*/

/**
 * 核心SDK
 */
export class CoreSDK {
    /**
     * uri解析, 生成fast-uri URIComponent对象(rfc3986)
     * @param uri
     * @param options
     */
    public static ParseURI(uri: string, options?: URIOpts): URIComponent {
        return ParseURI(uri, options)
    }

    protected _after_authenticate: MiniGameTypes.Callback[] = []

    protected _after_login: MiniGameTypes.LoginHook[] = []

    private handlers: Record<string, MiniGameTypes.ExtHandler> = {}

    /**
     * 定时器
     * @protected
     */
    protected _timers: Record<string, MiniGameTypes.Callback> = {}

    /**
     * hook
     * @protected
     */
    protected _hooks: Record<string, MiniGameTypes.HandlerResult[]> = {}

    /**
     * Promise 异步值回调
     * @protected
     */
    protected _observers: Record<string, MiniGameTypes.Callback[]> = {}

    /**
     * 初始化接口列表
     */
    protected _initializations: Promise<MiniGameTypes.Result>[] = []

    /**
     * 追踪器
     * @private
     */
    private readonly _trackers: Record<string, MiniGameTypes.Tracker> = {}

    /**
     * 登录用户信息
     * @protected
     */
    protected _user: MiniGameTypes.User | null = null

    protected _shared: MiniGameTypes.SharedInfo = {
        link: {
            title: "",
            query: {},
            url: "",
            path: "",
        },
        callback: _ => {
            /** empty **/
        },
    }

    /**
     * 应用信息
     * @private
     */
    private _app: MiniGameTypes.Application

    /**
     * 缓存接口
     */
    public readonly storage: MiniGameTypes.CacheStorage

    /**
     * http 请求api
     */
    public readonly request: MiniGameTypes.HttpRequestHandler

    /**
     * 已经加载的插件
     * @protected
     */
    protected readonly _plugins: MiniGameTypes.Plugin[] = []

    /** 插件加载器
     * plugin loaders
     */
    private readonly _loaders: Record<string, MiniGameTypes.PluginLoder> = {}

    private _initializes: Promise<MiniGameTypes.Results> | null = null

    /**
     * 获取用户信息
     */
    public get user(): MiniGameTypes.User {
        if (this._user === null) {
            log.trace("get user without login")
            throw Error("not login")
        }
        return this._user
    }

    /**
     * 分享信息
     */
    get shared(): MiniGameTypes.ShareLink {
        return this._shared.link
    }

    /**
     * 应用
     */
    public get app(): MiniGameTypes.Application {
        return this._app
    }

    /**
     * 确认是否登录
     */
    public get authenticated(): boolean {
        return this._user !== null
    }

    constructor(
        app: MiniGameTypes.Application,
        request: MiniGameTypes.HttpRequestHandler,
        storage: MiniGameTypes.CacheStorage
    ) {
        this._app = app
        this.storage = storage
        this.request = request
    }

    /**
     * 设置日志等级
     * @param level
     */
    public SetLogLevel(level: "error" | "warn" | "info" | "debug") {
        log.setLevel(level)
    }

    /* ---内部--- */

    /**
     * 注册支付
     * @param trigger
     * @param handler
     * @protected
     */
    protected RegPay(trigger: string, handler: MiniGameTypes.HandlerPay): void {
        this.handlers[trigger] = handler
    }

    /**
     * 注册支付方式获取
     * @param handler
     * @protected
     */
    protected RegPayMethods(handler: MiniGameTypes.HandlerPayMethod): void {
        this.handlers[consts.HandlerPayMethods] = handler
    }

    /**
     * 注册处理函数
     * @param name
     * @param handler
     * @protected
     */
    protected RegHandler(name: string, handler: MiniGameTypes.ExtHandler): void {
        this.handlers[name] = handler
    }

    /**
     * handler调用
     * @param name
     * @param params
     * @param callback
     */
    protected Call(name: string, params: any, callback?: MiniGameTypes.HandlerResult) {
        const handler = this.handlers[name]
        if (!handler && callback) {
            callback({ code: consts.ErrCodeHandlerNotFound, trigger: "sdk.handler.call", payload: name })
            return
        }
        handler && handler(params, callback ?? NoneHandlerResult)
    }

    /**
     * 调用插件方法(同步)
     * @param plugin
     * @param params
     */
    protected PluginExecute(plugin: string, params?: any): MiniGameTypes.Result {
        // eslint-disable-next-line no-restricted-syntax
        for (const p of this._plugins) {
            if (p.name === plugin) {
                try {
                    return p.Execute(params)
                } catch (e) {
                    return { code: consts.ErrUnknown, trigger: "plugin.execute.exc", payload: e }
                }
            }
        }
        return {
            code: consts.ErrCodeHandlerNotFound,
            trigger: "plugin.execute.notfound",
            payload: `plugin ${plugin} not found or disabled`,
        }
    }

    /**
     * 调用插件方法(异步)
     * @param plugin
     * @param params
     * @param callback
     */
    protected PluginCall(plugin: string, params: any, callback: MiniGameTypes.HandlerResult): void {
        // eslint-disable-next-line no-restricted-syntax
        for (const p of this._plugins) {
            if (p.name === plugin) {
                try {
                    p.Call(params, callback)
                    return
                } catch (e) {
                    callback({ code: consts.ErrUnknown, trigger: "plugin.call.exc", payload: e })
                }
            }
        }
        callback({
            code: consts.ErrCodeHandlerNotFound,
            trigger: "plugin.call.notfound",
            payload: `plugin ${plugin} not found or disabled`,
        })
    }

    /**
     * 注册插件加载器
     * @param name
     * @param loader
     */
    protected RegPlugin(name: string, loader: MiniGameTypes.PluginLoder) {
        this._loaders[name] = loader
    }

    /* ---公用--- */

    /**
     * 注册追踪器
     * @param name
     * @param tracker
     */
    public RegTracker(name: string, tracker: MiniGameTypes.Tracker) {
        this._trackers[name] = tracker
    }

    /**
     * 消息推送
     * @param name
     * @param result
     */
    public Publish(name: string, result: MiniGameTypes.Result) {
        this._Publish(`USER.${name.toLowerCase()}`, result)
    }

    /**
     * 注册用户钩子
     * @param name  name会调用toLowerCase,请使用小写与逗号组合
     * @param callback
     */
    public RegHook(name: string, callback: MiniGameTypes.HandlerResult) {
        this._RegHook(`USER.${name.toLowerCase()}`, callback)
    }

    /**
     * 注册钩子
     * @param name
     * @param callback
     */
    protected _RegHook(name: string, callback: MiniGameTypes.HandlerResult) {
        if (!this._hooks[name]) {
            this._hooks[name] = []
        }
        log.info("register hook: ", name)
        this._hooks[name].push(callback)
    }

    /**
     * 消息推送
     * @param name
     * @param result
     */
    protected _Publish(name: string, result: MiniGameTypes.Result) {
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
            return
        }
        plugins.forEach(cfg => {
            if (cfg.disabled) return
            const CLS = this._loaders[cfg.name]
            if (!CLS) {
                // 插件代码未能加载
                log.error("plugin loader is missing: ", cfg.name)
                this._Publish(consts.ErrHooks.plugin, {
                    code: consts.ErrCodeInitialize,
                    trigger: "plugin.missing",
                    payload: cfg.name,
                })
                return
            }
            try {
                const plugin = new CLS(cfg, this)
                this._plugins.push(plugin)
            } catch (e) {
                log.error("load plugin is failed: ", cfg.name)
                log.debug("plugin error: ", e)
                this._Publish(consts.ErrHooks.plugin, {
                    code: consts.ErrCodeInitialize,
                    trigger: "plugin.load",
                    payload: e,
                })
            }
        })
    }

    /**
     * 新建一个Observable
     * @param key
     * @protected
     */
    protected _Subscribe(key: string): Promise<MiniGameTypes.Result> {
        return new Promise<MiniGameTypes.Result>(resolve => {
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
    protected _Complete(key: string, result: MiniGameTypes.Result): boolean {
        if (!(key in this._observers)) {
            return false
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
    protected _Initialize(...initializers: Promise<MiniGameTypes.Result>[]) {
        initializers.forEach(p => {
            this._initializations.push(p)
        })
    }

    /**
     * 等待初始化完成
     * @protected
     */
    protected _WaitInit(): Promise<MiniGameTypes.Results> {
        if (!this._initializes) {
            this._initializes =
                this._initializations.length === 0
                    ? new Promise<MiniGameTypes.Results>(resolve => {
                          resolve(NewResults("initializer"))
                      })
                    : Promise.all(this._initializations).then(results => {
                          // 初始化app对象
                          results.some(result => {
                              if (result.trigger === consts.AppInitialize) {
                                  this._app = result.payload
                                  return true // 结束 some 循环
                              }
                              return false
                          })
                          // 初始化插件
                          const r = NewResults("initializer", results)
                          if (r.failure > 0) {
                              this._Publish(consts.ErrHooks.initialize, {
                                  code: consts.ErrCodeInitialize,
                                  trigger: "core.wait.init",
                                  payload: r.errors,
                              })
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
    protected _RefreshToken(
        params: Record<string, any>,
        user: MiniGameTypes.User,
        callback?: MiniGameTypes.HandlerResult
    ) {
        if (!this.authenticated) return
        const handler = this.handlers[consts.TimerTokenRefresh]
        if (!handler) return
        handler({ params, user }, callback ?? NoneHandlerResult)
    }

    /**
     * 重上报触发
     * @param payload
     */
    protected _RetryReport(payload: { user?: MiniGameTypes.User; role?: MiniGameTypes.GameRole }) {
        Object.keys(this._trackers).forEach(key => {
            const tracker = this._trackers[key]
            tracker.Retry(payload)
        })
    }

    private _HandlerTrace(
        method: string,
        authenticated: boolean,
        options: Record<string, any>,
        callback?: MiniGameTypes.HandlerResults
    ) {
        const trigger = `core.sdk.${method}`
        const cb = callback ?? NoneHandlerResults
        if (authenticated) {
            if (!this.authenticated) {
                cb({
                    failure: -1,
                    trigger: `${trigger}.UnAuthenticated`,
                    success: [],
                    errors: [],
                })
                return
            }
            options.user = this.user
        }
        const promises: Promise<MiniGameTypes.Result>[] = []
        Object.keys(this._trackers).forEach(name => {
            const tracker = this._trackers[name]
            log.debug(`tracer: '${name}' call: '${method}'`)
            promises.push(
                new Promise(resolve => {
                    // @ts-ignore
                    const fn = tracker[method]
                    if (!fn) {
                        resolve({
                            code: consts.ErrCodeNotFound,
                            trigger: name,
                            payload: `method:${method} not found from tracker: ${name}`,
                        })
                        return
                    }
                    fn.call(tracker, options, (res: MiniGameTypes.Result) => resolve(res))
                })
            )
        })
        if (promises.length <= 0) {
            cb(NewResults(trigger))
        }
        Promise.all(promises).then(results => {
            cb(NewResults(trigger, results))
        })
    }

    /* -------登录--------- */

    /**
     * 登录
     * 登录成功时, callback返回值中的payload结构为User
     */
    Login(params: Record<string, any>, callback: MiniGameTypes.HandlerResult) {
        if (this.authenticated) {
            callback({
                code: consts.CodeSuccess,
                trigger: "already.login",
                payload: this.user,
            })
            return
        }
        this._WaitInit().then(initializations => {
            if (initializations.failure !== 0) {
                log.error("initialization failure count: ", initializations.failure)
                const lErr = {
                    code: consts.ErrCodeInitialize,
                    trigger: initializations.trigger,
                    payload: initializations,
                }
                callback(lErr)
                this._Publish(consts.ErrHooks.login, lErr)
                return
            }
            const handler = this.handlers[consts.HandlerAuthenticate]
            if (!handler) {
                callback({
                    code: consts.ErrCodeHandlerNotFound,
                    trigger: "authenticate.handler",
                    payload: "handler not found",
                })
            }
            handler(params, result => {
                if (result.code !== consts.CodeSuccess) {
                    callback(result)
                    this._Publish(consts.ErrHooks.login, result)
                    return
                }
                log.info("authenticate success")
                log.debug("authenticate payload: ", result.payload)
                // 认证后调用
                // eslint-disable-next-line no-restricted-syntax
                for (const h of this._after_authenticate) {
                    try {
                        h(result.payload)
                    } catch (e) {
                        const lErr = { code: consts.ErrCodeSDK, trigger: "authenticate.hook", payload: e }
                        callback(lErr)
                        this._Publish(consts.ErrHooks.login, lErr)
                        return
                    }
                }
                // 认证完成追踪
                this.PushEvent("login.authenticate", result.payload)
                const _handler = this.handlers[consts.HandlerLogin]
                if (!handler) {
                    callback({
                        code: consts.ErrCodeHandlerNotFound,
                        trigger: "login.handler",
                        payload: "handler not found",
                    })
                }
                _handler(result.payload, logged => {
                    if (logged.code !== consts.CodeSuccess) {
                        this._Publish(consts.ErrHooks.login, logged)
                        callback(logged)
                        return
                    }
                    const user: MiniGameTypes.User = logged.payload
                    log.info("login success")
                    log.debug("login payload: ", user)
                    // 设置用户
                    this._user = user
                    // 登录后调用
                    // eslint-disable-next-line no-restricted-syntax
                    for (const h of this._after_login) {
                        try {
                            h(user)
                        } catch (e) {
                            const lErr = { code: consts.ErrCodeSDK, trigger: "login.hook", payload: e }
                            callback(lErr)
                            this._Publish(consts.ErrHooks.login, lErr)
                            return
                        }
                    }
                    // 重上报调用
                    this._RetryReport({ user })
                    // 插件登录后
                    // eslint-disable-next-line no-restricted-syntax
                    for (const p of this._plugins) {
                        try {
                            p.AfterLogin(user)
                        } catch (e) {
                            const lErr = { code: consts.ErrCodeSDK, trigger: "login.plugin.hook", payload: e }
                            callback(lErr)
                            this._Publish(consts.ErrHooks.login, lErr)
                            return
                        }
                    }
                    // 用户登录追踪
                    if (user.registered) {
                        this.UserLogin(user)
                    } else {
                        this.UserCreate()
                    }

                    callback({
                        code: consts.CodeSuccess,
                        trigger: "login.sdk",
                        payload: user,
                    })
                    // 启动token刷新定时器
                    this._StartTimer(consts.TimerTokenRefresh, params)
                })
            })
        })
    }

    /* -------支付--------- */

    /**
     * 支付
     * @param order
     * @param params
     * @param callback
     */
    Pay(order: MiniGameTypes.GameOrder, params: Record<string, any>, callback: MiniGameTypes.HandlerResult) {
        if (!this.authenticated) {
            this._Publish(consts.ErrHooks.pay, { code: consts.ErrCodeUnAuthenticate, trigger: "pay", payload: order })
            callback({
                code: consts.ErrCodeUnAuthenticate,
                trigger: "user.null",
                payload: "not login",
            })
            return
        }
        const selector = this.handlers[consts.HandlerPayMethods]
        if (!selector) {
            callback({ code: consts.ErrCodeSDK, trigger: "pay", payload: "pay handler not found" })
        }
        const user = this.user
        selector({ order, params, user }, result => {
            if (result.code !== consts.CodeSuccess) {
                this._Publish(consts.ErrHooks.pay, result)
                log.error("get payment methods failed: ", result.trigger)
                log.debug("get payment response: ", result.payload)
                callback(result)
                return
            }
            const trigger = result.trigger
            log.debug("pay with handler: ", trigger)
            const submit = this.handlers[trigger]
            if (!submit) {
                const res = { code: consts.ErrCodeHandlerNotFound, trigger: "pay.methods", payload: result }
                this._Publish(consts.ErrHooks.pay, res)
                log.error("pay handler: ", trigger, ", not found")
                callback(res)
                return
            }
            submit({ order, params, user, payment: result.payload }, res => {
                if (res.code !== consts.CodeSuccess) {
                    this._Publish(consts.ErrHooks.pay, res)
                } else {
                    this._Publish(consts.HookPayed, {
                        code: consts.CodeSuccess,
                        trigger: res.trigger,
                        payload: {
                            request: { order, params, user, payment: result.payload },
                            response: res.payload,
                        },
                    })
                }
                callback(res)
            })
        })
    }

    /**
     * 消息检查
     * @param content  正文
     * @param options  额外参数
     * @param callback 回调
     */
    public ValidateText(content: string, options: Record<string, any>, callback: MiniGameTypes.HandlerResult) {
        if (!this.authenticated) {
            callback({ code: consts.ErrCodeUnAuthenticate, trigger: "validate.text", payload: content })
            return
        }
        this.Call(consts.HandlerText, { content, options, user: this.user }, callback)
    }

    /**
     * 校验媒体
     * @param uri   rfc3986   e.g  https://path.jpg file:///var/1.png
     * @param options
     * @param callback
     */
    public ValidateMedia(uri: URIComponent, options: Record<string, any>, callback: MiniGameTypes.HandlerResult) {
        if (!this.authenticated) {
            callback({ code: consts.ErrCodeUnAuthenticate, trigger: "validate.media", payload: uri.path })
            return
        }
        const paths = uri.path ? uri.path.split("/").filter(segment => segment.length > 0) : null
        if (!paths) {
            callback({ code: consts.ErrCodeParameters, trigger: "validate.media", payload: "path not found from uri" })
            return
        }
        const file = paths[paths.length - 1]
        if (
            !FileTypeMatch(file, consts.VideoExtensions) &&
            !FileTypeMatch(file, consts.AudioExtensions) &&
            !FileTypeMatch(file, consts.MediaExtensions) &&
            file.split(".").length === 0
        ) {
            callback({ code: consts.ErrCodeParameters, trigger: "validate.media", payload: "path not media file" })
            return
        }
        this.Call(consts.HandlerMedia, { uri, options, user: this.user }, callback)
    }

    /**
     * 校验图片
     * @param uri   rfc3986   e.g  https://path.jpg file:///var/1.png
     * @param options
     * @param callback
     */
    public ValidateImg(uri: URIComponent, options: Record<string, any>, callback: MiniGameTypes.HandlerResult) {
        if (!this.authenticated) {
            callback({ code: consts.ErrCodeUnAuthenticate, trigger: "validate.image", payload: uri.path })
            return
        }
        const paths = uri.path ? uri.path.split("/").filter(segment => segment.length > 0) : null
        if (!paths) {
            callback({ code: consts.ErrCodeParameters, trigger: "validate.image", payload: "path not found from uri" })
            return
        }
        const file = paths[paths.length - 1]
        if (!FileTypeMatch(file, consts.ImageExtensions) && file.split(".").length === 0) {
            callback({ code: consts.ErrCodeParameters, trigger: "validate.image", payload: "path not image file" })
            return
        }
        this.Call(consts.HandlerImage, { uri, options, user: this.user }, callback)
    }

    /* ------------ 上报 ------------ */

    /**
     * 无需登录可上报事件
     * @param event
     * @param params
     * @param callback
     */
    PushEvent(event: string, params?: Record<string, any> | null, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("PushEvent", false, { event, params }, callback)
    }

    /**
     * 用户创建追踪
     * @param callback
     * @protected
     */
    protected UserCreate(callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("UserCreate", true, {}, callback)
    }

    /**
     * 用户登录追踪
     * @param user
     * @param callback
     */
    protected UserLogin(user: MiniGameTypes.User, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("UserLogin", false, { user }, callback)
    }

    /**
     * 用户登出追踪(必须完成用户登录)
     * @param role
     * @param callback
     */
    UserLogout(role: MiniGameTypes.GameRole | null, callback?: MiniGameTypes.HandlerResults): void {
        const options: Record<string, any> = {}
        if (role) options.role = role
        this._HandlerTrace("UserLogout", true, options, callback)
    }

    /**
     * 用户通用事件追踪(必须完成用户登录)
     * @param event
     * @param params
     * @param callback
     */
    UserEvent(event: string, params?: Record<string, any> | null, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("UserEvent", true, { event, params }, callback)
    }

    /**
     * 用户支付追踪(必须完成用户登录)
     * @param id    本地订单号
     * @param payment  支付信息
     * @param params
     * @param callback
     */
    UserRecharged(
        id: string,
        payment: MiniGameTypes.Payment,
        params: Record<string, any>,
        callback?: MiniGameTypes.HandlerResults
    ): void {
        this._HandlerTrace("UserRecharged", true, { id, params, payment }, callback)
    }

    /**
     * 角色登录追踪(必须完成用户登录)
     * @param role
     * @param callback
     */
    RoleLogin(role: MiniGameTypes.GameRole, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("RoleLogin", true, { role }, callback)
    }

    /**
     * 角色创建追踪(必须完成用户登录)
     * @param role
     * @param callback
     */
    RoleCreate(role: MiniGameTypes.GameRole, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("RoleCreate", true, { role }, callback)
    }

    /**
     * 角色升级追踪(必须完成用户登录)
     * @param role     角色
     * @param level    升级的等级
     * @param callback
     */
    RoleUpLevel(role: MiniGameTypes.GameRole, level: number, callback?: MiniGameTypes.HandlerResults): void {
        this._HandlerTrace("RoleUpLevel", true, { role, level }, callback)
    }

    /**
     * 角色支付追踪(必须完成用户登录)
     * @param id    本地订单号
     * @param order 下单信息
     * @param payment  支付信息
     * @param params
     * @param callback
     */
    RoleRecharged(
        id: string,
        order: MiniGameTypes.GameOrder,
        payment: MiniGameTypes.Payment,
        params: Record<string, any>,
        callback?: MiniGameTypes.HandlerResults
    ): void {
        this._HandlerTrace("RoleRecharged", true, { id, params, order, payment }, callback)
    }

    /**
     * 角色通用事件追踪(必须完成用户登录)
     * @param event
     * @param role
     * @param params
     * @param callback
     */
    RoleEvent(
        event: string,
        role: MiniGameTypes.GameRole,
        params?: Record<string, any> | null,
        callback?: MiniGameTypes.HandlerResults
    ): void {
        this._HandlerTrace("RoleEvent", true, { role, event, params }, callback)
    }
}
