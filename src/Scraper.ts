import { EventEmitter } from "events";
import axios from "axios";
import WebSocket from "ws";
import fs from "fs";
interface Events {
    fetched: [GuildMembers: Map<string, GuildMember>]
    ready: [ReadyEvent: ReadyEvent]
}
interface UserInterface {
    username:string
    public_flags:number
    discriminator:string
    avatar:string
    id:string
}
interface IClientUser {
    email:string
    verified: boolean
    username: string
    purchased_flags: number
    premium: boolean
    phone: string|null
    nsfw_allowed: boolean
    mobile: boolean
    mfa_enabled: boolean
    id:string
    flags:number
    discriminator:string
    desktop:boolean
    bio:string
    banner_color: string|null
    banner:string|null
    avatar:string|null
    accent_color:string|null
}
interface ReadyEvent {
    users?: UserInterface[]
    user:IClientUser
    relationships:Relationship[]
}
interface Relationship {
    user_id: string,
    type:number
    nickname:string|null
    id:string
}
interface ScraperConfig {
    outputFile?: string
    token: string
    channelID: string
    guildID: string
}
interface rawUserData {
    username: string
    id: string
    discriminator: string
    avatar:string
    public_flags:number
}
class User {
    username:string;
    id:string;
    discriminator:string;
    avatar:string;
    public_flags:number
    constructor(data:rawUserData) {
        this.username = data.username;
        this.id = data.id;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.public_flags = data.public_flags
    }
    /**
     * @returns {String}
     */
    public avatarURL() {
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}`
    }
}
interface rawGuildMember {
    user: User
    roles: Array<string>
    presence:MemberPresence
    mute:boolean
    joined_at:string
    hoisted_role:null|string
    deaf:boolean
}
type Status = 
    "dnd"
    "online" 
    "offline"
    "idle"
interface ActivityTimestamp {
    start:number
    end:number
}
interface Emoji {
    name:string
    id?:string
    animated?:boolean
}
interface Activity {
    name:string
    type:number
    url?:string
    created_at:number
    timestamps:ActivityTimestamp
    application_id?:string
    details?:string
    state?:string
    emoji?:Emoji
    instance?:boolean
    flags:number
}
interface ClientStatus {
    desktop?:Status
    mobile?:Status
}
interface MemberPresence {
    user:object
    status:string
    client_status:ClientStatus
    activities:Activity[]
}
class GuildMember {
    user:User;
    roles:Array<string>;
    presence:MemberPresence;
    mute:boolean
    deaf:boolean
    joined_at:string
    hoisted:null|string
    private token:string
    constructor(data:rawGuildMember, token:string) {
        this.user = new User(data.user);
        this.roles = data.roles
        this.presence = data.presence
        this.mute = data.mute
        this.deaf = data.deaf
        this.joined_at = data.joined_at
        this.hoisted = data.hoisted_role
        this.token = token
    }
}
export class Scraper extends EventEmitter {
    private output:string | undefined;
    private cid:string;
    private gid:string;
    public token:string;
    public on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => Awaited<void>)
    public on<S extends string | symbol>(
        event: Exclude<S, keyof Events>, listener: (...args: any[]) => Awaited<void>,
    ):this
    public once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => Awaited<void>):this;
    public once<S extends string | symbol>(
    event: Exclude<S, keyof Events>,
    listener: (...args: any[]) => Awaited<void>,
    ):this
    /**
     * 
     * @param {ScraperConfig} config 
     */
    constructor(config: ScraperConfig) {
        super()
        this.output = config.outputFile ? config.outputFile : undefined;
        this.cid = config.channelID;
        this.gid = config.guildID;
        this.token = config.token;
    }
    /**
     * @param {String} id 
     * @description
     * Sets guild ID to a new one
     * @example
     * ```js
     * const scraper = new Scraper({guildID})
     * scraper.setChannelID("id")
     * ```
     */
    setChannelID(id:string) {
        this.cid = id;
    }
    /**
     * @param {String} id 
     * @description
     * Sets guild ID to a new one
     * @example
     * ```js
     * const scraper = new Scraper({channelID})
     * scraper.setGuildID("id")
     * ```
     */
    setGuildID(id:string) {
        this.gid = id;
    }
    /**
     * @param {String} token 
     * @description
     * Sets token to new token
     * @example 
     * ```js
     * const scraper = new Scraper({guildID, channelID})
     * scraper.setToken("token")
     * console.log(scraper.token)
     * // "token"
     * ```
     */
    setToken(token:string) {
        this.token = token;
    }
    /**
     * @param {String} filePath 
     * @description
     * Sets current file path to a new one
     * @example
     * ```js
     * const scraper = new Scraper()
     * scraper.setOutputFile("./members.txt");
     * scraper.scrape()
     * // writes all ids to members.txt
     * ```
     */
    setOutputFile(filePath:string) {
        this.output = filePath;
    }
    async scrape() {
        let members = new Map<string, GuildMember>();
        const channelID = this.cid;
        const guildID = this.gid;
        const token = this.token;
        // member count currently
        let i = 201;
        const memberCount = await this.getMemberCount(guildID);
        // Encoding in JSON IS easiest :DDD NO CAP
        const ws = new WebSocket("wss://gateway.discord.gg/?encoding=json&v=9");
        ws.onopen = async () => {
            let data:object = {
                op: 2,
                d: {
                    capabilities: 253,
                    token: token,
                    properties: {
                        browser: "Chrome",
                        browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36",
                        browser_version: "97.0.4692.99",
                        client_build_number: 113194,
                        client_event_source: null,
                        device: "",
                        os: "Windows",
                        os_version: "10",
                        referrer: "https://www.google.com/",
                        referrer_current: "",
                        referring_domain: "www.google.com",
                        referring_domain_current: "",
                        release_channel: "stable",
                        search_engine: "google",
                        system_locale: "en-EN",
                    }
                }
            }
            // ALWAYS send websocket data stringified!!
            await ws.send(JSON.stringify(data));
            // Sleep to wait for readyEvent, completely relies on internet but hopefully it works for everyone
            await this.sleep(6000);
            /** 
            *  op 14 = requesting members
            *  this.#calcArrays will return [[0, 99], [100, 199], [200, 299]] in this instance
            *  this is for requesting the first 300 online members 
            *  it works just like scrolling down the memberlist!
            */
            let WSData = {
                op: 14, d: {
                    guild_id: guildID,
                    channels: {
                        [channelID]: this.calcArrays(i)
                    },
                    members: [],
                    typing: true,
                    threads: true
                }
            }
            await ws.send(JSON.stringify(WSData));
            // Increase 300 for next 300 guildmembers
            i += 300;
        }
        ws.onmessage = async (msg:any) => {
            msg = JSON.parse(msg.data);
            // switch because it looks nicer in my opinion
            switch (msg["t"]) {
                case "GUILD_MEMBER_LIST_UPDATE":
                    let rbool = false;
                    msg.d.ops.forEach((op:any) => {
                        // op.items = fetched members, if no fetched members then it would error if I'd go on
                        if(op.items) {
                            op.items.forEach((u:any) => {
                                // check for member
                                if(u.member) {
                                    members.set(u.member.user.id, new GuildMember(u.member, this.token))
                                    if(this.output) {
                                        try {
                                            fs.appendFileSync(this.output, `${u.member.user.id}\n`)
                                        } catch (err) {
                                            throw new Error("Output file is invalid and must be a path")
                                        }
                                    }
                                    // Keep fetching with true
                                    rbool = true;
                                }
                            })
                        }
                    })
                    if(i > memberCount) {
                        ws.close();
                    }
                    if(rbool) {
                        await this.sleep(6000);
                    }
                    const d = {
                        guild_id: guildID,
                        channels: {
                            [channelID]: this.calcArrays(i)
                        },
                        activities: true,
                        members: [],
                        typing: true,
                        threads: true
                    }
                    await ws.send(JSON.stringify({op: 14, d}));
                    i += 300;
                    rbool = false;
                    break;
                case "READY":
                    this.emit("ready", msg["d"])
                    break;
            }
        }
        ws.onclose = () => {
            this.emit("fetched", (members))
        }
    }
    private async getMemberCount(id:string):Promise<number> {
        // Get online member count
        const res = await axios.get(`https://discord.com/api/guilds/${id}?with_counts=true`, { headers: { authorization: this.token } })
        return res.data["approximate_presence_count"];
    }
    private sleep(time:number):Promise<unknown> {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    private calcArrays(input:number) {
        const result = [];
        // each step reduces a hundred
        for (let i = input; i >= 0; i = i - 100) {
            // round by hundred
            const round = Math.ceil(i / 100) * 100;
            // push into the result variable defined earlier on top
            result.push([round - 100, round - 1]);
        }
        let a = result.reverse();
        // Discord only accepts 3 arrays of members at a time else error
        if (a.length > 3) {
            a = a.splice(result.length - 3, result.length)
        }
        return a
    }
}
