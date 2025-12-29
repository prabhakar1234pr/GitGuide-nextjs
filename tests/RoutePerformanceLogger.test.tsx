import React from "react";
import { render } from "@testing-library/react";

import { RoutePerformanceLogger } from "../app/components/performance/RoutePerformanceLogger";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const usePathnameMock = jest.requireMock("next/navigation").usePathname as jest.Mock;

describe("RoutePerformanceLogger", () => {
  beforeEach(() => {
    // clean any global state from prior tests
    delete (window as unknown as { __gitguidePerf?: unknown }).__gitguidePerf;
    usePathnameMock.mockReset();
  });

  it("logs route-change timing after pushState + pathname change", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    usePathnameMock.mockReturnValue("/a");
    const { rerender } = render(<RoutePerformanceLogger />);

    // trigger navigation start (patched pushState emits custom event)
    history.pushState({}, "", "/b");

    // now "navigate" by changing hook return and rerendering
    usePathnameMock.mockReturnValue("/b");
    rerender(<RoutePerformanceLogger />);

    // should log route change once
    const calls = infoSpy.mock.calls
      .filter((c) => c[0] === "[perf] route-change")
      .map((c) => c[1]);

    expect(calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ from: "/a", to: "/b", startType: "pushState" });
    expect(typeof calls[0].ms).toBe("number");
    expect(calls[0].ms).toBeGreaterThanOrEqual(0);

    infoSpy.mockRestore();
  });
});


