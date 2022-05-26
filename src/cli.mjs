#!/usr/bin/env node
/*
 * Datona cli main file. 
 *
 * use --help for usage information
 *
 */

// Modules
import Commander from 'commander';
import datona from 'datona-lib';
import tools from './modules/bubble/bubble-tools.mjs';
import wallet from "./modules/wallet/wallet.mjs";
import StringUtils from './utils/string-utils.mjs';
import './utils/log.js';

import WalletTools from './modules/wallet/wallet-tools.mjs';
import AddressTools from './modules/address-book/address-tools.mjs';
import BubbleTools from './modules/bubble/bubble-tools.mjs';
import BlockchainTools from './modules/blockchain/blockchain-tools.mjs';
import NFTTools from './modules/nft/nft-tools.mjs';
import DIDTools from './modules/did/did-tools.mjs';
import CryptoTools from './modules/crypto/crypto-tools.mjs';
import ImageTools from './modules/image/image-tools.mjs';

// Constants
const program = new Commander.Command("bubble");

// MAIN

program
	.version('0.1.1-alpha')
	.usage('<command> [options] [args]   # Try datona <command> --help')
	.option('-v, --verbose', 'trace and debug output')
	.parse(process.argv);

if (program.opts().verbose) {
	console.enable("trace")
	console.enable("debug")
}

WalletTools.registerCommands(program, exitWithError);
AddressTools.registerCommands(program, exitWithError);
BubbleTools.registerCommands(program, exitWithError);
BlockchainTools.registerCommands(program, exitWithError);
DIDTools.registerCommands(program, exitWithError);
CryptoTools.registerCommands(program, exitWithError);
ImageTools.registerCommands(program, exitWithError);
NFTTools.registerCommands(program, exitWithError);

// GETREQUEST Command
program
	.command('connectToBubble')
	.description('returns the request to paste into your Bubble Dashboard to connect this app to your bubble')
	.action(function(){
		const key = wallet.hasApplicationKey() ? wallet.getApplicationKey() : wallet.createApplicationKey();
		if (key) {
			const publicKeyB58 = StringUtils.hexToBase58(datona.crypto.uint8ArrayToHex(key.publicKey));
			console.log("Paste the following request into your Bubble Dashboard:");
			console.log("WcUuFpWX1qTB3VrgHnECFr7c6Xc1YnQZAoZQPW5YenzF5CvjrHFDQkwHzvrsKRsiQkXJ3v2yR6tBWwk48cTK6eoBRx4aCWBn3mykepqKLSPMG35bEhjW9uVFi1pxkhzAoDSWNTEoSDTQpUN6He8cXgyV5gZgHXNgwceQNXxQuK5BApcLjvupHCRtFqcFr4jGWeeBoi9BcB2NFnUhWJUHStkoNocZVHy9zFpm&publicKey="+publicKeyB58);
		}
	});

// CATCH ALL
program
  .on('command:*', function () {
  console.error('Invalid command.\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
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

