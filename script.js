/* Terminal boot animation + interactive shell for mikebird.tech */

const SITE_LAUNCH = Date.UTC(2024, 7, 18); // first commit: 2024-08-18
const PROMPT = "guest@mikebird:~$";

const LINKS = [
  { key: "schedule", name: "Schedule Meeting", icon: "📅", url: "https://cal.com/MikeBird" },
  { key: "podcast", name: "Tool Use Podcast", icon: "🎙️", url: "https://www.toolusepodcast.com/" },
  { key: "github", name: "GitHub", icon: "💻", url: "https://github.com/MikeBirdTech" },
  { key: "twitter", name: "Twitter", icon: "🐦", url: "https://x.com/MikeBirdTech" },
  { key: "linkedin", name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com/in/mikebirdtech/" },
  { key: "youtube", name: "YouTube", icon: "📺", url: "https://www.youtube.com/@MikeBirdTech/" },
];

const INFO_CARD = `
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║               MIKE BIRD                   ║
  ║                                           ║
  ║       Host @ Tool Use Podcast             ║
  ║     AI and Engineering Lead @ BoxOne      ║
  ║                                           ║
  ║     Helping you interface with the        ║
  ║              future of AI                 ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝`;

const uptimeDays = Math.max(1, Math.floor((Date.now() - SITE_LAUNCH) / 86400000));
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("uptime").textContent = uptimeDays;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -----------------------------------------
   BOOT ANIMATION
----------------------------------------- */
function startTerminalAnimation() {
  const content = document.querySelector(".terminal-content");
  content.classList.add("visible");

  const cmd1 = document.getElementById("cmd-1");
  const cmd2 = document.getElementById("cmd-2");

  if (reduceMotion) {
    document.getElementById("cursor-1").style.display = "none";
    document.getElementById("cursor-2").style.display = "none";
    finishBoot();
    return;
  }

  const elementsToHide = ["info-output", "prompt-2", "links-output", "final-prompt"];
  elementsToHide.forEach((id) => {
    const el = document.getElementById(id);
    el.style.visibility = "hidden";
    el.style.opacity = "0";
  });

  const cmd1Text = cmd1.textContent;
  const cmd2Text = cmd2.textContent;
  cmd1.textContent = "";
  cmd2.textContent = "";

  function typeText(element, text, speed, callback) {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }

  function blinkCursor(cursorId, times, callback) {
    const cursor = document.getElementById(cursorId);
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      cursor.style.opacity = cursor.style.opacity === "0" ? "1" : "0";
      blinkCount++;
      if (blinkCount >= times * 2) {
        clearInterval(blinkInterval);
        cursor.style.opacity = "1";
        if (callback) callback();
      }
    }, 500);
  }

  function showElement(id, delay, callback) {
    setTimeout(() => {
      const el = document.getElementById(id);
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.transition = "opacity 0.2s ease-in";
      if (callback) callback();
    }, delay);
  }

  blinkCursor("cursor-1", 1, () => {
    document.getElementById("cursor-1").style.display = "none";
    typeText(cmd1, cmd1Text, 30, () => {
      setTimeout(() => {
        showElement("info-output", 0);
        setTimeout(() => {
          showElement("prompt-2", 0);
          blinkCursor("cursor-2", 1, () => {
            document.getElementById("cursor-2").style.display = "none";
            typeText(cmd2, cmd2Text, 30, () => {
              setTimeout(() => {
                showElement("links-output", 0);
                setTimeout(() => showElement("final-prompt", 0, finishBoot), 200);
              }, 200);
            });
          });
        }, 500);
      }, 200);
    });
  });
}

function finishBoot() {
  document.getElementById("cursor-final").classList.add("blinking");
  initShell();
}

/* -----------------------------------------
   INTERACTIVE SHELL
----------------------------------------- */
function initShell() {
  const content = document.querySelector(".terminal-content");
  const promptLine = document.getElementById("final-prompt");
  const input = document.getElementById("shell-input");
  const typedEl = document.getElementById("typed");
  const history = [];
  let histIndex = 0;

  printHint("Type 'help' to explore this terminal.");

  function focusInput() {
    input.focus({ preventScroll: true });
  }

  document.querySelector(".terminal-body").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    if (window.getSelection().toString()) return;
    focusInput();
  });

  // A printable keypress anywhere routes to the shell input
  document.addEventListener("keydown", (e) => {
    if (document.activeElement === input) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length === 1) focusInput();
  });

  input.addEventListener("input", () => {
    typedEl.textContent = input.value;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = input.value;
      input.value = "";
      typedEl.textContent = "";
      run(value);
      histIndex = history.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIndex > 0) {
        histIndex--;
        input.value = history[histIndex];
        typedEl.textContent = input.value;
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex < history.length - 1) {
        histIndex++;
        input.value = history[histIndex];
      } else {
        histIndex = history.length;
        input.value = "";
      }
      typedEl.textContent = input.value;
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete();
    }
  });

  function autocomplete() {
    const parts = input.value.split(/\s+/);
    let candidates;
    if (parts.length <= 1) {
      candidates = Object.keys(COMMANDS).filter((c) => c.startsWith(parts[0] || ""));
    } else if (parts[0] === "open" || parts[0] === "cat") {
      const names =
        parts[0] === "open" ? LINKS.map((l) => l.key) : ["info.txt", ...LINKS.map((l) => "links/" + l.key)];
      candidates = names.filter((n) => n.startsWith(parts[parts.length - 1]));
    } else {
      return;
    }
    if (candidates.length === 1) {
      parts[parts.length - 1] = candidates[0];
      input.value = parts.join(" ") + (parts.length === 1 ? " " : "");
      typedEl.textContent = input.value;
    }
  }

  /* ---- output helpers (user text always via textContent) ---- */
  function insertBeforePrompt(el) {
    content.insertBefore(el, promptLine);
  }

  function echoCommand(text) {
    const line = document.createElement("div");
    line.className = "terminal-line";
    const p = document.createElement("span");
    p.className = "prompt";
    p.textContent = PROMPT;
    const c = document.createElement("span");
    c.className = "command";
    c.textContent = text;
    line.append(p, c);
    insertBeforePrompt(line);
  }

  function printText(text, className) {
    const out = document.createElement("div");
    out.className = "output shell-output";
    const pre = document.createElement("pre");
    if (className) pre.className = className;
    pre.textContent = text;
    out.append(pre);
    insertBeforePrompt(out);
  }

  function printHint(text) {
    printText(text, "dim");
  }

  function printLinkList(links) {
    const out = document.createElement("div");
    out.className = "output shell-output";
    const pre = document.createElement("pre");
    links.forEach((l) => {
      const row = document.createElement("span");
      row.textContent = `${l.icon}  `;
      const a = document.createElement("a");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = l.name;
      pre.append(row, a, document.createTextNode("\n"));
    });
    out.append(pre);
    insertBeforePrompt(out);
  }

  /* ---- commands ---- */
  const COMMANDS = {
    help() {
      printText(
        [
          "Available commands:",
          "",
          "  help              show this help",
          "  ls [dir]          list files (try: ls links/)",
          "  cat <file>        print a file (try: cat info.txt)",
          "  open <link>       open a link (try: open podcast)",
          "  whoami            who are you?",
          "  contact           how to reach Mike",
          "  neofetch          system info",
          "  history           command history",
          "  date              current date and time",
          "  uptime            how long this site has been up",
          "  echo <text>       say it back",
          "  clear             clear the screen",
        ].join("\n")
      );
    },

    ls(args) {
      const dir = args.find((a) => !a.startsWith("-")) || "";
      if (dir === "" || dir === ".") {
        printText("info.txt  links/");
      } else if (dir.replace(/\/$/, "") === "links") {
        printLinkList(LINKS);
      } else {
        printText(`ls: cannot access '${dir}': No such file or directory`);
      }
    },

    cat(args) {
      const file = args[0];
      if (!file) {
        printText("usage: cat <file>");
      } else if (file === "info.txt") {
        printText(INFO_CARD, "ascii");
      } else if (file.startsWith("links/")) {
        const link = LINKS.find((l) => l.key === file.slice(6).toLowerCase());
        if (link) printLinkList([link]);
        else printText(`cat: ${file}: No such file or directory`);
      } else {
        printText(`cat: ${file}: No such file or directory`);
      }
    },

    open(args) {
      const key = (args[0] || "").toLowerCase();
      const link = LINKS.find((l) => l.key === key);
      if (!link) {
        printText(`open: unknown link '${args[0] || ""}'\nTry one of: ${LINKS.map((l) => l.key).join(", ")}`);
        return;
      }
      printText(`Opening ${link.name}...`);
      window.open(link.url, "_blank", "noopener");
    },

    whoami() {
      printText("guest\n\nBut this is Mike Bird's terminal. Try 'cat info.txt' or 'contact'.");
    },

    contact() {
      printLinkList(LINKS.filter((l) => ["schedule", "twitter", "linkedin"].includes(l.key)));
      printHint("For collaborations or speaking engagements, reach out on any of the above.");
    },

    neofetch() {
      printText(
        [
          "        ▄▄▄▄▄▄        guest@mikebird",
          "      ▄█  ▄▄  █▄      ---------------",
          "     ██  ▀██▀  ██     Host: mikebird.tech",
          "     ██   ▀▀   ██     OS: MikeOS (phosphor edition)",
          "     ██ ▄▀  ▀▄ ██     Shell: guest-sh 1.0",
          "      ▀█▄▄▄▄▄▄█▀      Theme: green on black",
          "        ▀▀▀▀▀▀        Uptime: " + uptimeDays + " days",
          "                      Podcast: Tool Use (weekly)",
        ].join("\n"),
        "ascii"
      );
    },

    history() {
      printText(history.map((h, i) => String(i + 1).padStart(4) + "  " + h).join("\n") || "(empty)");
    },

    date() {
      printText(new Date().toString());
    },

    uptime() {
      printText(`up ${uptimeDays} days — no downtime, only vibes`);
    },

    echo(args) {
      printText(args.join(" "));
    },

    clear() {
      content.querySelectorAll(".terminal-line, .output").forEach((el) => {
        if (el !== promptLine) el.remove();
      });
    },

    sudo() {
      printText("guest is not in the sudoers file. This incident will be reported.");
    },

    rm(args) {
      if (args.includes("-rf") || args.includes("-fr")) {
        printText("rm: permission denied — nice try though.");
      } else {
        printText("rm: read-only filesystem");
      }
    },

    exit() {
      printText("logout\n...just kidding. There is no escape. Try 'open podcast' instead.");
    },

    pwd() {
      printText("/home/guest");
    },
  };

  function run(raw) {
    const text = raw.trim();
    echoCommand(raw);
    if (text) {
      history.push(text);
      const [cmd, ...args] = text.split(/\s+/);
      const fn = COMMANDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else printText(`${cmd}: command not found. Type 'help' for available commands.`);
    }
    promptLine.scrollIntoView({ block: "nearest" });
  }

  // Auto-focus on devices with a physical keyboard (skip touch to avoid popping the keyboard)
  if (!("ontouchstart" in window)) focusInput();
}

setTimeout(startTerminalAnimation, 100);
