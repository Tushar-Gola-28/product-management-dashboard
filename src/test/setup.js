import "@testing-library/jest-dom";
import "whatwg-fetch";
import { cleanup } from "@testing-library/react";
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = ResizeObserverMock;



afterEach(() => {
    cleanup();
});