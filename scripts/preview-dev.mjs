import { spawn } from "node:child_process";

const forwardedArgs = [];
const sourceArgs = process.argv.slice(2);

for (let index = 0; index < sourceArgs.length; index += 1) {
  const argument = sourceArgs[index];

  if (argument === "--host") {
    forwardedArgs.push("--hostname", sourceArgs[index + 1] ?? "0.0.0.0");
    index += 1;
    continue;
  }

  if (argument === "--strictPort") continue;
  forwardedArgs.push(argument);
}

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...forwardedArgs],
  { stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 0));
