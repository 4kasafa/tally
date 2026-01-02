// tally.cjs
const fs = require("fs");
const readline = require("readline");
const { exec } = require("child_process");
const os = require("os");
const chalk = require("chalk");
const figlet = require("figlet");

const FILE_PATH = "src/data/pastehere.txt";
const PIN = "2308";

let nonCash = 0;
let retur = 0;
let showMenuOnNext = true;
let watcher = null;

/* ======== Utilities ======== */
function exitAndCloseTerminal() {
  const platform = os.platform();

  if (platform === "win32") {
    // Tutup jendela cmd/powershell
    exec("taskkill /IM cmd.exe /F & taskkill /IM powershell.exe /F");
  } else if (platform === "darwin") {
    // Tutup Terminal di Mac
    exec("osascript -e 'tell application \"Terminal\" to close first window' -e 'tell application \"Terminal\" to quit'");
  } else {
    // Linux (xdg-terminal emulator biasanya gnome-terminal/konsole dll)
    exec("pkill -f gnome-terminal || pkill -f konsole || pkill -f xterm");
  }

  process.exit(0);
}

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function centerText(text) {
  const cols = process.stdout.columns || 80;
  const pad = Math.max(0, Math.floor((cols - stripAnsi(text).length) / 2));
  return " ".repeat(pad) + text;
}

function stripAnsi(str) {
  // simple ANSI stripper for length calculations
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function openFileDefault(path) {
  const platform = process.platform;
  const cmd = platform === "win32" ? `notepad "${path}"` : platform === "darwin" ? `open "${path}"` : `xdg-open "${path}"`;
  exec(cmd, (err) => {
    if (err) console.error(chalk.redBright("[ERR] Failed to open file:"), err.message);
  });
}

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

function resetData() {
  try {
    fs.writeFileSync(FILE_PATH, "", "utf8");
    nonCash = 0;
    retur = 0;
    if (watcher) {
      try { watcher.close(); } catch(e){}
    }
    console.log(chalk.red(chalk.bold("\n[RESET] Data has been reset.\n")));
    setTimeout(() => {
      showMenuOnNext = true;
    }, 1000); // slight delay to ensure prompt redraw
  } catch (err) {
    console.error(chalk.red("[ERR] Failed to reset:"), err.message);
  }
}

function monitorFile() {
  openFileDefault(FILE_PATH);
  if (watcher) {
    console.log(chalk.gray("[INFO] Watcher already active."));
    return;
  }
  try {
    watcher = fs.watch(FILE_PATH, (eventType) => {
      if (eventType === "change") {
        console.log(chalk.greenBright("\n[LOG] File changed — new data saved."));
        promptIfNeeded(); // re-draw prompt/status
      }
    });
    console.log(chalk.gray("[INFO] Monitoring file — type 'exit' to quit."));
  } catch (err) {
    console.error(chalk.red("[ERR] Cannot monitor file:"), err.message);
  }
}

/* hacking-style loader */
function loading(text, cb) {
  const chars = ["|", "/", "-", "\\"];
  let i = 0;
  const t = setInterval(() => {
    process.stdout.write(`\r${chalk.bold.green(text)} ${chars[i++]}`);
    i %= chars.length;
  }, 100);

  setTimeout(() => {
    clearInterval(t);
    process.stdout.write("\r");
    cb && cb();
  }, 700);
}

/* ======== Enhanced Banner & Menu UI ======== */
function renderBannerLines() {
  const raw = figlet.textSync("TALLY", { horizontalLayout: "full" });
  const lines = raw.split("\n");

  // buat tagline + .cjs dengan warna berbeda
  const tagline =
    chalk.gray("A Minimal CLI Tally Tool │ Code by KV7  •  ") + chalk.yellow.bold(".cjs");

  lines.push("");       // baris kosong
  lines.push(tagline);  // tagline + ekstensi kuning

  return lines.map((l, idx) => {
    // ASCII banner: baris bergantian hijau tebal & hijau normal
    if (idx < lines.length - 1) {
      return idx % 2 === 0 ? chalk.green.bold(l) : chalk.green(l);
    }
    return l; // tagline sudah diwarnai sendiri
  });
}


function showAnimatedBannerSync() {
  // We'll print lines with a short synchronous-ish delay using a simple loop + setTimeout chain
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
  console.log(centerText(chalk.yellow("│" + pad(chalk.bold(" MENU ")) + "│")));
  const rows = [
    chalk.cyan("1") + chalk.gray(".") + " Open file (input)        " + chalk.dim("-> opens default editor & watches file"),
    chalk.cyan("2") + chalk.gray(".") + " Calculate totals         " + chalk.dim("-> count & sum transactions"),
    chalk.cyan("3") + chalk.gray(".") + " Input non cash           " + chalk.dim("-> sets non-cash amount"),
    chalk.cyan("4") + chalk.gray(".") + " Input retur              " + chalk.dim("-> adds retur amount"),
    chalk.cyan("5") + chalk.gray(".") + " Reset data               " + chalk.dim("-> clears data & re-shows menu"),
    chalk.cyan("6") + chalk.gray(".") + " Exit                     " + chalk.dim("-> quit program"),
    chalk.white("help / h / ?") + "                " + chalk.dim("-> show this menu"),
  ];
  rows.forEach((r) => {
    console.log(centerText(chalk.yellow("│") + pad(r) + chalk.yellow("│")));
  });
  console.log(centerText(chalk.yellow(bottom)));
  console.log("");
  console.log(centerText(chalk.dim("Tip: After a command, prompt appears. You can type command number or word, then Enter.")));
  console.log("");
}

function showMenuOnce() {
  clearScreen();
  return showAnimatedBannerSync().then(() => {
    console.log(""); // spacer
    drawMenuBox();
  });
}

/* ======== Prompt Design ======== */
function buildPrompt() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  const user = process.env.USER || process.env.USERNAME || "user";
  const watchState = watcher ? chalk.green("ON") : chalk.red("OFF");

  return (
    chalk.gray("[") +
    chalk.cyan(time) +
    chalk.gray("] ") +
    chalk.yellow(`[${user}] `) +
    chalk.white.bold("» ")
  );
}

/* ======== Readline loop (single rl instance) ======== */
function startPromptLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
  });

  function statusLine() {
    const state = watcher ? chalk.green("Watcher: ON") : chalk.gray("Watcher: OFF");
    const hint = chalk.dim("  (type 'help' to show menu)");
    const text = centerText(state + hint);
    // print status on its own line above prompt
    process.stdout.write("\n" + text + "\n");
  }

  function maybeShowMenuThenPrompt() {
    if (showMenuOnNext) {
      showMenuOnNext = false;
      // show animated banner + menu, then prompt
      showMenuOnce().then(() => {
        statusLine();
        rl.setPrompt(buildPrompt());
        rl.prompt();
      });
    } else {
      statusLine();
      rl.prompt();
    }
  }

  global.promptIfNeeded = maybeShowMenuThenPrompt;

  rl.on("line", (line) => {
    const cmd = line.trim().toLowerCase();

    if (cmd === "") {
      rl.prompt();
      return;
    }

    if (["1", "input", "open"].includes(cmd)) {
      loading("Opening file...", () => {
        monitorFile();
        maybeShowMenuThenPrompt();
      });
    } else if (["2", "calculate", "calc"].includes(cmd)) {
      watcher = null; // stop watcher to avoid double logs during calc
      loading("Calculating totals...", () => {
        const { total, transactions } = calculateTotal();
        const totalWithoutNonCash = total - nonCash - retur;
        console.log("");
        console.log(chalk.greenBright("Transactions count:"), chalk.white(transactions.length));
        console.log(chalk.greenBright("Total sales: Rp"), chalk.white(total.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        console.log(chalk.greenBright("Non-cash amount: Rp"), chalk.white(nonCash.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        console.log(chalk.greenBright("Retur amount: Rp"), chalk.white(retur.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        console.log(chalk.gray("—".repeat(30)));
        console.log(chalk.greenBright("Total : Rp"), chalk.white(totalWithoutNonCash.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        console.log("");
        maybeShowMenuThenPrompt();
      });
    } else if (["5", "reset"].includes(cmd)) {
      rl.question(chalk.red("Are you sure? (y/n): "), (ans) => {
        if (ans.trim().toLowerCase() === "y") {
          resetData();
        } else {
          console.log(chalk.gray("[CANCEL] Reset cancelled."));
        }
        maybeShowMenuThenPrompt();
      });
    } else if (["3", "debit"].includes(cmd)) {
      rl.question(chalk.yellow("Enter non-cash amount (or leave empty for 0): "), (ans) => {
        const val = parseFloat(ans.replace(/,/g, ""));
        if (!isNaN(val) && val >= 0) {
          nonCash = val;
          console.log(chalk.greenBright("[INFO] Non-cash amount set to: RP"), chalk.white(nonCash.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        } else {
          nonCash = 0;
          console.log(chalk.gray("[INFO] Non-cash amount reset to 0."));
        }
        maybeShowMenuThenPrompt();
      });
    } else if (["4", "retur"].includes(cmd)) {
      rl.question(chalk.yellow("Enter retur amount (or leave empty for 0): "), (ans) => {
        const val = parseFloat(ans.replace(/,/g, ""));
        if (!isNaN(val) && val >= 0) {
          retur += val;
          console.log(chalk.greenBright("[INFO] Retur amount added: RP"), chalk.white(retur.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        } else {
          retur = 0;
          console.log(chalk.gray("[INFO] Retur amount reset to 0."));
        }
        maybeShowMenuThenPrompt();
      });
    } else if (["6", "exit", "quit"].includes(cmd)) {
      rl.question(chalk.red("Are you sure wanna quit the program? (y/n): "), (ans) => {
        if (ans.trim().toLowerCase() === "y") {
          console.log(chalk.green("Exiting..."));
          if (watcher) try { watcher.close(); } catch(e){}
          rl.close();
          exitAndCloseTerminal();
        } else {
          console.log(chalk.gray("[CANCEL] Cancelled."));
        }
        maybeShowMenuThenPrompt();
      });
      ;
    } else if (["help", "h", "?"].includes(cmd)) {
      // show menu immediately (but do not change showMenuOnNext)
      showMenuOnce().then(() => {
        maybeShowMenuThenPrompt();
      });
    } else {
      console.log(chalk.red("Unknown command — type 'help' to see available commands."));
      maybeShowMenuThenPrompt();
    }
  });

  rl.on("close", () => {
    console.log(chalk.dim("Goodbye."));
  });

  // initial prompt/menu
  maybeShowMenuThenPrompt();
}

/* ======== Auth & Main ======== */
function askQuestion(promptText) {
  return new Promise((resolve) => {
    const rlq = readline.createInterface({ input: process.stdin, output: process.stdout });
    rlq.question(promptText, (ans) => {
      rlq.close();
      resolve(ans);
    });
  });
}

async function main() {
  clearScreen();
  /* show a small "WHO ARE YOU?" header using figlet
  const who = figlet.textSync("WHO ARE YOU?", { horizontalLayout: "full" });
  console.log(chalk.green(who));
  const pin = await askQuestion(chalk.yellow("pass: "));
  if (pin !== PIN) {
    console.log(chalk.red("Invalid password!"));
    */
  // show menu first time
  showMenuOnNext = true;
  startPromptLoop();
}

main();
