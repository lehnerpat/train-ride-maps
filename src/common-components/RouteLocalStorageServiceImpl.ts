import { Route, Routes } from "../route-models";

class RouteLocalStorageServiceImpl {
  load(routeId: string): Route | null {
    return this.loadKey(this.makeKey(routeId));
  }

  private loadKey(key: string): Route | null {
    const loadedValue = localStorage.getItem(key);
    if (loadedValue === null) return null;
    return Routes.readFromJson(loadedValue);
  }

  save(value: Route) {
    localStorage.setItem(this.makeKey(value.uuid), Routes.serializeToJson(value));
  }

  getList(): Route[] {
    const routes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(storageKeyPrefix)) {
        const r = this.loadKey(key);
        if (r !== null) routes.push(r);
      }
    }
    return routes;
  }

  delete(routeId: string) {
    localStorage.removeItem(this.makeKey(routeId));
  }

  private makeKey(routeId: string): string {
    return storageKeyPrefix + routeId;
  }
}

const storageKeyPrefix = "trm_routes_";

export const RouteLocalStorageService = new RouteLocalStorageServiceImpl();
