import { peril } from "danger"
import { Create } from "github-webhook-event-types"

import fetch from "node-fetch"

export default async (gh: Create) => {
  const gitlabProjectID = "1620437"

  const response = await fetch(`https://gitlab.com/api/v3/projects/${gitlabProjectID}/pipeline?ref=master`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "PRIVATE-TOKEN": peril.env.GITLAB_DEPLOY_TOKEN,
    },
  })

  console.log("> ", peril.env.GITLAB_DEPLOY_TOKEN)
  console.log(JSON.stringify(response, null, "  "))
}
