/*-------------------- 常量 --------------------*/


export const TimerTokenRefresh = 'sys.token.refresh'

export const AppInitialize = 'app.initialize'

export const HandlerAuthenticate = 'handler.authenticate'  // 认证

export const HandlerLogin = 'handler.login'  // 登录

export const HandlerText = 'handler.text'  // 文本检查

export const HandlerPayMethods = 'handler.pay.methods'  // 支付方式

export const HookPayed = 'handler.payed'  // 支付方式

/**
 * 内部错误(内部推送用)
 */
export const ErrHooks = {
    initialize: "SYS.error.init",
    plugin: "SYS,error.plugin",
    login: "SYS.error.login",
    pay: "SYS.error.pay"
}


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
 * 调用方法未找到
 */
export const ErrCodeHandlerNotFound = 15

/**
 * http返回状态码错误
 */
export const ErrHttpStatus = 100

/**
 * http返回载荷错误
 */
export const ErrHttpRespPayload = 101


