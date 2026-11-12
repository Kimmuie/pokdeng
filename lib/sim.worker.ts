import { simulate, type SimParams } from "./pokdeng";

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<SimParams>) => void) | null;
  postMessage: (m: unknown) => void;
};

ctx.onmessage = (e) => {
  ctx.postMessage(simulate(e.data));
};
