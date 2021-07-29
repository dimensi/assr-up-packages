import { spawn } from "child_process";

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
    data += str;
  });

  process.stderr.on("data", (str) => {
    error += str;
  });

  process.on("error", (error) => {
    error += "\n" + error.message;
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

export async function getLastVersions(packages, cwd) {
  const versions = Object.fromEntries(
    await Promise.all(
      packages.map(async (pkg) => {
        const result = await asyncSpawn("npm", `v ${pkg} version`.split(" "), {
          cwd,
        });
        return [pkg, result.trim()];
      })
    )
  );
  return versions;
}

export function getDiffPackages(packages, installedPackages) {
  return Object.fromEntries(
    Object.entries(packages).filter(([name, version]) => {
      const finded = installedPackages[name];
      return !finded || finded !== version;
    })
  );
}

export function updatePackages(packages) {
  return asyncSpawn(
    "yarn",
    `up ${Object.entries(packages)
      .map(([name, version]) => [name, version].join("@"))
      .join(" ")}`.split(" "),
    { cwd: config.assrDir }
  );
}