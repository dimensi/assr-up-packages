import axios from "axios";

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
    return api.get(
      `/projects/${config.gitlabProject}/merge_requests/${mr}/approval_rules`
    );
  }

  async function createMr(branchName, packages) {
    const cleanName = branchName.replace("feature/", "");
    const me = await getMe();
    const result = await api.post(
      `/projects/${config.gitlabProject}/merge_requests`,
      {
        source_branch: branchName,
        target_branch: config.targetBranch,
        title: `feat(${cleanName}): up ${Object.keys(packages).join(", ")}`,
        assignee_id: me.id,
        description: `Closes ${cleanName}.`,
      }
    );

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
    getMe,
    createMr,
  };
}
