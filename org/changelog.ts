import { danger, warn } from "danger"

;(async () => {
  const pr = danger.github.pr

  const changelogs = ["CHANGELOG.md", "changelog.md", "CHANGELOG.yml"]
  const isOpen = danger.github.pr.state === "open"

  // Get all the files in the root folder of the repo
  // e.g. https://api.github.com/repos/artsy/eigen/git/trees/master
  const getContentParams = { owner: pr.base.user.login, repo: pr.base.repo.name, sha: "master" }
  const rootContents: any = await danger.github.api.gitdata.getTree(getContentParams)

  const hasChangelog = rootContents.data.tree.find((file: { path: string }) => changelogs.includes(file.path))
  if (isOpen && hasChangelog) {
    const files = [...danger.git.modified_files, ...danger.git.created_files]

    // A rough heuristic for when code should havea changelog
    const hasCodeChanges = files.find(file => !file.match(/(test|spec|readme|changelog)/i))
    // Check for a changelog
    const hasChangelogChanges = files.find(file => changelogs.includes(file))

    // Request a CHANGELOG entry if not declared #trivial
    const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes("#trivial")
    const isUser = danger.github.pr.user.type === "User"

    // Politely ask for their name on the entry too
    if (hasCodeChanges && !hasChangelog && !isTrivial && !isUser) {
      const changelogDiff = await danger.git.diffForFile("CHANGELOG.md")
      const contributorName = danger.github.pr.user.login
      if (changelogDiff && changelogDiff.diff.includes(contributorName)) {
        warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
      } else {
        warn("Please add a changelog entry for your changes.")
      }
    }
  }
})()
