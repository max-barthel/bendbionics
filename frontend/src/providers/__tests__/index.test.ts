import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "../index";

describe("providers/index.ts", () => {
    it("exports AuthProvider", () => {
        expect(AuthProvider).toBeDefined();
        expect(typeof AuthProvider).toBe("function");
    });

    it("exports useAuth", () => {
        expect(useAuth).toBeDefined();
        expect(typeof useAuth).toBe("function");
    });
});
