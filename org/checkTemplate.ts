import { danger, markdown } from "danger"
import { Issues } from "github-webhook-event-types"

// Support checking if the issue has the same content as the issue template.
export default async (issueWebhook: Issues) => {
  const issue = issueWebhook.issue
  const repo = issueWebhook.repository

  // Grab, the issue template, it returns an empty string if a 404, so we can
  // do a check for existence
  const template = await danger.github.utils.fileContents(".github/ISSUE_TEMPLATE.md", repo.full_name)

  // Whitespace between code on disk vs text which comes from GitHub is different.
  // This took far too long to figure.
  if (template && template.replace(/\s+/g, "") === issue.body.replace(/\s+/g, "")) {
    markdown(
      `Hi there, thanks for the issue, but it seem that this issue is just the default template. Please create a new issue with the template filled out.`
    )

    // Let's just close it.
    await danger.github.api.issues.update({
      ...danger.github.thisPR,
      number: issue.number,
      state: "closed",
    })
  } else {
    console.log("The message did not match the template.")
  }
}
