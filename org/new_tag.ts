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

// Note: Current WebHook for testing: 7ea07170-ee5e-11e7-827d-967e155710e3
//
export const newTag = rfc("Send a comment to PRs on new tags that they have been released", async () => {
  const api = danger.github.api
  const gh = (danger.github as any) as Create
  const tag = gh.ref
  const thisRepo = { owner: gh.repository.owner.login, repo: gh.repository.name }

  // Grab all tags, should be latest ~20
  const allTagsResponse = await api.repos.getTags(thisRepo)
  const allTags: Tag[] = allTagsResponse.data

  // Sort the tags in semver, so we can know specifically what range to
  // work out the commits
  const semvers: string[] = semverSort.desc(allTags.map(tag => tag.name))
  const versionIndex = semvers.findIndex(version => version === tag)
  const releaseMinusOne = semvers[versionIndex + 1]

  // Bail if we can't find a release
  if (!releaseMinusOne) {
    return
  }

  // Ask for the commits
  const compareResults = await api.repos.compareCommits({ ...thisRepo, base: releaseMinusOne, head: tag })
  const compareData: CompareResults = compareResults.data

  // Pull out all the GH crafted merge commits on a repo
  const numberExtractor = /Merge pull request #(\d*)/
  const commitMessages = compareData.commits.map(c => c.commit.message)
  const prMerges = commitMessages.filter(message => message && message.startsWith("Merge pull request #"))

  // This is now a number array of PR ids
  // e.g. [ 930, 934, 937, 932, 938 ]
  const prs = prMerges
    .map(msg => msg.match(numberExtractor) && msg.match(numberExtractor)![1])
    .filter(pr => pr)
    .map((pr: any) => parseInt(pr))

  const changelogURL = gh.repository.html_url + "/master/CHANGELOG.md"

  const inviteMarkdown = (username: string) => `
  Thanks for the PR @${username}.

  This PR has been shipped in v${gh.ref} - [CHANGELOG][].
  
  [CHANGELOG]: ${changelogURL}
  `

  for (const prID of prs) {
    const prResponse = await api.pullRequests.get({ ...thisRepo, number: prID })
    const prData = prResponse.data
    const author = prData.user.login

    // If the PR wasn't created by whoever made the tag, send them a comment saying thanks!
    if (author !== gh.sender.login) {
      await api.issues.createComment({ ...thisRepo, number: prID, body: inviteMarkdown(author) })
    }
  }
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
    message: string
  }
}

interface CompareResults {
  commits: Commit[]
}
