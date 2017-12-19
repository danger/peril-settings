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
  const authorLogin = pr.user.login

  const org = "danger"
  const teamName = "Huuuumans"
  const inviteMarkdown = `
Thanks for the PR @${authorLogin}.

We conform to the [Moya Community Continuity Guidelines][moya_cc], which means
that we want to offer any contributor the ability to control their destiny.

So, we've sent you an org invite - thanks :tada:

[moya_cc]: https://github.com/Moya/contributors#readme
`

  const teamResponse = await danger.github.api.orgs.getTeams({ org })
  const orgTeams = teamResponse.data
  
  let teamID = ""
  if (orgTeams.length === 1) {
    teamID = orgTeams[0]
  } else{
    teamID = orgTeams.find((t:any) => t.name === teamName).id
  }

  try {
    await danger.github.api.orgs.getTeamMembership({ 
      id: teamID, 
      username: authorLogin 
    })  
  } catch (error) {
    console.log("Looks like they're not a member, adding them.")
    await danger.github.api.orgs.addOrgMembership({ org, username: authorLogin, role: "member"})
    markdown(inviteMarkdown)
  }
})
