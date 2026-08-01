// search unit tests
// no engine needed, just the pure bits

import { PROJECT_INDEX, MESSAGE_INDEX, ping } from "../src/es.js";

describe("index names", () => {
  test("have defaults", () => {
    expect(PROJECT_INDEX).toBe("ps-projects");
    expect(MESSAGE_INDEX).toBe("ps-messages");
  });
});

describe("ping", () => {
  test("says down instead of throwing when nothing answers", async () => {
    process.env.ES_URL = "http://127.0.0.1:9";
    const mod = await import("../src/es.js?fresh=1");
    const out = await mod.ping();
    expect(out.up).toBe(false);
    expect(typeof out.error).toBe("string");
  });

  test("current setup answers with a shape i can read", async () => {
    const out = await ping();
    expect(out).toHaveProperty("up");
    expect(typeof out.up).toBe("boolean");
  });
});
