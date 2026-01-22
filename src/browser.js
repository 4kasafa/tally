'use strict';
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const ui = require('./ui');

/**
 * Launches and configures a new Puppeteer browser instance.
 * It also handles the initial manual login flow.
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
 */
async function launchBrowserAndSetup() {
    ui.clearScreen();
    await ui.showAnimatedBannerSync();
    console.log(ui.centerText(chalk.yellow("\nLaunching browser...")));
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized', '--disable-features=TranslateUI,Translate'] });
    const page = (await browser.pages())[0] || await browser.newPage();
    
    console.log(ui.centerText(chalk.cyan("Please log in to https://pos.ketoko.co.id/")));
    console.log(ui.centerText(chalk.red.bold("NOTE: You must log in manually each time.")));
    await page.goto('https://pos.ketoko.co.id/login-form', { waitUntil: 'networkidle2' });
    
    while (page.url().includes('/login-form')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(ui.centerText(chalk.green.bold(`\nLogin detected! Navigating to kasir list...`)));
    await page.goto('https://pos.ketoko.co.id/kasirlistmode2', { waitUntil: 'networkidle2' });

    return { browser, page };
}

/**
 * Scrapes the current user name and total pages from the page.
 * @param {import('puppeteer').Page} page The Puppeteer page object.
 * @returns {Promise<{currentUser: string, totalScrapablePages: number|string}>}
 */
async function updateStateFromPage(page) {
    let currentUser = "Guest";
    let totalScrapablePages = 'N/A';
    try {
        await page.waitForSelector('.user-name', { timeout: 2000 });
        currentUser = await page.$eval('.user-name', el => el.textContent.trim());
    } catch (e) {
        // currentUser remains "Guest"
    }
    try {
        await page.waitForSelector('.imk-margin-lefttopbot', { timeout: 2000 });
        const pagesText = await page.$eval('.imk-margin-lefttopbot', el => el.textContent.trim());
        const match = pagesText.match(/Hal\s*\d+\s*\/\s*(\d+)/);
        if (match && match[1]) {
            totalScrapablePages = parseInt(match[1]);
        }
    } catch (e) {
        // totalScrapablePages remains 'N/A'
    }
    return { currentUser, totalScrapablePages };
}

module.exports = {
    launchBrowserAndSetup,
    updateStateFromPage
};
