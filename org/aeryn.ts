import { schedule, danger, markdown } from "danger"

const isJest = typeof jest !== "undefined"

// Stores the parameter in a closure that can be invoked in tests.
const storeRFC = (reason: string, closure: () => void | Promise<any>) =>
  // We return a closure here so that the (promise is resolved|closure is invoked)
  // during test time and not when we call rfc().
  () => (closure instanceof Promise ? closure : Promise.resolve(closure()))

// Either schedules the promise for execution via Danger, or invokes closure.
const runRFC = (reason: string, closure: () => void | Promise<any>) => schedule(closure)

const rfc: any = isJest ? storeRFC : runRFC

rfc("When a PR is merged, check if the author is in the org", async () => {
  const pr = danger.github.pr
  const username = pr.user.login
  const api = danger.github.api

  const org = "danger"
  const inviteMarkdown = `
  Thanks for the PR @${username}.

  The Danger org conform to the [Moya Community Continuity Guidelines][moya_cc], which means
  that we want to offer any contributor the ability to control their destiny.
  
  So, we've sent you an org invite - thanks :tada:
  
  [moya_cc]: https://github.com/Moya/contributors#readme
  `
  // danger/danger-js#521
  if ((pr.user.type as string) === "Bot") return

  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    markdown(inviteMarkdown)
    await api.orgs.addOrgMembership({ org, username, role: "member" })
  }
})
