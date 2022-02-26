import { Route, Routes } from "../route-models";

class RouteLocalStorageServiceImpl {
  constructor() {}

  load(uuid: string): Route | null {
    const loadedValue = localStorage.getItem(storageKeyPrefix + uuid);
    if (loadedValue === null) return null;
    return Routes.readFromJson(loadedValue);
  }

  save(value: Route) {
    localStorage.setItem(storageKeyPrefix + value.uuid, Routes.serializeToJson(value));
  }
}

const storageKeyPrefix = "trm_routes_";

export const RouteLocalStorageService = new RouteLocalStorageServiceImpl();
