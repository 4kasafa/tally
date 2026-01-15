// scraper.js
const chalk = require('chalk');

/**
 * An async generator that scrapes transaction data page by page up to a specified total.
 * It yields the data for each page as it becomes available.
 *
 * @param {puppeteer.Page} page - The Puppeteer page object to scrape.
 * @param {string} filterUser - The username to filter the transactions by.
 * @param {number} totalPages - The total number of pages to scrape.
 */
async function* scrapeTransactions(page, filterUser, totalPages) {
    // Selectors from ext/content.js
    const TABLE_SELECTOR = '.dx-datagrid-rowsview .dx-datagrid-table.dx-datagrid-table-fixed';
    const ROW_SELECTOR = 'tr.dx-data-row';
    const NEXT_BUTTON_SELECTOR = '.dx-icon-chevronright';

    for (let currentPageNum = 1; currentPageNum <= totalPages; currentPageNum++) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page content to be stable

            const tableExists = await page.$(TABLE_SELECTOR);
            if (!tableExists) {
                console.log(chalk.red(`\nTransaction table not found on page ${currentPageNum}. Stopping.`));
                break;
            }

            const pageResult = await page.evaluate((tableSelector, rowSelector, userFilter) => {
                let pageData = '';
                let linesFound = 0;
                const table = document.querySelector(tableSelector);
                if (!table) return { pageData, linesFound };

                const rows = table.querySelectorAll(rowSelector);
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const userCell = cells.length > 9 ? cells[9].innerText.trim() : '';

                    if (!userFilter || userCell === userFilter) {
                        const rowData = [];
                        for (let i = 1; i < cells.length; i++) {
                            rowData.push(cells[i].innerText.trim());
                        }
                        pageData += rowData.join('\t') + '\n';
                        linesFound++;
                    }
                });
                return { pageData, linesFound };
            }, TABLE_SELECTOR, ROW_SELECTOR, filterUser);

            yield { ...pageResult, pageNumber: currentPageNum };

            if (currentPageNum === totalPages) {
                break;
            }

            const nextButton = await page.$(NEXT_BUTTON_SELECTOR);
            if (nextButton) {
                await nextButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log(chalk.red(`\nCould not find 'next' button on page ${currentPageNum}. Stopping.`));
                break;
            }

        } catch (error) {
            console.log(chalk.red(`\nERROR: Scraping failed at page ${currentPageNum}: ${error.message}`));
            break;
        }
    }
}

module.exports = {
    scrapeTransactions,
};