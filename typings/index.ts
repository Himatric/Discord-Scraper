import { EventEmitter } from "events";
import axios from "axios";
import WebSocket from "ws";
import fs from "fs";
interface Events {
    fetched: [GuildMembers: Map<string, GuildMember>]
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
    public avatarURL():string
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
    setChannelID(id:string):null
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
    setGuildID(id:string):null
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
    setToken(token:string):null
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
    setOutputFile(filePath:string):null
    /**
     * @example
     * ```js
     * const scraper = new Scraper({token, guildID, channelID})
     * scraper.on("fetched", async (members) => {
     *      console.log(members.size)
     * })
     * scraper.scrape()
     * ```
     */
    async scrape():Promise<null>
}
