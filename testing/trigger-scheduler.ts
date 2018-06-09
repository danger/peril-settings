import { peril } from "danger"

console.log("OK, starting")
peril.runTask("logger", "in 5 min", { hello: "world" })
