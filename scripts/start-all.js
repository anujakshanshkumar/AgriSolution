const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mobile = path.join(root, "mobile");
const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3000";
const env = { ...process.env, HOST: host, PORT: port };

const children = [
  {
    name: "Portal",
    process: spawn(process.execPath, ["server.js"], {
      cwd: root,
      env,
      stdio: "inherit",
    }),
  },
  {
    name: "Expo",
    process: spawn(
      process.execPath,
      [path.join(mobile, "node_modules", "expo", "bin", "cli"), "start", "--lan"],
      { cwd: mobile, env, stdio: "inherit" },
    ),
  },
];

let stopping = false;
let exitCode = 0;
let remaining = children.length;

function stop(code) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  for (const child of children) {
    if (child.process.exitCode === null && child.process.signalCode === null) {
      child.process.kill();
    }
  }
}

for (const child of children) {
  child.process.on("error", (error) => {
    console.error(`${child.name} could not start: ${error.message}`);
    stop(1);
  });
  child.process.on("close", (code, signal) => {
    remaining -= 1;
    if (!stopping) {
      if (code !== 0) {
        console.error(
          `${child.name} stopped${signal ? ` (${signal})` : ` with exit code ${code}`}.`,
        );
      }
      stop(code || (signal ? 1 : 0));
    }
    if (remaining === 0) process.exitCode = exitCode;
  });
}

process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));

console.log(`Portal + mobile started. Portal listens on ${host}:${port}.`);
