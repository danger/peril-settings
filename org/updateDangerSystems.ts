import { peril } from "danger"
import { Create } from "github-webhook-event-types"

import fetch from "node-fetch"

export default async (gh: Create) => {
  const gitlabProjectID = "1620437"

  await fetch(`https://gitlab.com/api/v4/projects/${gitlabProjectID}/trigger/pipeline`, {
    method: "POST",
    body: JSON.stringify({
      ref: "master",
      token: peril.env.GITLAB_DEPLOY_TOKEN,
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
}
