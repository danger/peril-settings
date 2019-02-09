import { danger, markdown } from "danger"
import { Issues } from "github-webhook-event-types"

export default async (issueWebhook: Issues) => {
  const issue = issueWebhook.issue
  const username = issue.user.login
  const api = danger.github.api

  const org = "danger"
  const inviteMarkdown = `
  Thanks for the PR @${username}.

  The Danger org conform to the [Moya Community Continuity Guidelines][moya_cc], which means
  that we want to offer any contributor the ability to control their destiny.
  
  So, we've sent you an org invite - thanks ${username} :tada:
  
  [moya_cc]: https://github.com/Moya/contributors#readme
  `
  if (issue.user.type === "Bot") return

  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    markdown(inviteMarkdown)
    await api.orgs.addOrUpdateMembership({ org, username, role: "member" })
  }
}
