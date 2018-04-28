import { schedule, danger, markdown } from "danger"
import { Status } from "github-webhook-event-types"
import { LabelLabel } from "github-webhook-event-types/source/Label"

export default async () => {
  const api = danger.github.api
  const status = (danger.github as any) as Status

  if (status.state !== "success") {
    return
  }

  // Check to see if all other statuses on the same commit are also green. E.g. is this the last green.
  const owner = status.repository.owner.login
  const repo = status.repository.name
  const allGreen = await api.repos.getCombinedStatusForRef({ owner, repo, ref: status.commit.sha })
  if (allGreen.data.state !== "success") {
    return
  }

  // See https://github.com/maintainers/early-access-feedback/issues/114 for more context on getting a PR from a SHA
  const repoString = status.repository.full_name
  const searchResponse = await api.search.issues({ q: `${status.commit.sha} type:pr is:open repo:${repoString}` })

  // https://developer.github.com/v3/search/#search-issues
  const prsWithCommit = searchResponse.data.map((i: any) => i.id) as number[]
  for (const number of prsWithCommit) {
    // Get the PR labels
    const issue = await api.issues.get({ owner, repo, number })

    // Get the PR combined status
    const mergeLabel = issue.data.labels.find((l: LabelLabel) => l.name === "Merge On Green")
    if (!mergeLabel) {
      return
    }

    // Merge the PR
    await api.pullRequests.merge({ owner, repo, number, commit_title: "Merged by Peril" })
  }
}
