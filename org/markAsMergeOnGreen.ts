import { danger } from "danger"
import { IssueComment } from "github-webhook-event-types"

// The shape of a label
interface Label {
  id: number
  url: string
  name: string
  description: string
  color: string
  default: boolean
}

/** If a comment to an issue contains "Merge on Green", apply a label for it to be merged when green. */
export default async (issueComment: IssueComment) => {
  const issue = issueComment.issue
  const api = danger.github.api

  // Only look at PR issue comments, this isn't in the type system
  if (!(issue as any).pull_request) {
    return
  }

  // Don't do any work unless we have to
  const keywords = ["merge on green", "merge on ci green"]
  const match = keywords.find(k => issue.body.toLowerCase().includes(k))
  if (match) {
    // Check to see if the label has already been set
    if (issue.labels.find(l => l.name === "Merge On Green")) {
      return
    }

    const sender = issueComment.sender
    const username = sender.login
    const org = issueComment.repository.owner.login

    // Check for org access, so that some rando doesn't
    // try to merge something without permission
    try {
      await api.orgs.checkMembership({ org, username })
    } catch (error) {
      // Someone does not have permission to force a merge
      return
    }

    // Create or re-use an existing label
    const owner = org
    const repo = issueComment.repository.name
    const existingLabels = await api.issues.getLabels({ owner, repo })
    let mergeOnGreen = existingLabels.data.find((l: Label) => l.name == "Merge On Green")

    // Create the label if it doesn't exist yet
    if (!mergeOnGreen) {
      const newLabel = await api.issues.createLabel({ owner, repo, name: "Merge on Green", color: "36B853" })
      mergeOnGreen = newLabel.data
    }

    // Then add the label
    await api.issues.addLabels({ owner, repo, number: issue.id, labels: ["Merge on Green"] })
  }
}
