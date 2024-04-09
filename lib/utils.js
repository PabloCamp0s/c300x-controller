const fs = require("fs")
const os = require('os')
const path = require("path")
const ini = require("./ini.js")
const child_process = require('child_process')
const MESSAGES_FOLDER = "/home/bticino/cfg/extra/47/messages/"

// eslint-disable-next-line no-extend-native
Number.prototype.zeroPad = function (length) {
    length = length || 2; // defaults to 2 if no parameter is passed
    return (new Array(length).join('0') + this).slice(length * -1);
};

function tryAndCatch( func ) {
    try {
        return func()
    } catch (e) {
        console.error(e)
        return '';
    }
}

module.exports = {
    MESSAGES_FOLDER,
    version() {
        return tryAndCatch(() => {
            return os.version()
        })
    },
    load() {
        return tryAndCatch( () => {
            return os.loadavg().map(l => l.toFixed(2)).join(', ')
        } )
    },
    if() {
        return tryAndCatch( () => {
            return os.networkInterfaces()
        } )
    },
    release() {
        return tryAndCatch(() => {
            return os.release()
        })
    },
    freemem() {
        return tryAndCatch(() => {
            return os.freemem()
        })
    },
    totalmem() {
        return tryAndCatch(() => {
            return os.totalmem()
        })
    },
    temperature() {
        return tryAndCatch( () => {
            return fs.readFileSync("/sys/class/thermal/thermal_zone0/temp") / 1000;
        } )
    },
    wirelessInfo() {
        return tryAndCatch( () => {
            let output = child_process.execSync("/usr/sbin/iw dev wlan0 station dump", {timeout: 2500}).toString()
            let lines = output.split('\n')
            let wireless_stats = {}
            for(var line of lines) {
                    let info = line.split('\t')
                    if(info.length > 2) {
                            let key = info[1].replace(/:/, '')

                            wireless_stats[key] = info[2]
                    }
            }
            return wireless_stats
        } )
    },
    uptime() {
        return tryAndCatch( () => {
            return this.secondsToDhms(os.uptime());
        } )
    },
    voiceMailMessages() {
        return tryAndCatch( () => {
            let files = []
            fs.readdirSync(MESSAGES_FOLDER).forEach(file => {
                let resolvedFile = path.resolve(MESSAGES_FOLDER, file);
                let stat = fs.lstatSync(resolvedFile)
                if (stat.isDirectory()) {
                    let iniFile = MESSAGES_FOLDER + file + "/msg_info.ini"
                    var info = ini.parse(fs.readFileSync(iniFile))
                    var vmMessage = info['Message Information']
                    files.push({ file: file.toString(), thumbnail: '/voicemail?msg=' + file.toString() + '/aswm.jpg&raw=true', info: vmMessage })
                }
            });
            return files;
        })
    },
    secondsToDhms(seconds) {
        seconds = Number(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);

        const dDisplay = d > 0 ? d + (d === 1 ? ' day, ' : ' day(s), ') : '';
        const hDisplay = h > 0 ? `${h.zeroPad()}:` : '';
        const mDisplay = m > 0 ? `${m.zeroPad()}:` : '';
        const sDisplay = s > 0 ? s.zeroPad() : '';
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }
}