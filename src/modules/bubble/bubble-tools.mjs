import datona from "datona-lib";
import StringUtils from "../../utils/string-utils.mjs";
import fs from 'fs';
import wallet from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import { createBubbleUrlStr } from "../../utils/bubble-utils.mjs";

function registerCommands(program, errorHandler) {

  const group = program
    .command('vault')
    .description("create and manage bubble vaults" );

  // CREATEVAULT Command
  group
  .command('create <server> <contract>')
  .description("creates a vault on the given vault server controlled by the given smart data access contract.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract can be an address book label or an Ethereum address." )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .action(function(server, contract, options){
    try{
      createVault(server, contract, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // DELETEVAULT Command
  group
  .command('deleteVault <server> <contract>')
  .description("deletes the given vault server controlled by the given smart data access contract.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract can be an address book label or an Ethereum address." )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .action(function(server, contract, options){
    try{
      deleteVault(server, contract, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // READVAULT Command
  group
  .command('read <server> <contract> <filename>')
  .description("reads the given vault file and dumps the content to the console.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .action(function(server, contract, filename, options){
    try{
      readVault(server, contract, filename, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // WRITEVAULT Command
  group
  .command('write <server> <contract> <filename> [file]')
  .description("writes the given file (or data if using the --data option) to the given vault and filename.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
  .option('--data <string>', 'string data to write instead of a file')
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .action(function(server, contract, filename, file, options){
    try{
      writeVault(server, contract, filename, file, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // DELETEVAULTFILE Command
  group
  .command('delete <server> <contract> <filename>')
  .description("deletes the given file with the given vault and filename.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address." )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-l, --toLowerCase', 'make contract address lowercase')
  .action(function(server, contract, filename, options){
    try{
      deleteVaultFile(server, contract, filename, options)
        .then(console.log)
        .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

}

function registerUtils(program, errorHandler) {

  // GENERATEREQUEST Command
  program
    .command('generateRequest <server> <contract> <filename>')
    .description('generates a Bubble Dashboard request string for the given vault file.  The vault file must contain the actual request as a json file.  (A request is base58 representation of the bubble url containing the request json).')
    .action(function(server, contract, filename){
      try {
        console.log(StringUtils.stringToBase58(createBubbleUrl(server, contract, filename)));
      }
      catch (error) { exitWithError(error) }
    });

  // SDACFILEHASH Command
  program
    .command('sdacFileHash <contractAddress> <file>')
    .description("returns the 20-byte address generated from the keccak256 hash of the concatenation of the given address and file ready for passing to the GenericBubble SDAC's setPermissions function")
    .action(function(contractAddress, file){
      console.log(sdacFileHash(contractAddress, file));
    });

  // FILEHASH Command
  program
    .command('fileHash <data>')
    .description('returns the 20-byte address generated from the keccak256 hash of the given string i.e. the last 20-bytes of keccak256(data)')
    .action(function(data){
      console.log(toChecksumAddress(datona.crypto.hash(data).substring(24)));
    });

  // TOCHECKSUMADDRESS Command
  program
    .command('toChecksumAddress <address>')
    .description('returns the given address with uppercase checksum')
    .action(function(address){
      console.log(toChecksumAddress(address));
    });

  // CREATEBUBBLEURL Command
  program
  .command('createBubbleUrl <server> <contract> <filename>')
  .description("generates a bubble url.  Server can a label in the servers list or a string of the form 'https://myurl.com?id=0x123..456'.  Contract and file can be an address book label or an Ethereum address.")
  .action(function(server, contract, filename){
    try {
      console.log(createBubbleUrl(server, contract, filename));
    }
    catch (error) { errorHandler(error) }
  });

}


export const BubbleTools = {
  registerCommands: registerCommands,
  registerUtils: registerUtils,
  createVault: createVault,
  deleteVault: deleteVault,
  readVault: readVault,
  writeVault: writeVault,
  deleteVaultFile: deleteVaultFile,
  validateVault: validateVault,
  validateVaultParams: validateVaultParams,
  sdacFileHash: sdacFileHash,
  toChecksumAddress: toChecksumAddress,
  createBubbleUrl: createBubbleUrl
}

export default BubbleTools;


//
// Internal Functions
//

// HASH TOOLS

/**
 * Generates hash(contractAddress, file) as expected by the setPermissions function of the GenericBubble SDAC
 */
 export function sdacFileHash(contractStr, fileStr) {
  const contract = addressBook.parseAddress(contractStr);
  const file = addressBook.parseAddress(fileStr);
  const packet = new Uint8Array(40);
  packet.set(StringUtils.hexToByteArray(contract, 20), 0);
  packet.set(StringUtils.hexToByteArray(file, 20), 20);
  return '0x'+datona.crypto.hash(packet);
}

/**
 * Generates the checksum version of the given address
 */
export function toChecksumAddress (address) {
  address = address.toLowerCase().replace('0x', '')
  var hash = datona.crypto.hash(address);
  var ret = '0x'

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}


// VAULTS

function createVault(server, contract, options) {
  const params = validateVault(server, contract, options);
  console.trace('createVault', JSON.stringify(params.server), params.contract, options);
  return params.vault.create();
}

function deleteVault(server, contract, options) {
  const params = validateVault(server, contract, options);
  console.trace('deleteVault', JSON.stringify(params.server), params.contract, options);
  return params.vault.delete();
}

function readVault(server, contract, filename, options) {
  const params = validateVaultParams(server, contract, filename, options);
  console.trace('readVault', JSON.stringify(params.server), params.contract, params.filename, options);
  return params.vault.read(params.filename);
}

function writeVault(server, contract, filename, file, options={}) {
  const params = validateVaultParams(server, contract, filename, options);
  let data = options.data;
  if (file && data) throw new Error('cannot write both file and data');
  if (!file && !data) throw new Error('missing file or data string');
  if (file) {
    if (!fs.existsSync(file)) throw new Error('file does not exist');
    data = fs.readFileSync(file).toString();
  }
  console.trace('writeVault', JSON.stringify(params.server), params.contract, params.filename, options);
  return params.vault.write(data, params.filename);
}

function deleteVaultFile(server, contract, filename, options={}) {
  const params = validateVaultParams(server, contract, filename, options);
  console.trace('deleteVaultFile', JSON.stringify(params.server), params.contract, params.filename, options);
  return params.vault.write("!!bubble-delete!!", params.filename);
}

function validateVault(serverStr, contractStr, options={}) {
  const server = addressBook.parseServer(serverStr);
  let contract = addressBook.parseAddress(contractStr);
  if (options.toLowerCase) contract = contract.toLowerCase();
  if (!server) throw new Error('invalid server url');
  if (!contract) throw new Error('invalid contract address');
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(server.url), contract, key, server.id);
  return {server: server, contract: contract, key: key, vault: vault}
}

function validateVaultParams(serverStr, contractStr, filenameStr, options) {
  const params = validateVault(serverStr, contractStr, options);
  params.filename = addressBook.parseAddress(filenameStr, true);
  if (!params.filename) throw new Error('invalid filename - should be an address');
  return params;
}

// BUBBLE URL TOOLS

export function createBubbleUrl(server, contract, filename) {
  const params = validateVaultParams(server, contract, filename);
  return createBubbleUrlStr(params.contract, params.server, params.filename);
}

