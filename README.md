# Tally Project

This project is a set of tools designed to speed up the process of calculating transaction totals from web tables. It consists of two main components:

1.  **Tally CLI Application**: A command-line interface built with Node.js to calculate and process numbers from text data.
2.  **"Table Scraper" Chrome Extension**: A simple browser extension to extract data from HTML tables and copy it to the clipboard.

The main goal is to automate the task of manually copying transaction data, pasting it somewhere, and calculating the total.

## Technologies

-   **CLI Application**: Node.js, Chalk, Figlet, Commander
-   **Chrome Extension**: JavaScript (ES6), HTML, CSS
-   **Main Language**: JavaScript (CommonJS on the backend, ES6 on the frontend)

## Features

### Tally CLI App
-   Interactive terminal UI with an easy-to-use menu.
-   Automatically monitors the input file (`src/data/pastehere.txt`) for changes.
-   Calculates the total sum from a list of transactions.
-   Allows for adding `non-cash` and `return` amounts to adjust the final total.
-   Attractive and colorful display using `chalk` and `figlet`.

### Table Scraper Extension
-   Scrapes all rows from a table on the active web page.
-   Copies the scraped data to the clipboard, ready to be pasted.
-   Ability to navigate table pages (previous/next).
-   Saves the last used filter value.

## How It Works

The intended workflow is as follows:

1.  **Open a Website**: Navigate to the web page containing the transaction table you want to calculate.
2.  **Scrape Data**: Click the "Table Scraper" extension icon in your browser. The table data will be copied to your clipboard.
3.  **Run the Tally App**: Open your terminal, navigate to the project directory, and run `npm start`.
4.  **Start Input**: In the Tally CLI menu, select option `1` (Input) to automatically open `pastehere.txt`.
5.  **Paste Data**: Paste the data from your clipboard into the `pastehere.txt` file and save it.
6.  **Calculate Total**: Return to the terminal. The application will detect the file change. Select option `2` (Calculate) to see the total sum and its details.

## Installation

### Prerequisites
-   [Node.js](https://nodejs.org/) (which includes npm)
-   A Chromium-based browser (like Google Chrome, Brave, or Edge)

### Steps

1.  **Clone the Repository**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd tally
    ```

2.  **Install Node.js Dependencies**
    Run the following command in the project's root directory:
    ```bash
    npm install
    ```

3.  **Load the Chrome Extension**
    a. Open your Chrome browser and navigate to `chrome://extensions`.
    b. Enable "Developer mode" using the toggle switch in the top-right corner.
    c. Click the "Load unpacked" button.
    d. Select the `ext` folder from within your project directory.
    e. The "Table Scraper" extension will now appear in your list of extensions.

## Usage

1.  **Run the CLI App**
    To start the Tally application, run the following command in your terminal:
    ```bash
    npm start
    ```
    This will display the main menu in your terminal.

2.  **Use the Extension**
    - Navigate to a web page with a table.
    - Click the extension icon in your browser's toolbar.
    - Click the "Scrape" button to copy the table data.

3.  **Use the `pastehere.txt` File**
    After the data is copied, use the `input` option in the CLI to paste and save your data for processing.

## Project Structure

```
/
├── ext/                # Source code for the Chrome Extension
│   ├── content.js      # Script that interacts with the web page's DOM
│   ├── manifest.json   # Extension configuration file
│   └── popup.js        # Logic for the extension's popup UI
│
├── src/                # Source code for the Tally CLI Application
│   ├── tally.cjs       # Main script for the CLI app
│   └── data/
│       └── pastehere.txt # Input file for pasting data
│
├── package.json        # Node.js project dependencies and scripts
└── README.md           # This file
```