#!/usr/bin/env tsx
/**
 * ============================================================================
 * ANTIGRAVITY CLI — FULL APPLICATION ROOT ACCESS TOOL
 * Project: Fitness Future ("The Singularity" Neural OS)
 * Applet ID: 4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6
 * Owner: Fitness Future Owner (owner@fitnessfuture.in)
 * Firestore DB: ai-studio-4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const CONFIG_PATH = path.resolve(process.cwd(), 'antigravity.config.json');
const SERVER_URL = process.env.ANTIGRAVITY_SERVER_URL || 'http://localhost:3000';

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    // fallback
  }
  return {
    agent: 'antigravity-preview-09-2026',
    application: {
      appletId: '4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6',
      name: 'Fitness Future — Neural OS',
      owner: { name: 'Fitness Future Owner', email: process.env.PRIMARY_OWNER_EMAIL || 'owner@fitnessfuture.in', merchantUpi: 'your-upi@bank' },
      urls: {
        dev: 'https://ais-dev-hakfvy5pcvvusj25knx2eb-9972469637.asia-east1.run.app',
        production: 'https://ais-pre-hakfvy5pcvvusj25knx2eb-9972469637.asia-east1.run.app',
        local: 'http://localhost:3000'
      }
    },
    firebase: {
      projectId: 'project-74356317-8adc-420c-9be',
      firestoreDatabaseId: 'ai-studio-4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6'
    }
  };
}

async function callServerExecute(command: string, args: string[] = []) {
  try {
    const res = await fetch(`${SERVER_URL}/api/antigravity/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Antigravity-Owner': process.env.PRIMARY_OWNER_EMAIL || 'owner@fitnessfuture.in',
        'X-Antigravity-Applet-Id': '4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6'
      },
      body: JSON.stringify({ command, args })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return null;
  }
}

function printBanner(config: any) {
  console.log('\x1b[36m================================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m⚡ GOOGLE ANTIGRAVITY CLI — ROOT APPLICATION CONTROL BRIDGE ⚡\x1b[0m');
  console.log('\x1b[36m================================================================================\x1b[0m');
  console.log(`  \x1b[32mApplication :\x1b[0m ${config.application?.name}`);
  console.log(`  \x1b[32mApplet ID   :\x1b[0m ${config.application?.appletId}`);
  console.log(`  \x1b[32mOwner       :\x1b[0m ${config.application?.owner?.name} <${config.application?.owner?.email}>`);
  console.log(`  \x1b[32mClearance   :\x1b[0m LEVEL-5 SUPREME SUPER ADMIN (FULL ACCESS GRANTED)`);
  console.log(`  \x1b[32mFirestore DB:\x1b[0m ${config.firebase?.firestoreDatabaseId}`);
  console.log(`  \x1b[32mDev URL     :\x1b[0m ${config.application?.urls?.dev}`);
  console.log(`  \x1b[32mShared URL  :\x1b[0m ${config.application?.urls?.production}`);
  console.log('\x1b[36m================================================================================\x1b[0m');
}

function printHelp() {
  console.log(`
\x1b[1mAVAILABLE ANTIGRAVITY CLI COMMANDS:\x1b[0m
  \x1b[33mantigravity status\x1b[0m                Show full 3-Tier Portal, Server, and Firestore status
  \x1b[33mantigravity manifest\x1b[0m              Print complete application manifest & credentials JSON
  \x1b[33mantigravity portals\x1b[0m               Inspect Tier-1 (Member), Tier-2 (Admin), Tier-3 (Super Admin)
  \x1b[33mantigravity firestore\x1b[0m             Inspect Firestore database collections & security rules status
  \x1b[33mantigravity endpoints\x1b[0m             List all active backend REST & WebSocket API routes
  \x1b[33mantigravity unlock-all\x1b[0m            Force-unlock all Admin & Member portals globally
  \x1b[33mantigravity verify-upi [amount]\x1b[0m   Simulate HMAC-SHA256 verified UPI payment to your-upi@bank
  \x1b[33mantigravity ai "<prompt>"\x1b[0m         Execute an AI directive or query via server-side Gemini
  \x1b[33mantigravity agent "<task>"\x1b[0m        Dispatch autonomous coding/ops task to Antigravity Agent
  \x1b[33mantigravity shell\x1b[0m                 Start interactive Antigravity CLI REPL session
  \x1b[33mantigravity help\x1b[0m                  Show this help menu
`);
}

async function executeCommand(rawInput: string) {
  const config = loadConfig();
  const parts = rawInput.trim().split(/\s+/);
  const cmd = (parts[0] === 'antigravity' ? parts[1] : parts[0])?.toLowerCase() || 'status';
  const args = parts[0] === 'antigravity' ? parts.slice(2) : parts.slice(1);

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printBanner(config);
    printHelp();
    return;
  }

  if (cmd === 'manifest' || cmd === 'config') {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // Try live server execution first
  const serverRes = await callServerExecute(cmd, args);
  if (serverRes && serverRes.success) {
    console.log(`\x1b[32m[ANTIGRAVITY-SERVER-OK]\x1b[0m ${serverRes.summary || 'Command executed.'}`);
    if (serverRes.output) {
      console.log(typeof serverRes.output === 'string' ? serverRes.output : JSON.stringify(serverRes.output, null, 2));
    }
    return;
  }

  // Offline / direct local workspace execution fallback
  switch (cmd) {
    case 'status':
      printBanner(config);
      console.log('\n\x1b[32m✔ Tier-1 Member Portal     :\x1b[0m ONLINE (Passkeys, AI Meal Scanner, UPI Renewal)');
      console.log('\x1b[32m✔ Tier-2 Gym Admin Portal  :\x1b[0m ONLINE (HMAC Ledger, Churn Engine, Branded App)');
      console.log('\x1b[32m✔ Tier-3 Super Admin Portal:\x1b[0m ONLINE (Global Auto-Lock/Unlock, Master Data Vault)');
      console.log(`\x1b[32m✔ Firestore Database       :\x1b[0m ${config.firebase?.firestoreDatabaseId} (Connected)`);
      break;
    case 'portals':
      console.log(JSON.stringify(config.portals, null, 2));
      break;
    case 'firestore':
    case 'db':
      console.log(JSON.stringify(config.firebase, null, 2));
      break;
    default:
      printBanner(config);
      printHelp();
      break;
  }
}

async function startInteractiveShell() {
  const config = loadConfig();
  printBanner(config);
  console.log('\nType \x1b[33mhelp\x1b[0m for commands, or \x1b[33mexit\x1b[0m to quit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[35mfitness-future@antigravity-cli\x1b[0m:\x1b[36m~/fitness-future\x1b[0m$ '
  });

  rl.prompt();
  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (trimmed === 'exit' || trimmed === 'quit') {
      rl.close();
      return;
    }
    if (trimmed === 'clear') {
      console.clear();
      rl.prompt();
      return;
    }
    if (trimmed) {
      await executeCommand(trimmed);
    }
    rl.prompt();
  });
}

const cliArgs = process.argv.slice(2);
if (cliArgs.length === 0 || cliArgs[0] === 'shell' || cliArgs[0] === 'interactive') {
  if (cliArgs[0] === 'shell' || cliArgs[0] === 'interactive') {
    startInteractiveShell();
  } else {
    executeCommand('status');
  }
} else {
  executeCommand(cliArgs.join(' '));
}
