import { createGit } from "./git.js";
import { asyncSpawn } from "./helpers.js";
import { createGitlabApi } from "./gitlab.js";
import { loadConfig } from "./config.js";
import { createPackageManager } from "./packageManager.js";

const { config, tasks } = loadConfig();

const { checkoutBranch, commitPackages, fetchTargetBranch, pushBranch } = createGit(config);
const { getDiffPackages, getLastVersions, updatePackages, getInstalledPackages } =
  createPackageManager(config);
const { createMr } = createGitlabApi(config);

console.log("fetch master and update packages to last");
await fetchTargetBranch();
await asyncSpawn("yarn", null, { cwd: config.assrDir });
console.log("done install packages");

for (let [jira, packages] of Object.entries(tasks)) {
  const branch = await checkoutBranch(jira);
  console.log("checkout on new branch: %s", branch);
  console.log("start fetching last versions");
  const packagesWithVersions = await getLastVersions(packages);
  const installedPackages = getInstalledPackages();
  const diff = getDiffPackages(packagesWithVersions, installedPackages);

  console.log("get packages on update", diff);
  if (Object.keys(diff).length > 0) {
    console.log("start update packages");
    await updatePackages(diff);
    console.log("done update. commit changes");
    await commitPackages(jira, diff);
    console.log("done commit");
    const pushResult = await pushBranch();
    console.log("done push");
    if (pushResult) {
      console.log("mr already created, look here: %s", pushResult);
      continue;
    }
  }

  console.log("start create mr");
  const mrLink = await createMr(branch, diff);
  console.log("done with create mr: %s", mrLink);
}
