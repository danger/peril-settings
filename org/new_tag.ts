import { schedule, danger, markdown } from "danger"
import { Create } from "github-webhook-event-types"
import * as semverSort from "semver-sort"

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

// TODO:
// * Remove mentions on PRs from tag author
// * 7ea07170-ee5e-11e7-827d-967e155710e3
//
export const newTag = rfc("Send a comment to PRs on new tags that they have been released", async () => {
  const api = danger.github.api
  const gh = (danger.github as any) as Create
  const tag = gh.ref
  const thisRepo = { owner: gh.repository.owner.login, repo: gh.repository.name }

  const allTags: Tag[] = await api.repos.getTags(thisRepo)
  console.log(allTags)
  const semvers: string[] = semverSort.asc(allTags.map(tag => tag.name))

  const versionIndex = semvers.findIndex(version => version === tag)
  const releaseMinusOne = semvers[versionIndex + 1]
  console.log(`Looking between ${tag} and ${releaseMinusOne}`)
  if (!releaseMinusOne) {
    return
  }

  const compareData: CompareResults = await api.repos.compareCommits({ ...thisRepo, base: releaseMinusOne, head: tag })
  console.log("compare:", compareData)
  const commitMessages = compareData.commits.map(c => c.commit.name)
  const prMerges = commitMessages.filter(message => message.startsWith("Merge pull request #"))
  const numberExtractor = /Merge pull request #(\d*)/
  const prs = prMerges
    .map(msg => msg.match(numberExtractor) && msg.match(numberExtractor)![1])
    .filter(pr => pr) as string[]
  console.log("prs:", prs)

  const changelogURL = gh.repository.html_url + "/master/CHANGELOG.md"

  const inviteMarkdown = (username: string) => `
  Thanks for the PR @${username}.

  This PR has been shipped in v${gh.ref} - [CHANGELOG][].
  
  [CHANGELOG]: ${changelogURL}
  `
})

interface Tag {
  name: string
  commit: {
    sha: string
    url: string
  }
  zipball_url: string
  tarball_url: string
}

interface Commit {
  commit: {
    name: string
  }
}

interface CompareResults {
  commits: Commit[]
}
