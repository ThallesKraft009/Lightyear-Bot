const Bot = require("./structure/client.js");

let bot = new Bot({
  token: process.env.token,
  intents: 3276799
})
bot.start()
bot.PrefixLoad({
  prefix: "l?",
  local: "commands/prefix"
})

  //by ThallesKraft