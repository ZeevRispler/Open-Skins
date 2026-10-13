// Deterministic local inference fixture. No network calls or provider credentials.
import { createServer } from "node:http";
const server = createServer(async (req, res) => {
  if (req.url === "/v1/models") {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ data: [{ id: "test", object: "model" }] }));
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  let request;
  try {
    request = JSON.parse(body);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const messages = request.messages || [];
  const hasTool = messages.some((m) => m.role === "tool");
  const tool = (request.tools || []).find((t) => t.function?.name === "bash");
  const toolCall = tool && !hasTool;
  const content = toolCall ? "" : "OPENCODE_ADAPTER_OK";
  const call = {
    id: "call_local_test",
    type: "function",
    function: {
      name: "bash",
      arguments: JSON.stringify({
        command:
          'printf "OPENCODE_FILE_OK\\n" > opencode-demo.txt && cat opencode-demo.txt',
        description: "Create and inspect a local adapter test file",
      }),
    },
  };
  if (request.stream) {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    });
    const delta = toolCall
      ? { role: "assistant", tool_calls: [{ index: 0, ...call }] }
      : { role: "assistant", content };
    res.write(
      "data: " +
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion.chunk",
          created: 1,
          model: "test",
          choices: [{ index: 0, delta, finish_reason: null }],
        }) +
        "\n\n",
    );
    res.write(
      "data: " +
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion.chunk",
          created: 1,
          model: "test",
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: toolCall ? "tool_calls" : "stop",
            },
          ],
          usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
        }) +
        "\n\n",
    );
    return res.end("data: [DONE]\n\n");
  }
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 1,
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            ...(toolCall ? { tool_calls: [call] } : {}),
          },
          finish_reason: toolCall ? "tool_calls" : "stop",
        },
      ],
      usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
    }),
  );
});
server.listen(9997, "127.0.0.1", () => console.log("Local test model on 9997"));
