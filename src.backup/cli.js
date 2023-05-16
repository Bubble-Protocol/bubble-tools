#!/usr/bin/env node
/*
 * Datona cli main file. 
 *
 * use --help for usage information
 *
 */

// Modules
import * as Commander from 'commander';
import './utils/log.js';
import WalletTools from './modules/wallet/wallet-tools.mjs';
import AddressTools from './modules/address-book/address-tools.mjs';
import BubbleTools from './modules/bubble/bubble-tools.mjs';
import BlockchainTools from './modules/blockchain/blockchain-tools.mjs';
import CryptoTools from './modules/crypto/crypto-tools.mjs';
import ImageTools from './modules/image/image-tools.mjs';
import UserModules from './modules/user-modules/user-modules.mjs';

// Constants
const program = new Commander.Command();

// MAIN

program
	.version('0.2.1-alpha')
	.usage('<command> [options] [args]   # Try bubble <command> --help')
	.option('-v, --verbose', 'trace and debug output')
	.parseOptions(process.argv);

if (program.opts().verbose) {
	console.enable("trace")
	console.enable("debug")
}

WalletTools.registerCommands(program, exitWithError);
AddressTools.registerCommands(program, exitWithError);
BubbleTools.registerCommands(program, exitWithError);
BlockchainTools.registerCommands(program, exitWithError);
await UserModules.registerCommands(program, exitWithError);

const utils = program
.command('utils')
.description("general utility functions" );

BubbleTools.registerUtils(utils, exitWithError);
CryptoTools.registerCommands(utils, exitWithError);
ImageTools.registerCommands(utils, exitWithError);


// CATCH ALL
program
  .on('command:*', function () {
  console.error('Invalid command.\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Configure help
utils.configureHelp({
  sortSubcommands: true
});

// PROCESS & RUN COMMAND
try{
  program.parse(process.argv);
}
catch(error) { exitWithError(error) }

if( process.argv.length < 3 ){ program.outputHelp(); }

function exitWithError(error) {
	if (program.opts().verbose) console.error(error);
	else console.error(error.toString());
	process.exit(1);
}

//-----------------------------------------------------------------------------

