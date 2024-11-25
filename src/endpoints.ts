import { LoadVersion, RandomElement, CmpVer } from './utils';

class Endpoints implements MiniGameTypes.Endpoints {
    private endpoints: MiniGameTypes.Endpoint[];

    private length: number;

    constructor(endpoints: MiniGameTypes.Endpoint[]) {
        if (!endpoints || !endpoints.length) {
            throw new Error('No endpoint specified');
        }
        this.endpoints = endpoints;
        this.length = endpoints.length;
    }

    get url(): string {
        return this.anyone.url;
    }

    get anyone(): MiniGameTypes.Endpoint {
        const randomIndex = Math.floor(Math.random() * this.length);
        return this.endpoints[randomIndex];
    }

    Filter(version: string): MiniGameTypes.Endpoint | undefined {
        const ver = LoadVersion(version);
        if (!ver) return undefined;
        const endpoints = this.endpoints.filter((endpoint: MiniGameTypes.Endpoint): boolean => {
            const ret = CmpVer(ver, endpoint.id);
            if (ret === 0) return true;
            if (ret === 1 && endpoint.max) {
                const v = CmpVer(ver, endpoint.id);
                return v === 0 || v === -1;
            }
            if (ret === -1 && endpoint.min) {
                const v = CmpVer(ver, endpoint.id);
                return v === 0 || v === 1;
            }
            return false;
        });
        return RandomElement(endpoints);
    }

    Reset(endpoints: MiniGameTypes.Endpoint[]): void {
        if (!endpoints.length) {
            return;
        }
        this.endpoints = endpoints;
        this.length = endpoints.length;
    }
}

/**
 * 服务端点转化为Endpoints对象
 */
export function LoadEndpoints(app: MiniGameTypes.Application, service: string): MiniGameTypes.Endpoints | null {
    const endpoints: MiniGameTypes.Endpoint[] = app.services[service];
    if (!endpoints || !endpoints.length) return null;
    return new Endpoints(endpoints);
}
