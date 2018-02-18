import { danger, fail, message, warn, peril } from "danger"

if (danger.github.pr.body.includes("peril-debug")) {
  message(
    JSON.stringify({
      modified: danger.git.modified_files,
      created: danger.git.created_files,
      deleted: danger.git.deleted_files,
    })
  )

  warn(
    JSON.stringify({
      peril: peril,
    })
  )

  fail("random fail")
}
