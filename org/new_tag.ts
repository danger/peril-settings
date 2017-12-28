import { schedule, danger, markdown } from "danger"
import {Create} from "github-webhook-event-types"

declare const peril: any // danger/danger#351
const isJest = typeof jest !== "undefined"

// Stores the parameter in a closure that can be invoked in tests.
const storeRFC = (reason: string, closure: () => void | Promise<any>) =>
  // We return a closure here so that the (promise is resolved|closure is invoked)
  // during test time and not when we call rfc().
  () => (closure instanceof Promise ? closure : Promise.resolve(closure()))

// Either schedules the promise for execution via Danger, or invokes closure.
const runRFC = (reason: string, closure: () => void | Promise<any>) => schedule(closure)

const rfc: any = isJest ? storeRFC : runRFC

export const newTag = rfc("Send a comment to PRs on new tags that they have been released", async () => {
  const api = danger.github.api
  const gh = danger.github as any as Create
  const tag = gh.ref

  await api.repos.compareCommits()


  const changelogURL = gh.repository.html_url + "/master/CHANGELOG.md"
  const inviteMarkdown = `
  Thanks for the PR @${username}.

  This PR has been shipped in v${gh.ref} - [CHANGELOG][].
  
  [CHANGELOG]: ${changelogURL}
  `


  // try {
  //   await api.orgs.checkMembership({ org, username })
  // } catch (error) {
  //   markdown(inviteMarkdown)
  //   await api.orgs.addOrgMembership({ org, username, role: "member" })
  // }
})
