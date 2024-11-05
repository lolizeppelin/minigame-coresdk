import log, { Logger } from "loglevel";

log.setLevel("error", false)


export * from './constants'
export * from './utils'
export * from './core'
export * from './tracker'
export * from './queue'


/**
 * 公共日志接口模块
 */
export function getLogger(): Logger {
    return log
}