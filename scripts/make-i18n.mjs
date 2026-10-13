import { readFileSync, writeFileSync } from "node:fs";
const map = JSON.parse(
  readFileSync(
    new URL("../src/i18n/translation.json", import.meta.url),
    "utf8",
  ),
);
writeFileSync(
  new URL("../src/i18n/declaration.ts", import.meta.url),
  "// Generated.\nexport enum I18nKey {\n" +
    Object.keys(map)
      .map((key) => `  ${key} = ${JSON.stringify(key)},`)
      .join("\n") +
    "\n}\n",
);
