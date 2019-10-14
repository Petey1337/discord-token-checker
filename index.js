const request = require('request');
const colors = require('colors');
const chalk = require('chalk');
const fs = require('fs');
const proxies = fs.readFileSync('proxies.txt', 'utf-8').replace(/\r/gi, '').split('\n');
const tokens = [...new Set(require('fs').readFileSync('tokens.txt', 'utf-8').replace(/\r/g, '').split('\n'))];
process.on('uncaughtException', e => {});
process.on('uncaughtRejection', e => {});
process.warn = () => {};
var working = 0;
var locked = 0;
var invalid = 0;
var rate = 0;

function clear(file) {
    var stream = fs.createWriteStream(file);
    stream.once('open', function(fd) {
        stream.write("");
        stream.end();
    });
}
console.log(`Clearing token files.`.inverse);
clear("tokens/working.txt");
clear("tokens/invalid.txt");
clear("tokens/locked.txt");

function write(content, file) {
    fs.appendFile(file, content, function(err) {
    });
}

function check(token) {
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    request({
        method: "GET",
        url: 'https://discordapp.com/api/v6/users/@me/guilds',
        proxy: 'http://' + proxy,
        'timeout': 2500,
        json: true,
        headers: {
            "Content-Type": "application/json",
            authorization: token,
            'timeout': 2500
        }
    }, (err, res, body) => {
        if (res && res.statusCode === 200) {
            working++;
            console.log(chalk.green("[%s] (%s/%s/%s) [Working] Token: %s | Proxy: %s"), res.statusCode, working, checked, tokens.length, token, proxy);
            write(token + "\n", "tokens/working.txt");
        } else if (res && res.statusCode === 403) {
            locked++;
            console.log(chalk.yellow("[%s] (%s/%s/%s) [Locked] Token: %s | Proxy: %s"), res.statusCode, locked, checked, tokens.length, token, proxy);
            write(token + "\n", "tokens/locked.txt");

        } else if (res && res.statusCode === 401) {
            invalid++;
            console.log(chalk.red("[%s] (%s/%s/%s) [Invalid] Token: %s | Proxy: %s"), res.statusCode, invalid, checked, tokens.length, token, proxy);
            write(token + "\n", "tokens/invalid.txt");

        } else if (res && res.statusCode === 429) {
            rate++;
            console.log(chalk.red("[%s] (%s) Proxy: %s has been rate limited".inverse), res.statusCode, rate, proxy);
            check(token);
		}
        checked = working + invalid + locked;
        process.title = `[Token Checker] - ${checked}/${tokens.length} Total Checked | ${working} Working | ${invalid} Invalid | ${locked} Locked | ${rate} Rate Limited`;
    });
}
console.log(`[Token Checker]: Started!`.inverse);
console.log(`[Checking %s Tokens with %s Proxies!]`.inverse, tokens.length, proxies.length);
for (var i in tokens) check(tokens[i]);