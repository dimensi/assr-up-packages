import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

export function getDirname() {
  return dirname(fileURLToPath(import.meta.url));
}

export function asyncSpawn(bin, command, options) {
  let resolve,
    reject,
    data = "",
    error = "";
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const process = spawn(bin, command, options);

  process.stdout.on("data", (str) => {
    data = data + str;
  });

  process.stderr.on("data", (str) => {
    error = error + str;
  });

  process.on("error", (err) => {
    error = error + "\n" + err.message;
  });

  process.on("close", (code) => {
    if (code === 0) {
      resolve(data);
    } else {
      reject(error);
    }
  });
  return promise;
}
