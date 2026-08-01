// jwt unit test
// no db, no server

import { signToken, verifyToken, tokenFrom } from "../src/shared/jwt.js";

process.env.JWT_SECRET = "unit_test_secret";

describe("jwt helper", () => {
  test("round trips a payload", () => {
    const t = signToken({ sub: "u1", username: "vicky", role: "ADMIN" });
    const claims = verifyToken(t);
    expect(claims.sub).toBe("u1");
    expect(claims.username).toBe("vicky");
    expect(claims.role).toBe("ADMIN");
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  test("three parts", () => {
    expect(signToken({ sub: "x" }).split(".")).toHaveLength(3);
  });

  test("rejects a tampered body", () => {
    const t = signToken({ sub: "u1", role: "CREATOR" });
    const [h, , s] = t.split(".");
    const fake = Buffer.from(JSON.stringify({ sub: "u1", role: "ADMIN", exp: 9e9 })).toString("base64url");
    expect(verifyToken(`${h}.${fake}.${s}`)).toBeNull();
  });

  test("rejects junk", () => {
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("not.a.token")).toBeNull();
    expect(verifyToken(null)).toBeNull();
    expect(verifyToken("only.two")).toBeNull();
  });

  test("rejects an expired token", () => {
    expect(verifyToken(signToken({ sub: "u1" }, -10))).toBeNull();
  });

  test("reads the header", () => {
    expect(tokenFrom({ headers: { authorization: "Bearer abc.def.ghi" } })).toBe("abc.def.ghi");
    expect(tokenFrom({ headers: { "x-access-token": "zzz" } })).toBe("zzz");
    expect(tokenFrom({ headers: {} })).toBeNull();
  });
});
