import { describe, expect, it } from "vitest";
import { SOURDEX_CORE_VERSION } from "./index.js";

// Toolchain smoke test for the STAGE-01 baseline. Real domain tests arrive in STAGE-02.
describe("@sourdex/core", () => {
  it("exposes a version marker", () => {
    expect(SOURDEX_CORE_VERSION).toBe("0.0.0");
  });
});
