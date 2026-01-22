'use strict';
const chalk = require('chalk');
const figlet = require('figlet');
const readline = require('readline');
const { spawn } = require('child_process');
const { default: logUpdate } = require('log-update');

// The readline interface is created here and exported for use in other modules.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "" });

function clearScreen() {
    process.stdout.write("\x1Bc");
}

function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function centerText(text) {
    const cols = process.stdout.columns || 80;
    const pad = Math.max(0, Math.floor((cols - stripAnsi(text).length) / 2));
    return " ".repeat(pad) + text;
}

// This function opens the live log window.
function openLogWindow(logFilePath) {
    const platform = process.platform;
    let cmd, args;
    const options = {
        detached: true,
        stdio: 'ignore'
    };

    if (platform === 'win32') {
        const title = "Scrape Live Log";
        const sanitizedPath = logFilePath.replace(/'/g, "''");
        cmd = `start "${title}" powershell.exe -NoExit -Command "Get-Content -Path '${sanitizedPath}' -Wait -Tail 10"`;
        args = [];
        options.shell = true;
    } else if (platform === 'darwin') {
        cmd = 'osascript';
        const macCommand = `tail -f "${logFilePath}"`;
        args = ['-e', `tell application "Terminal" to do script "${macCommand}"`];
    } else { // Linux
        cmd = 'gnome-terminal';
        args = ['--', 'tail', '-f', logFilePath];
    }

    const child = spawn(cmd, args, options);
    child.on('error', (err) => {
        // Use a generic command name in the error message
        const commandName = platform === 'win32' ? 'start' : platform === 'darwin' ? 'osascript' : 'gnome-terminal';
        console.error(chalk.red(`\n[ERROR] Failed to open new terminal window: ${err.message}`));
        console.error(chalk.yellow(`[TIP] Make sure ${commandName} is a valid command on your system.`));
    });
    child.unref();
}

function loading(text, duration = 1000) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${chalk.bold.cyan(frames[i++ % frames.length])} ${chalk.green(text)}`);
    }, 80);

    return new Promise(resolve => {
        setTimeout(() => {
            clearInterval(interval);
            process.stdout.write(`\r${chalk.bold.cyan('✔ ')} ${chalk.green(text)}\n`);
            resolve();
        }, duration);
    });
}

function renderBannerLines() {
    const raw = figlet.textSync("TALLY", { horizontalLayout: "full" });
    const lines = raw.split("\n");
    const tagline = chalk.gray("Tally CLI v2.3.0 - Puppeteer Edition | Code by Kasafa");
    lines.push("");
    lines.push(tagline);
    return lines.map((l, idx) => (idx < lines.length - 1) ? (idx % 2 === 0 ? chalk.green.bold(l) : chalk.green(l)) : l);
}

async function showAnimatedBannerSync() {
    return new Promise((resolve) => {
        const lines = renderBannerLines();
        let i = 0;
        function step() {
            if (i >= lines.length) return resolve();
            console.log(centerText(lines[i]));
            i++;
            setTimeout(step, 70);
        }
        step();
    });
}

function drawMenuBox() {
    const cols = process.stdout.columns || 80;
    const width = Math.min(72, cols - 10);
    const pad = (s) => " ".repeat(2) + s + " ".repeat(Math.max(0, width - 4 - stripAnsi(s).length));
    const top = "┌" + "─".repeat(width - 2) + "┐";
    const bottom = "└" + "─".repeat(width - 2) + "┘";
    console.log(centerText(chalk.yellow(top)));
    console.log(centerText(chalk.yellow("│" + pad(chalk.bold(" MAIN MENU ")) + "│")));
    const rows = [
        chalk.cyan("1") + chalk.gray(".") + " Start Scraping           " + chalk.dim("-> scrape & save data"),
        chalk.cyan("2") + chalk.gray(".") + " Calculate Total          " + chalk.dim("-> calculate totals from data.txt"),
        chalk.cyan("3") + chalk.gray(".") + " Input Non-Cash Amount    " + chalk.dim("-> set a non-cash amount to subtract"),
        chalk.cyan("4") + chalk.gray(".") + " Check Data               " + chalk.dim("-> view current data.txt contents"),
        chalk.cyan("5") + chalk.gray(".") + " Help                     " + chalk.dim("-> show this menu (clears screen)"),
        chalk.cyan("6") + chalk.gray(".") + " Exit                     " + chalk.dim("-> quit program and close browser"),
    ];
    rows.forEach((r) => console.log(centerText(chalk.yellow("│") + pad(r) + chalk.yellow("│"))));
    console.log(centerText(chalk.yellow(bottom)));
    console.log("");
    console.log(centerText(chalk.dim("Tip: Type command number or word, then Enter.")));
}

// This new version accepts state as parameters instead of using globals.
async function showMainMenu({ currentUser, totalScrapablePages, currentUrl }) {
    clearScreen();
    await showAnimatedBannerSync();
    console.log("");
    console.log(centerText(chalk.green(`User: ${chalk.yellow(currentUser)} │ Total Pages: ${chalk.yellow(totalScrapablePages)}`)));
    console.log(centerText(chalk.green(`Current URL: ${currentUrl}`)));
    drawMenuBox();
    redisplayPrompt();
}

function buildPrompt(currentUser) {
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour12: false });
    return `\n${chalk.gray("[")}${chalk.cyan(time)}${chalk.gray("]")} ${chalk.yellow(`[${currentUser}]`)} ${chalk.white.bold("» ")}`;
}

function redisplayPrompt(prompt) {
    rl.setPrompt(prompt);
    rl.prompt();
}

// A generic function to ask a question.
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

module.exports = {
    rl,
    clearScreen,
    centerText,
    openLogWindow,
    loading,
    showAnimatedBannerSync,
    showMainMenu,
    buildPrompt,
    redisplayPrompt,
    question,
    logUpdate,
};
