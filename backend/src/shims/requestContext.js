import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();

export function requestContextMiddleware(req, res, next) {
  requestContext.run({ req, res }, next);
}

export function getRequestContext() {
  return requestContext.getStore();
}
