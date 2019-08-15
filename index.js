const express = require("express");
const app = express();
const osu = require('node-os-utils')
const chalk = require('chalk')
const sleep = require('system-sleep');
const fs = require('fs');
const ipWhitelist = require('ip-whitelist'), path = require('path');

function format(seconds){
    function pad(s){
        return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(seconds / (60*60));
    var minutes = Math.floor(seconds % (60*60) / 60);
    var seconds = Math.floor(seconds % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

console.log(chalk.blue(`${new Date(Date.now()).toLocaleString()} [INFO] Uptimer Deamon is starting, please wait a second...`));
sleep(1000);
console.log(chalk.blue(`${new Date(Date.now()).toLocaleString()} [INFO] Uptimer Daemon is started, lets do some checks!`));

if(!fs.existsSync('./config/core.json')){
    return console.log(chalk.red(`${new Date(Date.now()).toLocaleString()} [ERR] Core.json not found! Please add a core.json in the config folder!`));
}

const stats = fs.statSync("./config/core.json");

if(stats.size === 0){
    return console.log(chalk.red(`${new Date(Date.now()).toLocaleString()} [ERR] I detected a empty core.json, please get the details from the panel!`));
}

const config = require('./config/core.json')

let whitelist = [config.REMOTE_URL, '127.0.0.1'];

app.use(ipWhitelist(ip => {
    return whitelist.indexOf(ip) !== -1;
}, function (req, res) {
    res.statusCode = 500;
    res.end('You shall not pass!');
}));

app.get("/", (req, res, next) => {
    res.json({online:format(process.uptime())});
});

app.get("/details", (req, res, next) => {
    osu.cpu.usage().then(info => {
        let cpuUsage = info;
        osu.cpu.free().then(info => {
            let cpuFree = info;
            osu.mem.info().then(info => {
                let memory = info;
                osu.os.oos().then(info => {
                    res.json({cpuUsage:cpuUsage,cpuFree:cpuFree,cpuCores:osu.cpu.count(),memoryTotal:memory["totalMemMb"],memoryUsed:memory["usedMemMb"],os:info})
                })
            })
        })
    })
});

app.listen(config.APP_PORT, "0.0.0.0", () => {
    console.log(chalk.blue(`${new Date(Date.now()).toLocaleString()} [INFO] Uptimer Daemon is running on 0.0.0.0:${config.APP_PORT}`));
});