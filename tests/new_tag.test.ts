jest.mock("danger", () => jest.fn())
import * as danger from "danger"
const dm = danger as any

import { newTag } from "../org/new_tag"

beforeEach(() => {
  dm.fail = jest.fn()
})

it("fails when there's no PR body", () => {
  dm.danger = { github: { pr: { body: "" } } }
  return newTag().then(() => {
    expect(dm.fail).toHaveBeenCalledWith("Please add a description to your PR.")
  })
})
