import axios from "axios";

const LIMIT_TITLE = 120;

function createTitle(taskName, packages) {
  const title = `feat(${taskName}): up %s`;
  const titles = Object.keys(packages).map((str) => str.replace("@alfabank/", ""));
  const joinStr = ", ";
  const etcStr = " and etc";
  let sentence = "";
  for (const pkgName of titles) {
    if (
      sentence.length + pkgName.length + joinStr.length + etcStr.length >
      LIMIT_TITLE - title.length
    ) {
      sentence += etcStr;
      break;
    }
    if (sentence.length === 0) {
      sentence += pkgName;
    } else {
      sentence += joinStr + pkgName;
    }
  }
  return title.replace("%s", sentence);
}

function createDescription(taskName, packages) {
  return [
    `## Задача`,
    "Обновление пакетов",
    Object.keys(packages)
      .map((p) => `- ${p}`)
      .join("\n"),
    `Closes ${taskName}`,
  ].join("\n\n");
}

export function createGitlabApi({
  gitlabBaseURL,
  gitlabToken,
  targetBranch,
  gitlabProject,
  testerId,
}) {
  const api = axios.create({
    baseURL: gitlabBaseURL,
    headers: {
      authorization: `Bearer ${gitlabToken}`,
    },
  });

  api.interceptors.response.use((response) => response.data);

  function getMe() {
    return api.get("/user");
  }

  function getApprovalRules(mr) {
    return api.get(`/projects/${gitlabProject}/merge_requests/${mr}/approval_rules`);
  }

  function createApprovalRule({ mrId, name, users }) {
    return api.post(`/projects/${gitlabProject}/merge_requests/${mrId}/approval_rules`, {
      name: name,
      approvals_required: users.length,
      user_ids: users,
    });
  }

  function updateApprovalRule({ mrId, ruleId, users }) {
    return api.put(`/projects/${gitlabProject}/merge_requests/${mrId}/approval_rules/${ruleId}`, {
      approvals_required: users.length,
      ...(users.length && { user_ids: users }),
    });
  }

  async function findMrBranch(branchName) {
    const result = await api.get(`/projects/${gitlabProject}/merge_requests`, {
      params: {
        source_branch: branchName,
        target_branch: targetBranch,
      },
    });
    return result[0] ?? null;
  }

  async function createMr(branchName, packages) {
    const jiraTaskName = branchName.replace("feature/", "");
    const me = await getMe();
    let mr = await findMrBranch(branchName);

    if (!mr) {
      mr = await api.post(`/projects/${config.gitlabProject}/merge_requests`, {
        source_branch: branchName,
        target_branch: config.targetBranch,
        title: createTitle(jiraTaskName, packages),
        assignee_id: me.id,
        description: createDescription(jiraTaskName, packages),
        remove_source_branch: true,
        squash: true,
      });
    }

    const rules = await getApprovalRules(mr.iid);

    const anyRule = rules.find((rule) => rule.rule_type === "any_approver");

    if (anyRule) {
      await updateApprovalRule({ mrId: mr.iid, ruleId: anyRule.id, users: [] });
    }

    const qaRule = rules.find((rule) => rule.name === "QA");

    if (qaRule) {
      await updateApprovalRule({ mrId: mr.iid, ruleId: qaRule.id, users: [testerId] });
    } else {
      await createApprovalRule({ mrId: mr.iid, name: "QA", users: [testerId] });
    }

    return mr.web_url;
  }

  return {
    createMr,
  };
}
