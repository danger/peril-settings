import { danger, markdown } from "danger"

export default async () => {
  const pr = danger.github.pr
  const username = pr.user.login
  const api = danger.github.api

  const org = "danger"
  const inviteMarkdown = `
  Thanks for the PR @${username}.

  The Danger org conform to the [Moya Community Continuity Guidelines][moya_cc], which means
  that we want to offer any contributor the ability to control their destiny.
  
  So, we've sent you an org invite - thanks ${username} :tada:
  
  [moya_cc]: https://github.com/Moya/contributors#readme
  `
  if ((pr.user.type as string) === "Bot") return

  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    markdown(inviteMarkdown)
    await api.orgs.addOrUpdateMembership({ org, username, role: "member" })
  }
}
