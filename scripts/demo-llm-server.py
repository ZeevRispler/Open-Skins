"""Local scripted model for UI demonstrations. No external calls or credentials."""
import importlib.util
import json
from pathlib import Path
from http.server import ThreadingHTTPServer
import time
import uuid

source = Path(__file__).resolve().parents[1] / "tests/e2e/mock-llm/scripts/mock-llm-server.py"
spec = importlib.util.spec_from_file_location("skin_mock", source)
mock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mock)


class DemoHandler(mock.MockLLMHandler):
    def do_POST(self):
        if self.path.rstrip("/") not in ("/chat/completions", "/v1/chat/completions"):
            self._send_error(404, "not_found", "Demo supports chat completions only")
            return
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        messages = body.get("messages", [])
        last_user = max((i for i, m in enumerate(messages) if m.get("role") == "user"), default=-1)
        finished = any(m.get("role") == "tool" for m in messages[last_user + 1:])
        terminal = any(t.get("function", {}).get("name") == "terminal" for t in body.get("tools", []))
        message = {"role": "assistant", "content": "Local demo complete. I created demo.py and ran it in the real workspace. Open Files or Terminal to inspect it. This is a scripted test model."}
        finish = "stop"
        if terminal and not finished:
            user_text = str(messages[last_user].get("content", "")).lower() if last_user >= 0 else ""
            command = "printf 'print(\"Coding Skins demo: real terminal execution\")\\n' > demo.py; python3 demo.py"
            if "slow" in user_text:
                command = "sleep 15; " + command
            message = {"role": "assistant", "content": "Running the local scripted coding demo.", "tool_calls": [{"id": "call_" + uuid.uuid4().hex, "type": "function", "function": {"name": "terminal", "arguments": json.dumps({"command": command})}}]}
            finish = "tool_calls"
        elif not terminal:
            message["content"] = "pong" if mock._is_preflight_ping(body) else ""
        raw = {"id": "demo-" + uuid.uuid4().hex, "object": "chat.completion", "created": int(time.time()), "model": body.get("model", "local-demo"), "choices": [{"index": 0, "message": message, "finish_reason": finish}], "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20}}
        if body.get("stream"):
            self._send_streaming(raw, include_usage=True)
        else:
            self._send_json(200, raw)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 9998), DemoHandler).serve_forever()
