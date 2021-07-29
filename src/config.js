import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import yaml from "js-yaml";
import { getDirname } from "./helpers.js";

dotenv.config();

function fillWithEnvs(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) return [key, fillWithEnvs(value)];
      if (typeof value === "string")
        return [
          key,
          value.replace(/\${([^}]+)}/gm, (str, $0) => process.env[$0]),
        ];
      return [key, value];
    })
  );
}
export function loadConfig() {
  const data = yaml.load(
    fs.readFileSync(path.join(getDirname(), "../config.yaml"), "utf-8")
  );
  return fillWithEnvs(data);
}
