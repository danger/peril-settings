import { schedule, danger, markdown } from "danger"
import { Create } from "github-webhook-event-types"

import * as semverSort from "semver-sort"

export default async (gh: Create) => {
  const api = danger.github.api

  const tag = gh.ref
  const thisRepo = { owner: gh.repository.owner.login, repo: gh.repository.name }

  // Grab all tags, should be latest ~20
  const allTagsResponse = await api.repos.listTags(thisRepo)
  const allTags: Tag[] = allTagsResponse.data

  // Sort the tags in semver, so we can know specifically what range to
  // work out the commits
  const semverStrings: string[] = semverSort.desc(allTags.map(tag => tag.name))
  const versionIndex = semverStrings.findIndex(version => version === tag)
  const releaseMinusOne = semverStrings[versionIndex + 1]

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

  const changelogURL = gh.repository.html_url + "/blob/master/CHANGELOG.md"
  const displayTag = gh.ref.startsWith("v") ? gh.ref : `v${gh.ref}`

  const inviteMarkdown = (username: string) => `
  Thanks for the PR @${username}.

  This PR has been shipped in ${displayTag} - [CHANGELOG][].
  
  [CHANGELOG]: ${changelogURL}
  `

  for (const prID of prs) {
    const prResponse = await api.pulls.get({ ...thisRepo, number: prID })
    const prData = prResponse.data
    const author = prData.user.login

    // If the PR wasn't created by whoever made the tag, send them a comment saying thanks!
    if (author !== gh.sender.login) {
      await api.issues.createComment({ ...thisRepo, number: prID, body: inviteMarkdown(author) })
    }
  }
}

interface Tag {
  name: string
  commit: {
    sha: string
    url: string
  }
}

interface Commit {
  commit: {
    message: string
  }
}

interface CompareResults {
  commits: Commit[]
}
