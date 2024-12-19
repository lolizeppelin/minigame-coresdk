/*-------------------- 常量 --------------------*/

export const TimerTokenRefresh = "sys.token.refresh"

export const AppInitialize = "app.initialize"

export const HandlerAuthenticate = "handler.authenticate" // 认证

export const HandlerLogin = "handler.login" // 登录

/**
 * 文本检查 对应方法参数结构  {content: string; options: Record<string, any>; user: MiniGameTypes.user}
 */
export const HandlerText = "handler.text"

/**
 * 图片检查 对应方法参数结构  {uri: URIComponent; options: Record<string, any>; user: MiniGameTypes.user}
 */
export const HandlerMedia = "handler.image"

/**
 * 媒体(视频、音频等)检查 对应方法参数结构  {uri: URIComponent; options: Record<string, any>; user: MiniGameTypes.user}
 */
export const HandlerImage = "handler.media"

/**
 * 登录确认弹窗
 */
export const HandlerLoginConfirmDialog = "handler.login.confirm.dialog"

export const HandlerPayMethods = "handler.pay.methods" // 支付方式

export const HookPayed = "handler.payed" // 支付方式

/**
 * 常用图像文件后缀
 */
export const ImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff", ".tif"]

/**
 * 常用音频文件后缀
 */
export const AudioExtensions = [".mp3", ".wav", ".acc", ".flac", ".ogg", ".wma", ".alac", ".aiff", ".opus"]

/**
 * 常用视频文件后缀
 */
export const VideoExtensions = [".mp4", ".mov", ".avi", ".flv", ".wmv", ".mpeg", ".mpg", ".vob", ".mkv", ".rmvb"]
/**
 * 媒体文件后缀
 */
export const MediaExtensions = []

/**
 * 内部错误(内部推送用)
 */
export const ErrHooks = {
    initialize: "SYS.error.init",
    plugin: "SYS,error.plugin",
    login: "SYS.error.login",
    pay: "SYS.error.pay",
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
 * 鉴权错误
 */
export const ErrCodePolicy = 4

/**
 * 数据错误
 */
export const ErrCodeData = 5

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
