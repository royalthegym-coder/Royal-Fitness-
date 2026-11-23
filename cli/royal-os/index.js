#!/usr/bin/env node

const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

yargs(hideBin(process.argv))
  .command('up', 'Start Fitness Future Neural OS', () => {}, (argv) => {
    console.log('Starting services...');
    execSync('docker-compose -f infra/docker-compose.yml up -d', { stdio: 'inherit' });
  })
  .command('down', 'Stop Fitness Future Neural OS', () => {}, (argv) => {
    console.log('Stopping services...');
    execSync('docker-compose -f infra/docker-compose.yml down', { stdio: 'inherit' });
  })
  .command('logs [service]', 'View logs', (yargs) => {
    return yargs.positional('service', {
      describe: 'Service name (optional)',
      type: 'string',
      default: ''
    });
  }, (argv) => {
    execSync(`docker-compose -f infra/docker-compose.yml logs -f ${argv.service}`, { stdio: 'inherit' });
  })
  .command('status', 'Check system status', () => {}, (argv) => {
    execSync('docker-compose -f infra/docker-compose.yml ps', { stdio: 'inherit' });
  })
  .command('antigravity [cmd..]', 'Execute Antigravity CLI full application control command', () => {}, (argv) => {
    const subArgs = Array.isArray(argv.cmd) ? argv.cmd.join(' ') : '';
    execSync(`npx tsx cli/antigravity.ts ${subArgs}`, { stdio: 'inherit' });
  })
  .demandCommand(1)
  .parse();
