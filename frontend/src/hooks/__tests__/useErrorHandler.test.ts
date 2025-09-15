import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useErrorHandler } from "../useErrorHandler";

describe("useErrorHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("initializes with default error state", () => {
        const { result } = renderHook(() => useErrorHandler());

        expect(result.current.error).toEqual({
            type: "unknown",
            message: "",
            visible: false,
        });
    });

    it("shows error with correct type and message", () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError("validation", "Test error message");
        });

        expect(result.current.error).toEqual({
            type: "validation",
            message: "Test error message",
            visible: true,
        });
    });

    it("hides error when hideError is called", () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError("validation", "Test error message");
        });

        expect(result.current.error.visible).toBe(true);

        act(() => {
            result.current.hideError();
        });

        expect(result.current.error.visible).toBe(false);
    });

    it("auto-hides error after 5 seconds", () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError("network", "Network error");
        });

        expect(result.current.error.visible).toBe(true);

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(result.current.error.visible).toBe(false);
    });

    it("handles different error types", () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError("server", "Server error");
        });

        expect(result.current.error.type).toBe("server");

        act(() => {
            result.current.showError("network", "Network error");
        });

        expect(result.current.error.type).toBe("network");
    });

    it("overwrites previous error", () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.showError("validation", "First error");
        });

        expect(result.current.error.message).toBe("First error");

        act(() => {
            result.current.showError("server", "Second error");
        });

        expect(result.current.error.message).toBe("Second error");
        expect(result.current.error.type).toBe("server");
    });
});
