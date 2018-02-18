import { danger, fail, message, warn, peril } from "danger"
import * as jsome from "jsome"

jsome.params.colored = false

if (danger.github.pr.body.includes("peril-debug")) {
  message(
    jsome({
      modified: danger.git.modified_files,
      created: danger.git.created_files,
      deleted: danger.git.deleted_files,
    })
  )

  warn(
    jsome({
      peril: peril,
    })
  )

  fail("random fail")
}
