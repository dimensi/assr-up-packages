import path from "path";
import fs from "fs";
import { createGit } from "./git.js";
import {
  asyncSpawn,
  updatePackages,
  getDiffPackages,
  getLastVersions,
} from "./helpers.js";
import { createGitlabApi } from "./gitlab.js";
import { loadConfig } from "./config.js";

const { config, tasks } = loadConfig();

console.log(config)
const { checkoutBranch, commitPackages, fetchMaster, pushBranch } = createGit(
  config.assrDir
);

const { createMr } = createGitlabApi(config);

console.log("fetch master and update packages to last");
await fetchMaster();
await asyncSpawn("yarn", null, { cwd: config.assrDir });
console.log("done install packages");

for (let [jira, packages] of Object.entries(tasks)) {
  const branch = await checkoutBranch(jira);
  console.log("checkout on new branch: %s", branch);
  console.log("start fetching last versions");
  const packagesWithVersions = await getLastVersions(packages, config.assrDir);
  const { dependencies: installedPackages } = JSON.parse(
    fs.readFileSync(path.join(config.assrDir, "package.json"))
  );
  const diff = getDiffPackages(packagesWithVersions, installedPackages);
  console.log("get packages on update", diff);
  if (Object.keys(diff).length === 0) {
    console.log("nothing to update");
    continue;
  }
  console.log("start update packages");
  await updatePackages(diff);
  console.log("done update. commit changes");
  await commitPackages(diff);
  console.log("done commit");
  const pushResult = await pushBranch();
  console.log("done push");
  if (
    pushResult.remoteMessages.all
      .map((str) => str.toLocaleLowerCase())
      .includes("view merge request")
  ) {
    console.log(
      "mr already created, look here: %s",
      pushResult.remoteMessages.pullRequestUrl
    );
  }
  console.log("start create mr");
  const mrLink = await createMr(branch, diff);
  console.log("done with create mr: %s", mrLink);
}
