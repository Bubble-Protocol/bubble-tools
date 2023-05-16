import { ContentId } from '@bubble-protocol/core';
import Web3 from 'web3';
import { appendBubble, createBubble, deleteBubble, deleteBubbleFile, getContentId, mkdirBubbleFile, listBubbleFile, readBubble, writeBubble, getPermissions } from './bubble.js';

function registerCommands(program, errorHandler) {

  const group = program
    .command('vault')
    .description("create and manage off-chain bubbles" );

  // CREATEBUBBLE Command
  group
  .command('create')
  .summary("creates a bubble")
  .description("creates a bubble on the given bubble server controlled by the given smart data access contract" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-s, --silent', 'do not throw if bubble already exists')
  .action(function(server, contract, options){
    try{
      createBubble(server, contract, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // DELETEBUBBLE Command
  group
  .command('delete-bubble')
  .summary("deletes a bubble")
  .description("deletes the given bubble server controlled by the given smart data access contract" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-s, --silent', 'do not throw if bubble does not exist')
  .action(function(server, contract, options){
    try{
      deleteBubble(server, contract, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // READBUBBLE Command
  group
  .command('read')
  .summary("reads a bubble file or lists a bubble directory")
  .description("reads the given bubble file and dumps the content to the console" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('<filename>', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-b, --binary <file>', 'treat output as binary (converts from base64) and write to the given file')
  .option('-s, --silent', 'do not throw if file does not exist')
  .action(function(server, contract, filename, options){
    try{
      readBubble(server, contract, filename, options)
        .then( result => { if (result) console.log(result) } )
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // WRITEBUBBLE Command
  group
  .command('write')
  .summary("writes a file or data to a bubble file or directory")
  .description("writes the given file (or data if using the --data option) to the given bubble and filename" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('<filename>', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .argument('[file]', "the file to write" )
  .option('-d --data <string>', 'string data to write instead of a file')
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-b, --binary', 'treat input file as binary (converts to base64)')
  .action(function(server, contract, filename, file, options){
    try{
      writeBubble(server, contract, filename, file, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // APPENDBUBBLE Command
  group
  .command('append')
  .summary("appends a file or data to a bubble file or directory")
  .description("appends the given file (or data if using the --data option) to the given bubble and filename" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('<filename>', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .argument('[file]', "the file to write" )
  .option('--data <string>', 'string data to write instead of a file')
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-b, --binary', 'treat input file as binary (converts to base64)')
  .action(function(server, contract, filename, file, options){
    try{
      appendBubble(server, contract, filename, file, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // DELETEBUBBLEFILE Command
  group
  .command('delete')
  .summary("deletes a bubble file")
  .description("deletes the given file with the given bubble and filename" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('<filename>', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-s, --silent', 'do not throw if file does not exist')
  .action(function(server, contract, filename, options){
    try{
      deleteBubbleFile(server, contract, filename, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // MKDIR Command
  group
  .command('mkdir')
  .summary("make directory")
  .description("mkdir the given directory in the given bubble" )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('<filename>', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-s, --silent', 'do not throw if directory already exists')
  .action(function(server, contract, filename, options){
    try{
      mkdirBubbleFile(server, contract, filename, options)
        .then(console.trace)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // LISTBUBBLEFILE Command
  group
  .command('list')
  .summary("list a bubble file or directory")
  .description("lists the given file or directory with the given bubble and filename. If the filename is missing the root path will be listed." )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('[filename]', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .option('-s, --silent', 'do not throw if file does not exist')
  .option('--before <before>', 'pass before option to server')
  .option('--after <after>', 'pass after option to server')
  .option('--createdBefore <createdBefore>', 'pass createdBefore option to server')
  .option('--createdAfter <createdAfter>', 'pass createdAfter option to server')
  .option('--long', 'pass long option to server')
  .option('--matches <matches>', 'pass matches option to server')
  .option('--dirOnly', 'pass directoryOnly option to server')
  .action(function(server, contract, filename, options){
    try{
      if (options.before) options.before = parseInt(options.before);
      if (options.after) options.after = parseInt(options.after);
      if (options.createdBefore) options.createdBefore = parseInt(options.createdBefore);
      if (options.createdAfter) options.createdAfter = parseInt(options.createdAfter);
      listBubbleFile(server, contract, filename, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // GETPERMISSONS Command
  group
  .command('permissions')
  .summary("calls the server's getPermissions api")
  .description("calls the server's getPermissions api returning the server's view of the bubble's smart contract getAccessPermissions." )
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('[filename]', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .action(function(server, contract, filename, options){
    try{
      getPermissions(server, contract, filename, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

}

function registerUtils(program, errorHandler) {

  // TOCHECKSUMADDRESS Command
  program
    .command('to-checksum-address <address>')
    .description('returns the given address with uppercase checksum')
    .action(function(address){
      console.log(Web3.utils.toChecksumAddress(address));
    });

  // GETCONTENTID Command
  program
  .command('id')
  .description("returns the content id for a file, directory or bubble")
  .argument('<server>', "a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456' (id can be an address book label)" )
  .argument('<contract>', "an address book label or an Ethereum address" )
  .argument('[filename]', "an address book label, ethereum address or unsigned integer (in decimal or hex)" )
  .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
  .option('-d, --did', 'return as a DID')
  .option('-j, --json', 'return as a non-encoded json object')
  .option('-o, --object', 'return as a non-encoded object')
  .action(function(server, contract, filename, options){
    try {
      const id = getContentId(server, contract, filename, options)
      if (options.did) console.log(id.toDID())
      else if (options.json) console.log(JSON.stringify(id.toObject()))
      else if (options.object) console.log(id.toObject())
      else console.log(id.toString())
    }
    catch (error) { errorHandler(error) }
  });

  // PARSECONTENTID Command
  program
  .command('parse-id')
  .description("decodes a content id displaying the chainId, contract, provider url and file")
  .argument('<contentId>', "the content id or DID" )
  .option('-j, --json', 'output in json format')
  .option('-r, --raw', 'output space delimited without field headers')
  .action(function(contentId, options){
    try {
      const id = new ContentId(contentId);
      if (options.json) console.log(JSON.stringify(id.toObject()));
      else if (options.raw) console.log(id.chain, id.contract, id.provider, id.file);
      else console.log(id.toObject());
    }
    catch (error) { errorHandler(error) }
  });

}


export const BubbleTools = {
  registerCommands: registerCommands,
  registerUtils: registerUtils,
  createBubble: createBubble,
  deleteBubble: deleteBubble,
  readBubble: readBubble,
  writeBubble: writeBubble,
  deleteBubbleFile: deleteBubbleFile,
  getContentId: getContentId
}

export default BubbleTools;

