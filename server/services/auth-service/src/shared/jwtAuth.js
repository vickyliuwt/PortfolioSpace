// shared/jwtAuth.js
// bearer auth

import { verifyToken, tokenFrom } from "./jwt.js";

export function jwtFallback() {
  return (req, res, next) => {
    if (req.session?.currentUser) return next();

    const claims = verifyToken(tokenFrom(req));
    if (!claims || !claims.sub) return next();

    const user = {
      _id: claims.sub,
      username: claims.username || "",
      displayName: claims.displayName || claims.username || "",
      role: claims.role || "CREATOR",
      plan: claims.plan || "FREE",
      avatarUrl: claims.avatarUrl || "",
    };

    // no write
    if (req.session) {
      Object.defineProperty(req.session, "currentUser", { value: user, enumerable: false, configurable: true, writable: true });
    } else {
      req.session = { currentUser: user };
    }
    req.tokenUser = user;
    next();
  };
}
