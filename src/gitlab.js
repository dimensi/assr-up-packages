import axios from "axios";

const LIMIT_TITLE = 255;

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

export function createGitlabApi(config) {
  const api = axios.create({
    baseURL: config.gitlabBaseURL,
    headers: {
      authorization: `Bearer ${config.gitlabToken}`,
    },
  });

  api.interceptors.response.use((response) => response.data);

  function getMe() {
    return api.get("/user");
  }

  function getApprovalRules(mr) {
    return api.get(`/projects/${config.gitlabProject}/merge_requests/${mr}/approval_rules`);
  }

  async function createMr(branchName, packages) {
    const cleanName = branchName.replace("feature/", "");
    const me = await getMe();

    const result = await api.post(`/projects/${config.gitlabProject}/merge_requests`, {
      source_branch: branchName,
      target_branch: config.targetBranch,
      title: createTitle(cleanName, packages),
      assignee_id: me.id,
      description: `Closes ${cleanName}.`,
    });

    await api.post(
      `/projects/${config.gitlabProject}/merge_requests/${result.iid}/approval_rules`,
      {
        name: "QA",
        approvals_required: 1,
        user_ids: [config.testerId],
      }
    );

    const rules = await getApprovalRules(result.iid);

    const anyRule = rules.find((rule) => rule.rule_type === "any_approver");

    if (anyRule) {
      await api.post(
        `/projects/${config.gitlabProject}/merge_requests/${result.iid}/approval_rules/${anyRule.id}`,
        {
          approvals_required: 0,
        }
      );
    }

    return `http://gitlab.k8s.alfa.link/alfabank/nodejs/assr/-/merge_requests/${result.iid}`;
  }

  return {
    createMr,
  };
}
