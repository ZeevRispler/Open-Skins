import type { IncomingMessage, ServerResponse } from "node:http";
export function bridgeMiddleware(
  env?: Record<string, string | undefined>,
): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
