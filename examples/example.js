const {Scraper} = require("../../Discord-Scraper")
const token = "token"
const channelID = "905224867010465893"
const guildID = "803510549450588170"
const scraper = new Scraper({token, channelID, guildID})
scraper.on("fetched", (m) => {
    m.forEach(a=> {
        console.log(a.user.avatarURL())
    })
})
scraper.scrape()