import { danger, warn } from "danger"

export default async () => {
  const pr = danger.github.pr

  const changelogNames = ["CHANGELOG.md", "changelog.md", "CHANGELOG.yml"]
  const isOpen = danger.github.pr.state === "open"
  if (!isOpen) {
    return console.log(`PR is merged, so no need for changelog checks.`)
  }

  // Get all the files in the root folder of the repo
  // e.g. https://api.github.com/repos/artsy/eigen/git/trees/master
  const rootContents: any = await danger.github.api.git.getTree({
    owner: pr.base.user.login,
    repo: pr.base.repo.name,
    tree_sha: "master",
  })

  const pathForChangelog = rootContents.data.tree.find((file: { path: string }) => changelogNames.includes(file.path))
  if (!pathForChangelog) {
    return console.log(`Skipping because there isn't a CHANGELOG in ${pr.base.repo.full_name}.`)
  }

  const files = [...danger.git.modified_files, ...danger.git.created_files]

  // A rough heuristic for when code should have a changelog
  const hasCodeChanges = files.find(file => !file.match(/(test|spec|readme|changelog)/i))
  // Check for a changelog
  const hasChangelogChanges = files.find(file => changelogNames.includes(file))

  // Request a CHANGELOG entry if not declared #trivial
  const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes("#trivial")
  const isUser = danger.github.pr.user.type === "User"

  // Politely ask for their name on the entry too
  if (hasCodeChanges && !pathForChangelog && !isTrivial && !isUser && !hasChangelogChanges) {
    const changelogDiff = await danger.git.diffForFile(pathForChangelog)
    const contributorName = danger.github.pr.user.login
    if (changelogDiff && changelogDiff.diff.includes(contributorName)) {
      warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
    } else {
      warn("Please add a changelog entry for your changes.")
    }
  }
}
