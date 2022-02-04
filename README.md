# Discord Scraper #


## Installation ##
```bash
npm i Himatric/Discord-Scraper
```

## Usage ##

```js
const { Scraper } = require("scraper")
const scraper = new Scraper({token: "token", channelID: "channel id in guild", guildID: "guild id", outputFile: "path"})
//output file is not neccesary but it would write all the IDS of the scraped members to the file
scraper.scrape()
scraper.on("fetched", (members) => {
    // returns map of Member Objects
    console.log(members.size)
})
```

## Member Object ##
```js
{
    "user": {
        "username": String,
        "id": Snowflake,
        "discriminator": String,
        "avatar": String,
        "avatarURL": Function
    },
    "roles": Snowflake[],
    "presence": {
        "user": {
            "id": Snowflake,
        },
        "status": String,
        "activities": Array
    },
    "mute": Boolean,
    "joined_at": <ISO8601 timestamp>,
    "deaf": Boolean
}
```

## About ##

Might be updated idk\
Note: this will only get every ONLINE member.\
It's basically like scrolling down the memberlist in a guild.
