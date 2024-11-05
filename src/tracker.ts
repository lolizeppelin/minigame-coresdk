import * as consts from './constants'

/**
 * 空Tracker
 */
export class BaseTracker implements MiniGameTypes.Tracker {

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
        }, callback: MiniGameTypes.HandlerResult) => void> = {}

    /**
     * 用户事件
     * @protected
     */
    protected _user_event_handlers: Record<string,
        (payload: {
            event: string;
            user: MiniGameTypes.User;
            params: Record<string, any>;
        }, callback: MiniGameTypes.HandlerResult) => void> = {}

    /**
     * 角色事件
     * @protected
     */
    protected _role_event_handlers: Record<string, (payload: {
        event: string;
        user: MiniGameTypes.User;
        role: MiniGameTypes.GameRole;
        params: Record<string, any> | null;
    }, callback: MiniGameTypes.HandlerResult) => void> = {}

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
            }, callback: MiniGameTypes.HandlerResult) => void
        };
        user?: {
            event: string;
            handler: (payload: {
                event: string;
                user: MiniGameTypes.User;
                params: Record<string, any>;
            }, callback: MiniGameTypes.HandlerResult) => void;
        };
        role?: {
            event: string;
            handler: (payload: {
                event: string;
                user: MiniGameTypes.User;
                role: MiniGameTypes.GameRole;
                params: Record<string, any> | null;
            }, callback: MiniGameTypes.HandlerResult) => void;
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

    Retry(payload: { user?: MiniGameTypes.User, role?: MiniGameTypes.GameRole }): void {
        // do retry
    }


    PushEvent(payload: {
        event: string;
        params: Record<string, any>,
    }, callback: MiniGameTypes.HandlerResult): void {
        const handler = this._event_handlers[payload.event]
        if (!handler) {
            callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)

    }


    UserCreate(payload: { user: MiniGameTypes.User }, callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    UserLogin(payload: { user: MiniGameTypes.User }, callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    UserLogout(payload: { user: MiniGameTypes.User, role: MiniGameTypes.GameRole | null },
               callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    UserRecharged(payload: {
                      id: string; user: MiniGameTypes.User;
                      params: Record<string, any>; payment: MiniGameTypes.Payment
                  },
                  callback: MiniGameTypes.HandlerResult) {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }

    UserEvent(payload: { event: string, user: MiniGameTypes.User, params: Record<string, any> },
              callback: MiniGameTypes.HandlerResult): void {
        const handler = this._user_event_handlers[payload.event]
        if (!handler) {
            callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)
    }


    RoleLogin(payload: { user: MiniGameTypes.User, role: MiniGameTypes.GameRole },
              callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    RoleCreate(payload: { user: MiniGameTypes.User, role: MiniGameTypes.GameRole },
               callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    RoleUpLevel(payload: { user: MiniGameTypes.User, role: MiniGameTypes.GameRole, level: number },
                callback: MiniGameTypes.HandlerResult): void {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    RoleRecharged(payload: {
                      id: string; user: MiniGameTypes.User; params: Record<string, any>;
                      order: MiniGameTypes.GameOrder; payment: MiniGameTypes.Payment
                  },
                  callback: MiniGameTypes.HandlerResult) {
        callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
    }


    RoleEvent(payload: {
                  event: string, user: MiniGameTypes.User, role: MiniGameTypes.GameRole,
                  params: Record<string, any> | null
              },
              callback: MiniGameTypes.HandlerResult): void {
        const handler = this._role_event_handlers[payload.event]
        if (!handler) {
            callback({code: consts.CodeSuccess, trigger: this.name, payload: null})
            return
        }
        handler.call(this, payload, callback)
    }

}
