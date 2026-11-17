# Touchline Manager

An original, single-player, offline-first football management game. Fictional clubs, players, interface and graphics; no copied assets, external libraries, fonts, accounts or APIs.

## Play locally

Open `index.html` in a modern browser. JavaScript and browser storage must be enabled. Direct `file://` storage behavior varies by browser, so for reliable persistence serve this directory over localhost (for example `python3 -m http.server 8000`) and open `http://localhost:8000/`. The game itself makes no network calls.

## GitHub Pages

Copy all game files (`index.html`, `style.css`, `engine.js`, `app.js`, `sw.js`) into a repository or its Pages source directory and enable GitHub Pages for that branch/folder. All references are relative, so project subpaths work. Tests and this README are optional for the site. On HTTPS or localhost, the service worker caches the game shell after the first successful online load; after it installs, subsequent launches and games can work without a connection. The initial visit needs connectivity. Browsers may clear caches/storage, and private mode may restrict persistence. A local file can still work offline without a service worker, subject to browser storage rules. To update the cached application when modifying files, increment the cache name in `sw.js` as part of each release; users need a connection to receive the update.

## How to play

- **Home:** play the next fixture, see your last result and cash flow, and reset your club (with confirmation).
- **Squad:** choose 4-3-1-2 (two CF and one SS), 4-4-2, 4-3-3 or 3-5-2, set a balanced, attacking or defensive tactic, and select any player in each slot. Selecting another starter swaps them; selecting a reserve replaces the starter. Formation changes keep the current slot order, so adjust poor role fits afterward.
- **Training:** three sessions per matchweek, at most one per player. Technical raises attack and defense by 2 at a 12-fitness cost; conditioning raises stamina by 3 at a 10-fitness cost; recovery restores 25 fitness, capped at 100. Skills cap at 99. Workouts cannot leave the player below 20 fitness. Sessions refresh after each match.
- **Market:** six deterministic prospects rotate every matchweek. The price is paid immediately and wages are added to your match payroll. Sign only when you can afford the fee; the squad cap is 20. No selling.
- **League:** six fictional teams play a 10-round home-and-away schedule. Match results use team attack and defense, position fit, stamina, fitness, tactic, home advantage and deterministic seeded chance; AI fixtures are simulated too. Starters tire, reserves recover, and fitness partially recovers after every game. Each game pays $75k plus $25k for a win or $12k for a draw, less all squad wages. Cash may become negative after wages, but you cannot buy without the fee. At season end, start the next season to collect a placement prize ($150k to $30k), reset fixtures and restore fitness while retaining your roster and cash.

The game uses fictional dollars shown in thousands (`$k`). A player's OVR is the rounded average of attack, defense and stamina; match strength additionally accounts for role fit and fitness. Match outcomes and market are reproducible for the same seed and game state, not live or connected to real football.

## Saves & privacy

The save is localStorage key `touchline-manager-v1` for the current browser and origin. It is not synchronized or backed up. Clearing site data, changing browsers/devices or resetting the club loses it. If browser storage is blocked or full, the game warns that progress may not save. Do not deploy public files containing secrets.

## Tests

Run `node test-engine.js` for nine dependency-free engine tests covering schedule, formation/lineup, training, transfers, strength, match results and season rollover. `python3 test-ui.py` additionally uses the Python Playwright package and `/usr/bin/chromium` to test a 390px mobile viewport, navigation, lineup, training, purchases, a match, table, persistence, offline reload and an offline match. Adapt the Chromium path if necessary. The game itself has no dependency on those test tools.

## Scope and limitations

This is a compact original management game, not a clone. Matches resolve instantly without live commentary, player substitutions, injuries, cups, multiplayer or animations. There is no player selling, custom club name, import/export, cloud sync or cross-device save. The browser determines offline cache/storage eviction. Physical phones, iOS Safari, screen readers and GitHub Pages hosting have not been independently tested; the automated mobile test uses desktop Chromium emulation. See the repository’s Pages deployment for the hosted version.
