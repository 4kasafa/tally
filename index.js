const puppeteer = require('puppeteer');
const chalk = require('chalk');
const figlet = require('figlet');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { scrapeTransactions } = require('./scraper');
const { default: logUpdate } = require('log-update');
const FILE_PATH = "data.txt";

// --- Global State Variables ---
let browser;
let page;
let currentUser = "Guest";
let totalScrapablePages = 0;
let currentUrl = '';
let isLoggedIn = false;
let nonCash = 0; // For non-cash calculation

// --- CLI UI Utility Functions ---
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

function openFileInEditor(filePath) {
    const platform = process.platform;
    const cmd = platform === "win32" ? `notepad "${filePath}"` : platform === "darwin" ? `open "${filePath}"` : `xdg-open "${filePath}"`;
    exec(cmd, (err) => {
        if (err) console.log(chalk.red(`\n[ERROR] Failed to open file: ${err.message}`));
    });
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
            process.stdout.write(`\r${chalk.bold.green('✔ ')} ${chalk.green(text)}\n`);
            resolve();
        }, duration);
    });
}



function renderBannerLines() {
    const raw = figlet.textSync("TALLY", { horizontalLayout: "full" });
    const lines = raw.split("\n");
    const tagline = chalk.gray("Tally CLI v2.0 - Puppeteer Edition | Code by KV7");
    lines.push("");
    lines.push(tagline);
    return lines.map((l, idx) => (idx < lines.length - 1) ? (idx % 2 === 0 ? chalk.blue.bold(l) : chalk.blue(l)) : l);
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

// --- Puppeteer and Browser Management ---
async function launchBrowserAndSetup() {
    clearScreen();
    await showAnimatedBannerSync();
    console.log(centerText(chalk.yellow("\nLaunching browser...")));
    browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized', '--disable-features=TranslateUI,Translate'] });
    page = (await browser.pages())[0] || await browser.newPage();
    currentUrl = page.url();
    console.log(centerText(chalk.cyan("Please log in to https://pos.ketoko.co.id/")));
    console.log(centerText(chalk.red.bold("NOTE: You must log in manually each time.")));
    await page.goto('https://pos.ketoko.co.id/login-form', { waitUntil: 'networkidle2' });
    while (page.url().includes('/login-form')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    isLoggedIn = true;
    console.log(centerText(chalk.green.bold(`\nLogin detected! Navigating to kasir list...`)));
    await page.goto('https://pos.ketoko.co.id/kasirlistmode2', { waitUntil: 'networkidle2' });
    currentUrl = page.url();
    await updateStateFromPage();
    await showMainMenu();
    startPromptLoop();
}

async function updateStateFromPage() {
    try {
        await page.waitForSelector('.user-name', { timeout: 2000 });
        currentUser = await page.$eval('.user-name', el => el.textContent.trim());
    } catch (e) {
        currentUser = "Guest";
    }
    try {
        await page.waitForSelector('.imk-margin-lefttopbot', { timeout: 2000 });
        const pagesText = await page.$eval('.imk-margin-lefttopbot', el => el.textContent.trim());
        const match = pagesText.match(/Hal\s*\d+\s*\/\s*(\d+)/);
        totalScrapablePages = (match && match[1]) ? parseInt(match[1]) : 'N/A';
    } catch (e) {
        totalScrapablePages = 'N/A';
    }
}

// --- Calculation Logic ---
function readFile() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const data = fs.readFileSync(FILE_PATH, "utf8");
  return data.split("\n").filter(Boolean);
}

function calculateTotal() {
    const lines = readFile();
    const regex = /\d{1,3}(?:,\d{3})*\.\d{2}/;
    let total = 0;
    let transactions = [];

    for (let line of lines) {
        const match = line.match(regex);
        if (match) {
        let amount = parseFloat(match[0].replace(/,/g, ""));
        transactions.push(amount);
        total += amount;
        }
    }
    return { total, transactions };
}

// --- Main CLI Menu Rendering Functions ---
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
        chalk.cyan("4") + chalk.gray(".") + " Exit                     " + chalk.dim("-> quit program and close browser"),
        chalk.cyan("5") + chalk.gray(".") + " Help                     " + chalk.dim("-> show this menu (clears screen)"),
    ];
    rows.forEach((r) => console.log(centerText(chalk.yellow("│") + pad(r) + chalk.yellow("│"))));
    console.log(centerText(chalk.yellow(bottom)));
    console.log("");
    console.log(centerText(chalk.dim("Tip: Type command number or word, then Enter.")));
}

function buildPrompt() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour12: false });
    return `\n${chalk.gray("[")}${chalk.cyan(time)}${chalk.gray("]")} ${chalk.blue(`[${currentUser}]`)} ${chalk.white.bold("» ")}`;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "" });

async function showMainMenu() {
    clearScreen();
    await showAnimatedBannerSync();
    console.log("");
    console.log(centerText(chalk.greenBright(`User: ${currentUser} │ Total Pages: ${totalScrapablePages || 'N/A'}`)));
    console.log(centerText(chalk.blue(`Current URL: ${page.url()}`)));
    drawMenuBox();
    redisplayPrompt();
}

function redisplayPrompt() {
    rl.setPrompt(buildPrompt());
    rl.prompt();
}

// --- Main CLI Event Loop ---
async function startPromptLoop() {
    rl.on("line", async (line) => {
        const cmd = line.trim().toLowerCase();
        if (cmd === "") return redisplayPrompt();

        switch (cmd) {
            case "1":
            case "start":
            case "scrape":
                const fileName = 'data.txt';
                const filePath = path.join(__dirname, fileName);

                const startScraping = async () => {
                    console.log(chalk.blue(`\n[*] Starting scraper... Data will be saved to ${chalk.cyan(fileName)}.`));
                    openFileInEditor(filePath);
                    fs.writeFileSync(filePath, '');
                    let totalLines = 0;
                    const logOutput = [];

                    try {
                        for await (const result of scrapeTransactions(page, currentUser, totalScrapablePages)) {
                            // 1. Add the new log message to an array
                            let newLog;
                            if (result.pageData) {
                                fs.appendFileSync(filePath, result.pageData);
                                totalLines += result.linesFound;
                                newLog = `  ${chalk.cyan('↳')} ${chalk.green(`[+] Page ${result.pageNumber}:`)} ${chalk.white(`Found and saved ${result.linesFound} transaction(s).`)}`;
                            } else {
                                newLog = `  ${chalk.cyan('↳')} ${chalk.yellow(`[!] Page ${result.pageNumber}:`)} ${chalk.gray(`No matching transactions for '${currentUser}'.`)}`;
                            }
                            logOutput.push(newLog);

                            // 2. Create the progress bar string
                            const percentage = Math.round((result.pageNumber / totalScrapablePages) * 100);
                            const progressBarWidth = 40;
                            const filledWidth = Math.round((progressBarWidth * percentage) / 100);
                            const emptyWidth = progressBarWidth - filledWidth;
                            const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
                            const progressText = chalk.yellow(`Scraping Progress: [${bar}] ${percentage}% (${result.pageNumber}/${totalScrapablePages})`);

                            // 3. Render the logs and progress bar with log-update
                            logUpdate(
                                logOutput.join('\n') + '\n' + progressText
                            );
                        }

                        logUpdate.done(); // Persist the logs
                        console.log(chalk.green.bold(`\n✔  Scraping complete! A total of ${totalLines} transaction(s) were saved to ${fileName}.`));

                    } catch (e) {
                        logUpdate.clear(); // Clear the log-update block before printing error
                        console.error(chalk.red(`\nAn unexpected error occurred during scraping: ${e.message}`));
                    }
                    redisplayPrompt();
                };

                if (currentUser === "Guest") {
                    console.log(chalk.red("\nCannot start scraping: current user is 'Guest'. Make sure you are logged in."));
                    redisplayPrompt();
                    return;
                }
                if (typeof totalScrapablePages !== 'number' || totalScrapablePages <= 0) {
                    console.log(chalk.red(`\nCannot start scraping: Invalid number of pages found ('${totalScrapablePages}').`));
                    redisplayPrompt();
                    return;
                }

                if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8').length > 0) {
                    rl.question(chalk.yellow(`\nWarning: '${fileName}' is not empty and will be overwritten. Continue? (y/n): `), (ans) => {
                        if (ans.trim().toLowerCase() === 'y') {
                            startScraping();
                        } else {
                            console.log(chalk.red("\nScraping cancelled by user."));
                            redisplayPrompt();
                        }
                    });
                } else {
                    startScraping();
                }
                return;

            case "2":
            case "calculate":
                await loading("Calculating totals...", 1000);
                const { total, transactions } = calculateTotal();
                const finalTotal = total - nonCash;
                console.log(chalk.greenBright("\n--- Calculation Results ---"));
                console.log(chalk.green("Total Transactions Found:"), chalk.white(transactions.length));
                console.log(chalk.green("Total Transaction Amount: Rp"), chalk.white(total.toLocaleString("id-ID")));
                console.log(chalk.yellow("Non-Cash Amount: Rp"), chalk.white(nonCash.toLocaleString("id-ID")));
                console.log(chalk.gray("---------------------------"));
                console.log(chalk.green.bold("Final Total (Cash): Rp"), chalk.white.bold(finalTotal.toLocaleString("id-ID")));
                redisplayPrompt();
                break;

            case "3":
            case "non-cash":
                rl.question(chalk.yellow("\nEnter Non-Cash Amount : "), (ans) => {
                    const val = parseFloat(ans.replace(/[.,]/g, ''));
                    if (!isNaN(val) && val >= 0) {
                        nonCash = val;
                        console.log(chalk.green(`[INFO] Non-cash amount set to: Rp ${nonCash.toLocaleString("id-ID")}`));
                    } else {
                        console.log(chalk.red("[ERROR] Invalid amount. Please enter a valid number."));
                    }
                    redisplayPrompt();
                });
                return;



            case "4":
            case "exit":
            case "quit":
                rl.question(chalk.red("\nAre you sure you want to quit? (y/n): "), async (ans) => {
                    if (ans.trim().toLowerCase() === "y") {
                        console.log(chalk.green("\nExiting application..."));
                        if (browser) await browser.close();
                        rl.close();
                    } else {
                        console.log(chalk.gray("\n[CANCEL] Exit cancelled."));
                        redisplayPrompt();
                    }
                });
                return;

            case "help":
            case "h":
            case "?":
                await showMainMenu();
                return;

            default:
                console.log(chalk.red("\nUnknown command — type 'help' to see available commands."));
                redisplayPrompt();
        }
    });

    rl.on("close", () => {
        console.log(chalk.dim("\nGoodbye."));
        process.exit(0);
    });
}

async function main() {
    await launchBrowserAndSetup();
}

main();