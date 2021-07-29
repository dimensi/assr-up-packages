import simpleGit from "simple-git/promise.js";

export function createGit(config) {
  const git = simpleGit(config.assrDir);

  async function fetchMaster() {
    await git.checkout("master");
    await git.fetch("origin", "master");
    await git.pull();
  }

  async function checkoutBranch(branchName) {
    const fullBranchName = `feature/${branchName}`;
    const branch = await git.branch();
    if (branch.current !== "master") {
      await git.fetch("origin", "master:master");
    } else {
      await git.pull();
    }
    if ((await git.branchLocal()).all.includes(fullBranchName)) {
      await git.checkout([fullBranchName]);
    } else {
      await git.raw(["checkout", "-b", fullBranchName, "--no-track", "origin/master"]);
    }
    return (await git.branch()).current;
  }

  async function commitPackages(jira, packages) {
    await git.commit(
      `feat(${jira}): up ${Object.keys(packages)
        .map((str) => str.replace("@alfabank/", ""))
        .join(", ")}`,
      "."
    );
  }

  async function pushBranch() {
    let pushResult;
    try {
      pushResult = await git.push();
    } catch (err) {
      if (err.message.includes("no upstream branch")) {
        const branch = (await git.branch()).current;
        pushResult = await git.push(["--set-upstream", "origin", branch]);
      }
    }

    if (
      pushResult.remoteMessages.all
        .map((str) => str.toLocaleLowerCase())
        .includes("view merge request")
    ) {
      return pushResult.remoteMessages.pullRequestUrl;
    }

    return null;
  }

  return {
    git,
    fetchMaster,
    checkoutBranch,
    commitPackages,
    pushBranch,
  };
}
