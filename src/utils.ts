/*-------------------- 方法 --------------------*/

import log from "loglevel"
import base64url from "base64url"
import { Schema, Validator, ValidatorResult } from 'jsonschema'
import { Md5 } from "ts-md5"
import { sha1 } from "js-sha1"
import fastURI, { Options as URIOpts, URIComponent } from 'fast-uri'
import * as consts from "./constants"

const Pattern = /^\d+(\.\d+){0,2}$/


const BaseCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"


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
export function NoneHandlerResults(result: MiniGameTypes.Results): void {
    /**
     * empty
     */
}

/**
 * 空handler
 */
export function NoneHandlerResult(result: MiniGameTypes.Result): void {
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
export function NewResults(trigger: string, results?: MiniGameTypes.Result[]) {
    const resp: MiniGameTypes.Results = {
        failure: 0,
        trigger: trigger,
        success: [],
        errors: []
    }
    if (!results) {
        return resp
    }
    results.forEach(r => {
        if (r.code === consts.CodeSuccess) {
            resp.success.push(r)
        } else {
            resp.failure += 1
            resp.errors.push(r)
        }
    })

    return resp
}

/**
 * url query解析方法,调用URLSearchParams,会对url解码
 * @param query
 */
export function ParseQuery(query?: string): Record<string, string> {
    if (!query) return {}
    const parameters = new URLSearchParams(query)
    const m: Record<string, string> = {}
    parameters.forEach((v, k) => {
        m[k] = v
    })
    return m
}

/**
 * url query 生成方法, 调用URLSearchParams,会对url编码
 * @param data
 * @constructor
 */
export function BuildQuery(data?: Record<string, string>): string {
    if (!data) return ""
    const parameters = new URLSearchParams()
    Object.keys(data).forEach(k => {
        parameters.set(k, data[k])
    })
    parameters.sort()
    return parameters.toString()
}

/**
 * 类似ParseQuery, 但是不对参数做url编码
 * @param params url params
 * @param blank 是否忽略空白字段
 */
export function ParamsMerge(params: Record<string, string>, blank: boolean): string {
    let s = ""
    Object.keys(params).sort().forEach(key => {
        if (blank || params[key] !== "") {
            s += key + "=" + params[key] + "&"
        }
    })
    if (s.endsWith("&")) {
        return s.slice(0, -1)
    }
    return s
}

/** 类似ParamsMerge,不填充 "=" 进行拼接
 * url 参数合并(key+value模式)
 * @param params url params
 * @param blank 是否忽略空白字段
 */
export function ParamsCompress(params: Record<string, string>, blank: boolean): string {
    let s = ""
    Object.keys(params).sort().forEach(key => {
        if (blank || params[key] !== "") {
            s += params[key]
        }
    })
    return s
}

/**
 * 生成md5摘要
 */
export function Md5Sum(s: string): string {
    return Md5.hashStr(s)
}

/**
 * 生成sha1摘要
 */
export function Sha1Sum(s: string): string {
    return sha1(s)
}

/**
 * 生成sha1 hmac摘要
 */
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
    const date = new Date()
    return `${format(date.getFullYear(), 4)}-${format(date.getMonth() + 1, 2)}-${format(date.getDate(), 2)} ${format(date.getHours(), 2)}:${format(date.getMinutes(), 2)}:${format(date.getSeconds(), 2)}`
}

/**
 * url解析
 * @param url
 */
export function ParseURL(url: string) {
    const match = url.match(/^(https?:)\/\/(([^:/?#]*)(?::([0-9]+))?)(\/?[^?#]*)(\?[^#]*|)(#.*|)$/)
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
 * 列表中随机元素获取
 * @param list
 */
export function RandomElement<T>(list: T[]): T | undefined {
    if (list.length === 0) {
        return undefined // 如果列表为空，返回 undefined
    }
    const randomIndex = Math.floor(Math.random() * list.length)
    return list[randomIndex]
}


/**
 * 生成只包含62个标准字符的随机字符串
 * @param length
 */
export function RandomBaseString(length: number): string {
    let result = ""
    const charactersLength = BaseCharacters.length
    for (let i = 0; i < length; i += 1) {
        result += BaseCharacters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}


/**
 * 校验json
 * @param schema
 * @param payload
 * @param required  允许空
 */
export function ValidateJson(schema: Schema, payload: Record<string, any> | undefined,
                             required?: boolean): ValidatorResult {
    const v = new Validator();
    return v.validate(payload, schema, {required: required ?? true})
}


/**
 * 替换为 sandbox url
 * @param url
 * @param sandbox
 */
function SandboxUrl(url: string, sandbox: boolean): string {
    const obj = ParseURL(url)
    const link = sandbox ? `${obj.protocol}//sandbox.${obj.host}${obj.pathname}` :
        `${obj.protocol}//${obj.host}${obj.pathname}`
    return link.endsWith("/") ? link.slice(0, -1) : link
}

/**
 * 标准版本解析
 * @param version
 */
export function LoadVersion(version: string): MiniGameTypes.VersionInfo | null {

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
 * @return  -1 小于 0 等于 1 大于
 */
export function CmpVer(v1: MiniGameTypes.VersionInfo, v2: MiniGameTypes.VersionInfo): -1 | 0 | 1 {

    if (v1.major > v2.major) {
        return 1
    }
    if (v1.major < v2.major) {
        return -1
    }
    // If major versions are equal, compare minor versions
    if (v1.minor > v2.minor) {
        return 1
    }
    if (v1.minor < v2.minor) {
        return -1
    }

    // If minor versions are equal, compare patch versions
    if (v1.patch > v2.patch) {
        return 1
    }
    if (v1.patch < v2.patch) {
        return -1
    }
    // If all versions are equal, return 0
    return 0

}


/**
 * 尝试从result中提取出文本
 * @param result
 * @param prefix
 */
export function ResultMessage(result: MiniGameTypes.Result, prefix?: string): string {
    prefix = prefix ?? result.code === consts.CodeSuccess ? "result success" : "result failed"
    let payload = ""
    if (typeof result.payload === "string") {
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
    })
}

/**
 * 自动重试异步方法
 * @param trigger     调用触发器
 * @param callback    回调函数
 * @param options     重试参数(默认重试3次、间隔3s)
 * @constructor
 */
export function CallbackWithRetry(trigger: string, callback: () => Promise<MiniGameTypes.Result>,
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
                                  }): Promise<MiniGameTypes.Result> {
    const opt = options ?? {times: 3, delay: 3000}
    const retryTimes = opt.times > 0 ? opt.times : 1

    return new Promise((resolve, reject) => {
        const retry = (attempt: number) => {
            callback().then(resolve).catch((e) => {
                if (attempt > retryTimes) {
                    reject(e)
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
                    Delay(delay).then(_ => retry(attempt + 1))
                }

            })
        }

        retry(0)
    })
}


/**
 * uri解析
 * @param uri
 * @param options
 */
export function ParseURI(uri: string, options?: URIOpts): URIComponent {
    return fastURI.parse(uri, options)
}


/* ----------- base64 url api ------------*/

/**
 * bas64 url 字符转 base64
 */
export function Base64URLFromBase64(text: string): string {
    return base64url.fromBase64(text)
}


/**
 * base64 字符转 base64 url
 */
export function Base64ToBase64URL(payload: string | Buffer): string {
    return base64url.toBase64(payload)
}


/**
 * 编码 base64 url
 */
export function Base64URLEncode(payload: string | Buffer, encoding?: string): string {
    return base64url.encode(payload, encoding)
}


/**
 * base64 url 解码
 */
export function Base64URLDecode(text: string, encoding?: string): string {
    return base64url.decode(text, encoding)
}

/* ----------- base64 url api ------------*/