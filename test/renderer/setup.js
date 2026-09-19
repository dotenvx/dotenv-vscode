/* global acquireVsCodeApi */
// The integration bundle imports the unmodified production editor and observes
// its actual DOM on animation frames. This bridge exists only in test output.
export const bridge = acquireVsCodeApi()
globalThis.acquireVsCodeApi = () => bridge
