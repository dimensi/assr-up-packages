import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import yaml from "js-yaml";
import { getDirname } from "./helpers.js";

dotenv.config();

function travel(data, cb) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) return [key, travel(value, cb)];
      return cb(key, value);
    })
  );
}

function fillWithEnvs(data) {
  return travel(data, (key, value) =>
    typeof value === "string"
      ? [key, value.replace(/\${([^}]+)}/gm, (str, $0) => process.env[$0])]
      : [key, value]
  );
}

function addFullPathToRelative(data) {
  return travel(data, (key, value) => {
    if (key === "assrDir") return [key, path.join(process.cwd(), value)];
    return [key, value];
  });
}

export function loadConfig() {
  const data = yaml.load(fs.readFileSync(path.join(getDirname(), "../config.yaml"), "utf-8"));
  return addFullPathToRelative(fillWithEnvs(data));
}
