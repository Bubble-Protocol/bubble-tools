#!/usr/bin/env node
/*
 * Datona cli main file.  Provides
 *
 * use --help for usage information
 *
 */

// Modules
import Commander from 'commander';
import datona from 'datona-lib';
import tools from './utils/bubble-tools.mjs';
import ImageUtils from './utils/image-utils.mjs';
import StringUtils from './utils/string-utils.mjs';

import './utils/log.js';
import { generateMintInvitation } from './utils/nft-tools.mjs';

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

// GETREQUEST Command
program
	.command('connectToBubble')
	.description('returns the request to paste into your Bubble Dashboard to connect this app to your bubble')
	.action(function(){
		const key = tools.wallet.hasApplicationKey() ? tools.wallet.getApplicationKey() : tools.wallet.createApplicationKey();
		if (key) {
			const publicKeyB58 = StringUtils.hexToBase58(datona.crypto.uint8ArrayToHex(key.publicKey));
			console.log("Paste the following request into your Bubble Dashboard:");
			console.log("WcUuFpWX1qTB3VrgHnECFr7c6Xc1YnQZAoZQPW5YenzF5CvjrHFDQkwHzvrsKRsiQkXJ3v2yR6tBWwk48cTK6eoBRx4aCWBn3mykepqKLSPMG35bEhjW9uVFi1pxkhzAoDSWNTEoSDTQpUN6He8cXgyV5gZgHXNgwceQNXxQuK5BApcLjvupHCRtFqcFr4jGWeeBoi9BcB2NFnUhWJUHStkoNocZVHy9zFpm&publicKey="+publicKeyB58);
		}
	});

// DID2ADDRESS Command
program
	.command('did2address <did>')
	.description('extracts the ethereum contract address from the given did')
	.action(function(did){
		console.log(tools.didToAddress(did));
	});

// ADDRESS2DID Command
program
	.command('address2did <address>')
	.description('generates a plain DID for the given ethereum address')
	.action(function(address){
		console.log(tools.addressToDid(address));
	});

// CREATEBUBBLEURL Command
program
	.command('createBubbleUrl <contractAddress> <vaultUrl> <vaultId> <file>')
	.description('generates a bubble url given the contract address and vault server information')
	.action(function(contractAddress, vaultUrl, vaultId, file){
		console.log(tools.createBubbleUrl(contractAddress, vaultUrl, vaultId, file));
	});

// SDACFILEHASH Command
program
	.command('sdacFileHash <contractAddress> <file>')
	.description('generates a plain DID for the given ethereum address')
	.action(function(contractAddress, file){
		console.log(tools.sdacFileHash(contractAddress, file));
	});

// HASH Command
program
	.command('hash <data>')
	.description('returns the keccak256 hash of the given string')
	.action(function(data){
		console.log('0x'+datona.crypto.hash(data));
	});

// FILEHASH Command
program
	.command('fileHash <data>')
	.description('returns the 20-byte address generated from the keccak256 hash of the given string i.e. the last 20-bytes of keccak256(data)')
	.action(function(data){
		console.log(tools.toChecksumAddress(datona.crypto.hash(data).substring(24)));
	});

// PUBLICKEYTOADDRESS Command
program
	.command('publicKeyToAddress <publicKey>')
	.description('returns the 20-byte address generated from the given 32-byte publicKey')
	.action(function(publicKey){
		if (publicKey && publicKey.substring(0,2) === '0x') publicKey = publicKey.substring(2);
		console.log(datona.crypto.publicKeyToAddress(datona.crypto.hexToUint8Array(publicKey)));
	});

// PUBLICKEYTOADDRESS Command
program
	.command('toChecksumAddress <address>')
	.description('returns the given address with uppercase checksum')
	.action(function(address){
		console.log(tools.toChecksumAddress(address));
	});

// FROMBASE58 Command
program
	.command('fromBase58 <data>')
	.description('returns the base-58 decoded string')
	.action(function(data){
		console.log(StringUtils.base58ToString(data));
	});

// TOBASE58 Command
program
	.command('toBase58 <data>')
	.description('returns the base-58 encoded string')
	.action(function(data){
		console.log(StringUtils.stringToBase58(data));
	});

// IMAGETOBASE64 Command
program
	.command('imageToBase64 <file>')
	.description('returns the base-64 encoded representation of the given image file')
	.action(function(file){
		ImageUtils.imageFileToBase64(file)
			.then(result => {
				console.log(result);
			})
			.catch(exitWithError)
	});

// SERVERS Command
program
	.command('servers')
	.description('lists the vault servers that can be used with the --server option')
	.action(function(){
		try{ 
			const servers = tools.vaultServerConfig.getServers();
			const colWidth = servers.reduce((max,s) => s.label.length > max ? s.label.length : max, 0);
			servers.forEach(s => {
				console.log(s.label+' '.repeat(colWidth-s.label.length)+'\t'+s.id+'\t'+s.url);
			})
		}
		catch(error) { exitWithError(error) }
	});

// ADDSERVER Command
program
	.command('servers.add <label> <url> <id>')
	.description('adds the given server so that it can be used with the --server option.  Label must be unique.')
	.action(function(label, url, id){
		try{
			tools.vaultServerConfig.addServer(label, url, id)
		}
		catch(error) { exitWithError(error) }
	});

// REMOVESERVER Command
program
	.command('servers.remove <label>')
	.description('removes the given server from the saved servers')
	.action(function(label){
		try{
			tools.vaultServerConfig.removeServer(label)
		}
		catch(error) { exitWithError(error) }
	});

// ADDRESSES Command
program
	.command('addresses')
	.description('displays the address book')
	.action(function(){
		try{ 
			const addresses = tools.addressBook.getAddressBook();
			const colWidth = addresses.reduce((max,a) => a.label.length > max ? a.label.length : max, 0);
			addresses.forEach(a => {
				console.log(a.label+' '.repeat(colWidth-a.label.length)+'\t'+a.address+'\t'+(a.memo || ''));
			})
		}
		catch(error) { exitWithError(error) }
	});

// ADDADDRESS Command
program
	.command('addresses.add <label> <address> [memo]')
	.description('adds the given address to the address book.  Label must be unique')
	.action(function(label, address, memo){
		try{
			tools.addressBook.addAddress(label, address, memo)
		}
		catch(error) { exitWithError(error) }
	});

// REMOVEADDRESS Command
program
	.command('addresses.remove <label>')
	.description('removes the given address from the address book')
	.action(function(label){
		try{
			tools.addressBook.removeAddress(label)
		}
		catch(error) { exitWithError(error) }
	});

// CREATEVAULT Command
program
	.command('vault.create <server> <contract>')
	.description("creates a vault on the given vault server controlled by the given smart data access contract.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract can be an address book label or an Ethereum address." )
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.action(function(server, contract, options){
		try{
			tools.vault.createVault(server, contract, options)
				.then(console.log)
				.catch(exitWithError);
		}
		catch(error) { exitWithError(error) }
	});

// DELETEVAULT Command
program
	.command('vault.deleteVault <server> <contract>')
	.description("deletes the given vault server controlled by the given smart data access contract.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract can be an address book label or an Ethereum address." )
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.action(function(server, contract, options){
		try{
			tools.vault.deleteVault(server, contract, options)
				.then(console.log)
				.catch(exitWithError);
		}
		catch(error) { exitWithError(error) }
	});

// READVAULT Command
program
	.command('vault.read <server> <contract> <filename>')
	.description("reads the given vault file and dumps the content to the console.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.action(function(server, contract, filename, options){
		try{
			tools.vault.readVault(server, contract, filename, options)
				.then(console.log)
				.catch(exitWithError);
		}
		catch(error) { exitWithError(error) }
	});

// WRITEVAULT Command
program
	.command('vault.write <server> <contract> <filename> [file]')
	.description("writes the given file (or data if using the --data option) to the given vault and filename.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
	.option('--data <string>', 'string data to write instead of a file')
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.action(function(server, contract, filename, file, options){
		try{
			tools.vault.writeVault(server, contract, filename, file, options)
				.then(console.log)
				.catch(exitWithError);
		}
		catch(error) { exitWithError(error) }
	});

// DELETEVAULTFILE Command
program
	.command('vault.delete <server> <contract> <filename>')
	.description("deletes the given file with the given vault and filename.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.action(function(server, contract, filename, file, options){
		try{
			tools.vault.deleteVaultFile(server, contract, filename, options)
				.then(console.log)
				.catch(exitWithError);
		}
		catch(error) { exitWithError(error) }
	});

// GENERATEMINTINVITATION Command
program
	.command('nft.mint-invite <contract> <series> <tokenId>')
	.description("generates an mintWithInvite packet for the Bubble NFT contract" )
	.option('-k, --key <key>', 'wallet key to use to sign the transaction')
	.option('-e, --expiry <expiryTime>', 'expiry duration in the form 12h (12 hours) or 7d (7days)')
	.action(function(contract, series, tokenId, options={}){
		try{
			console.log(generateMintInvitation(contract, series, tokenId, options));
		}
		catch(error) { exitWithError(error) }
	});

// GETKEY Command
program
	.command('wallet.list [label]')
	.description("lists the keys in your wallet and displays their public addresses" )
	.option('-p, --public-key', "display public key")
	.action(function(label, options){
		try{
			tools.wallet.listKeys(label, options.publicKey).forEach(key => {
				const publicKey = options.publicKey ? '\t'+key.publicKey : '';
				console.log(key.name+'\t'+key.address+publicKey);
			})
		}
		catch(error) { exitWithError(error) }
	});

// CREATEKEY Command
program
	.command('wallet.create <label> [privateKey]')
	.description("create a new private key with the given name.  If privateKey is not given then a new random key is created." )
	.action(function(label, privateKey){
		try{
			if (privateKey) tools.wallet.addApplicationKey(label, privateKey);
			else tools.wallet.createApplicationKey(label);
		}
		catch(error) { exitWithError(error) }
	});

// REMOVEKEY Command
program
	.command('wallet.remove <label>')
	.description("remove the private key with the given name" )
	.action(function(label){
		try{
			tools.wallet.removeApplicationKey(label);
		}
		catch(error) { exitWithError(error) }
	});

// SETDEFAULTKEY Command
program
	.command('wallet.setDefault <label>')
	.description("set the default key to the given wallet key" )
	.action(function(label){
		try{
			tools.wallet.setDefaultKey(label);
		}
		catch(error) { exitWithError(error) }
	});

// RESETDEFAULTKEY Command
program
	.command('wallet.resetDefault')
	.description("resets the default key to the initial application key created on install" )
	.action(function(){
		try{
			tools.wallet.resetDefaultKey();
		}
		catch(error) { exitWithError(error) }
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

