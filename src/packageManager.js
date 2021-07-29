import fs from "fs";
import path from "path";
import { asyncSpawn } from "./helpers.js";

export function createPackageManager(config) {
  function getInstalledPackages() {
    return JSON.parse(fs.readFileSync(path.join(config.assrDir, "package.json"), "utf-8"))
      .dependencies;
  }

  async function getLastVersions(packages) {
    return Object.fromEntries(
      await Promise.all(
        packages.map(async (pkg) => {
          const result = await asyncSpawn("npm", `v ${pkg} version`.split(" "), {
            cwd: config.assrDir,
            shell: true,
          });
          return [pkg, result.trim()];
        })
      )
    );
  }

  function getDiffPackages(packages, installedPackages) {
    return Object.fromEntries(
      Object.entries(packages).filter(([name, version]) => {
        const found = installedPackages[name];
        return !found || found !== version;
      })
    );
  }

  function updatePackages(packages) {
    return asyncSpawn(
      "yarn",
      `up ${Object.entries(packages)
        .map(([name, version]) => [name, version].join("@"))
        .join(" ")}`.split(" "),
      { cwd: config.assrDir }
    );
  }

  return {
    getLastVersions,
    getDiffPackages,
    updatePackages,
    getInstalledPackages,
  };
}
