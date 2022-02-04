"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scraper = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
const fs_1 = __importDefault(require("fs"));
class User {
    constructor(data) {
        this.username = data.username;
        this.id = data.id;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.public_flags = data.public_flags;
    }
    /**
     * @returns {String}
     */
    avatarURL() {
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}`;
    }
}
"online";
"offline";
"idle";
class GuildMember {
    constructor(data, token) {
        this.user = new User(data.user);
        this.roles = data.roles;
        this.presence = data.presence;
        this.mute = data.mute;
        this.deaf = data.deaf;
        this.joined_at = data.joined_at;
        this.hoisted = data.hoisted_role;
        this.token = token;
    }
}
class Scraper extends events_1.EventEmitter {
    /**
     *
     * @param {ScraperConfig} config
     */
    constructor(config) {
        super();
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
    setChannelID(id) {
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
    setGuildID(id) {
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
    setToken(token) {
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
    setOutputFile(filePath) {
        this.output = filePath;
    }
    scrape() {
        return __awaiter(this, void 0, void 0, function* () {
            let members = new Map();
            const channelID = this.cid;
            const guildID = this.gid;
            const token = this.token;
            // member count currently
            let i = 201;
            const memberCount = yield this.getMemberCount(guildID);
            // Encoding in JSON IS easiest :DDD NO CAP
            const ws = new ws_1.default("wss://gateway.discord.gg/?encoding=json&v=9");
            ws.onopen = () => __awaiter(this, void 0, void 0, function* () {
                let data = {
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
                };
                // ALWAYS send websocket data stringified!!
                yield ws.send(JSON.stringify(data));
                // Sleep to wait for readyEvent, completely relies on internet but hopefully it works for everyone
                yield this.sleep(6000);
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
                };
                yield ws.send(JSON.stringify(WSData));
                // Increase 300 for next 300 guildmembers
                i += 300;
            });
            ws.onmessage = (msg) => __awaiter(this, void 0, void 0, function* () {
                msg = JSON.parse(msg.data);
                // switch because it looks nicer in my opinion
                switch (msg["t"]) {
                    case "GUILD_MEMBER_LIST_UPDATE":
                        let rbool = false;
                        msg.d.ops.forEach((op) => {
                            // op.items = fetched members, if no fetched members then it would error if I'd go on
                            if (op.items) {
                                op.items.forEach((u) => {
                                    // check for member
                                    if (u.member) {
                                        members.set(u.member.user.id, new GuildMember(u.member, this.token));
                                        if (this.output) {
                                            try {
                                                fs_1.default.appendFileSync(this.output, `${u.member.user.id}\n`);
                                            }
                                            catch (err) {
                                                throw new Error("Output file is invalid and must be a path");
                                            }
                                        }
                                        // Keep fetching with true
                                        rbool = true;
                                    }
                                });
                            }
                        });
                        if (i > memberCount) {
                            ws.close();
                        }
                        if (rbool) {
                            yield this.sleep(6000);
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
                        };
                        yield ws.send(JSON.stringify({ op: 14, d }));
                        i += 300;
                        rbool = false;
                        break;
                    case "READY":
                        this.emit("ready", msg["d"]);
                        break;
                }
            });
            ws.onclose = () => {
                this.emit("fetched", (members));
            };
        });
    }
    getMemberCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get online member count
            const res = yield axios_1.default.get(`https://discord.com/api/guilds/${id}?with_counts=true`, { headers: { authorization: this.token } });
            return res.data["approximate_presence_count"];
        });
    }
    sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    calcArrays(input) {
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
            a = a.splice(result.length - 3, result.length);
        }
        return a;
    }
}
exports.Scraper = Scraper;
