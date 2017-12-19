import { schedule, danger, markdown } from "danger"

declare const peril: any // danger/danger#351
const isJest = typeof jest !== "undefined"

// Stores the parameter in a closure that can be invoked in tests.
const storeRFC = (reason: string, closure: () => void | Promise<any>) =>
  // We return a closure here so that the (promise is resolved|closure is invoked)
  // during test time and not when we call rfc().
  () => (closure instanceof Promise ? closure : Promise.resolve(closure()))

// Either schedules the promise for execution via Danger, or invokes closure.
const runRFC = (reason: string, closure: () => void | Promise<any>) =>
  closure instanceof Promise ? schedule(closure) : closure()

const rfc: any = isJest ? storeRFC : runRFC

export const aeryn = rfc("When a PR is merged, check if the author is in the org", async () => {

  const pr = danger.github.pr
  const username = pr.user.login
  const api = danger.github.api

  const org = "danger"
  const inviteMarkdown = `
Thanks for the PR @${username}.

We conform to the [Moya Community Continuity Guidelines][moya_cc], which means
that we want to offer any contributor the ability to control their destiny.

So, we've sent you an org invite - thanks :tada:

[moya_cc]: https://github.com/Moya/contributors#readme
`

  try {
    await api.orgs.checkMembership({ org, username })
  } catch (error) {
    // Ideally we'd write `markdown` but it looks like the scheduler isn't working as expected here?
    await api.issues.createComment({ ...danger.github.thisPR, body: inviteMarkdown })
    await api.orgs.addOrgMembership({ org, username, role: "member" })
  }
})
