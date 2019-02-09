import { danger, markdown } from "danger"
import { PullRequest } from "github-webhook-event-types"

export default async (webhook: PullRequest) => {
  const user = webhook.sender
  if (user.type === "Bot") return

  const username = user.login
  const api = danger.github.api
  const org = webhook.repository.owner.login

  const inviteMarkdown = `
  Thanks for the PR @${username}.

  The Danger org conform to the [Moya Community Continuity Guidelines][moya_cc], which means
  that we want to offer any contributor the ability to control their destiny.
  
  So, we've sent you an org invite - thanks ${username} :tada:
  
  [moya_cc]: https://github.com/Moya/contributors#readme
  `

  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    markdown(inviteMarkdown)
    await api.orgs.addOrUpdateMembership({ org, username, role: "member" })
  }
}
