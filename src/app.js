'use strict';
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // Added chalk import
const ui = require('./ui');
const browserManager = require('./browser');
const { scrapeTransactions } = require('./scraper');

// --- Application State ---
const FILE_PATH = "data.txt";
let nonCash = 0;
let appState = {
    browser: null,
    page: null,
    currentUser: "Guest",
    totalScrapablePages: 0,
    isLoggedIn: false,
};

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

// --- Main CLI Event Loop ---
async function startPromptLoop() {
    ui.rl.on("line", async (line) => {
        const cmd = line.trim().toLowerCase();
        if (cmd === "") {
            const prompt = ui.buildPrompt(appState.currentUser);
            return ui.redisplayPrompt(prompt);
        };

        switch (cmd) {
            case "1":
            case "start":
            case "scrape":
                await handleScraping();
                break;

            case "2":
            case "calculate":
                await handleCalculation();
                break;

            case "3":
            case "non-cash":
                await handleNonCashInput();
                break;
            
            case "4":
            case "check":
            case "data":
                handleDataCheck();
                break;

            case "5":
            case "help":
            case "h":
            case "?":
                await ui.showMainMenu({ ...appState, currentUrl: appState.page.url() });
                break;
            
            case "6":
            case "exit":
            case "quit":
                await handleExit();
                return; // Stop further processing

            default:
                console.log(chalk.red("\nUnknown command — type 'help' to see available commands."));
                const prompt = ui.buildPrompt(appState.currentUser);
                ui.redisplayPrompt(prompt);
        }
    });
}

// --- Command Handlers ---

async function handleScraping() {
    if (appState.currentUser === "Guest") {
        console.log(chalk.red("\nCannot start scraping: current user is 'Guest'. Make sure you are logged in."));
        const prompt = ui.buildPrompt(appState.currentUser);
        return ui.redisplayPrompt(prompt);
    }
    if (typeof appState.totalScrapablePages !== 'number' || appState.totalScrapablePages <= 0) {
        console.log(chalk.red(`\nCannot start scraping: Invalid number of pages found ('${appState.totalScrapablePages}').`));
        const prompt = ui.buildPrompt(appState.currentUser);
        return ui.redisplayPrompt(prompt);
    }

    const start = async () => {
        const logFileName = 'scrape-live.log';
        const logFilePath = path.join(__dirname, '..', logFileName); // Move up to root dir

        fs.writeFileSync(FILE_PATH, ''); 
        fs.writeFileSync(logFilePath, `Opening live log window...\nWaiting for data...\n\n`);

        console.log(chalk.green(`\n[*] Opening live log window...`));
        ui.openLogWindow(logFilePath);
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(chalk.green(`\n[*] Starting scraper... Data will be saved to ${chalk.cyan(FILE_PATH)}.`));
        let totalLines = 0;
        const logOutput = [];

        const cleanup = () => fs.existsSync(logFilePath) && fs.unlinkSync(logFilePath);
        process.on('exit', cleanup);
        ui.rl.on('close', cleanup);

        try {
            for await (const result of scrapeTransactions(appState.page, appState.currentUser, appState.totalScrapablePages)) {
                let newLog;
                if (result.pageData) {
                    fs.appendFileSync(FILE_PATH, result.pageData);
                    fs.appendFileSync(logFilePath, chalk.green(result.pageData));
                    totalLines += result.linesFound;
                    newLog = `  ${chalk.cyan('↳')} ${chalk.green(`[+] Page ${result.pageNumber}:`)} ${chalk.white(`Found and saved ${result.linesFound} transaction(s).`)}`;
                } else {
                    newLog = `  ${chalk.cyan('↳')} ${chalk.yellow(`[!] Page ${result.pageNumber}:`)} ${chalk.gray(`No matching transactions for '${appState.currentUser}'.`)}`;
                }
                logOutput.push(newLog);

                const percentage = Math.round((result.pageNumber / appState.totalScrapablePages) * 100);
                const progressBarWidth = 40;
                const filledWidth = Math.round((progressBarWidth * percentage) / 100);
                const emptyWidth = progressBarWidth - filledWidth;
                const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
                const progressText = chalk.yellow(`Scraping Progress: [${bar}] ${percentage}% (${result.pageNumber}/${appState.totalScrapablePages})`);

                ui.logUpdate(logOutput.join('\n') + '\n' + progressText);
            }

            ui.logUpdate.done();
            console.log(chalk.green.bold(`\n✔  Scraping complete! A total of ${totalLines} transaction(s) were saved to ${FILE_PATH}.`));
        } catch (e) {
            ui.logUpdate.clear();
            console.error(chalk.red(`\nAn unexpected error occurred during scraping: ${e.message}`));
        }
        const prompt = ui.buildPrompt(appState.currentUser);
        ui.redisplayPrompt(prompt);
    };

    if (fs.existsSync(FILE_PATH) && fs.readFileSync(FILE_PATH, 'utf8').length > 0) {
        const answer = await ui.question(chalk.yellow(`\nWarning: '${FILE_PATH}' is not empty and will be overwritten. Continue? (y/n): `));
        if (answer.trim().toLowerCase() === 'y') {
            await start();
        } else {
            console.log(chalk.red("\nScraping cancelled by user."));
            const prompt = ui.buildPrompt(appState.currentUser);
            ui.redisplayPrompt(prompt);
        }
    } else {
        await start();
    }
}

async function handleCalculation() {
    await ui.loading("Calculating totals...", 1000);
    const { total, transactions } = calculateTotal();
    const finalTotal = total - nonCash;
    console.log(chalk.greenBright("\n--- Calculation Results ---"));
    console.log(chalk.green("Total Transactions Found:"), chalk.white(transactions.length));
    console.log(chalk.green("Total Transaction Amount: Rp"), chalk.white(total.toLocaleString("id-ID")));
    console.log(chalk.green("Non-Cash Amount: Rp"), chalk.white(nonCash.toLocaleString("id-ID")));
    console.log(chalk.gray("---------------------------"));
    console.log(chalk.green.bold("Final Total (Cash): Rp"), chalk.white.bold(finalTotal.toLocaleString("id-ID")));
    const prompt = ui.buildPrompt(appState.currentUser);
    ui.redisplayPrompt(prompt);
}

async function handleNonCashInput() {
    const answer = await ui.question(chalk.yellow("\nEnter Non-Cash Amount : "));
    const val = parseFloat(answer.replace(/[.,]/g, ''));
    if (!isNaN(val) && val >= 0) {
        nonCash = val;
        console.log(chalk.green(`[INFO] Non-cash amount set to: Rp ${nonCash.toLocaleString("id-ID")}}`));
    } else {
        console.log(chalk.red("[ERROR] Invalid amount. Please enter a valid number."));
    }
    const prompt = ui.buildPrompt(appState.currentUser);
    ui.redisplayPrompt(prompt);
}

function handleDataCheck() {
    const dataFilePath = path.join(__dirname, '..', FILE_PATH);
    if (fs.existsSync(dataFilePath)) {
        console.log(chalk.green(`\nOpening data file in new window: ${FILE_PATH}`));
        // Re-use the log window function for a consistent experience
        ui.openLogWindow(dataFilePath); 
    } else {
        console.log(chalk.red(`\n[ERROR] Data file '${FILE_PATH}' does not exist.`));
    }
    const prompt = ui.buildPrompt(appState.currentUser);
    ui.redisplayPrompt(prompt);
}

async function handleExit() {
    const answer = await ui.question(chalk.red("\nAre you sure you want to quit? (y/n): "));
    if (answer.trim().toLowerCase() === "y") {
        console.log(chalk.green("\nExiting application..."));
        if (appState.browser) await appState.browser.close();
        ui.rl.close();
    } else {
        console.log(chalk.gray("\n[CANCEL] Exit cancelled."));
        const prompt = ui.buildPrompt(appState.currentUser);
        ui.redisplayPrompt(prompt);
    }
}

/**
 * Main application entry point.
 */
async function startApp() {
    try {
        const { browser, page } = await browserManager.launchBrowserAndSetup();
        appState.browser = browser;
        appState.page = page;
        appState.isLoggedIn = true;

        const { currentUser, totalScrapablePages } = await browserManager.updateStateFromPage(page);
        appState.currentUser = currentUser;
        appState.totalScrapablePages = totalScrapablePages;

        await ui.showMainMenu({ ...appState, currentUrl: page.url() });
        startPromptLoop();
        
        const initialPrompt = ui.buildPrompt(appState.currentUser);
        ui.redisplayPrompt(initialPrompt);

    } catch (error) {
        console.error(chalk.red("\n A critical error occurred:"), error);
        if (appState.browser) await appState.browser.close();
        process.exit(1);
    }
}

module.exports = { startApp };
