import datona from "datona-lib";
import wallet from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import { readFile } from "../../utils/file-utils.mjs";
import { getDefaultProvider } from "./providers.mjs";

function registerCommands(program, errorHandler) {

  const group = program
    .command('contract')
    .description("deploy, terminate, transact and call smart contracts" );

  // DEPLOYCONTRACT Command
  group
    .command('deploy [args...]')
    .summary('deploys a contract and outputs its address')
    .description('deploys a contract and outputs its address. Use the --file option or the --abi and --bytecode options to specify the contract source code')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-b, --bytecode <bytecode>', 'bytecode of contract (hex string)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with the abi and bytecode.  Accepts the standard compiler output or a flattened version {"abi": [...], "bytecode": "..."}')
    .option('-s, --save <label>', 'save the deployed contract address to the address book with the given label')
    .option('-m, --memo <label>', 'use in conjunction with -s to save the deployed contract address with the given memo')
    .action(function(contract, args, options){
      try{
        deployContract(contract, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // TERMINATECONTRACT Command
  group
    .command('terminate <contract>')
    .description("terminates the given SDAC" )
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .action(function(contract, options){
      try{
        terminateContract(contract, options)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // CALLCONTRACT Command
  group
    .command('call <contract> <method> [args...]')
    .summary('calls the given pure or view method of the given contract')
    .description('calls the given pure or view method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        callContract(contract, method, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // TRANSACTCONTRACT Command
  group
    .command('transact <contract> <method> [args...]')
    .summary('transacts with the given method of the given contract')
    .description('transacts with the given method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        transactContract(contract, method, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

}

const BlockchainTools = {
  registerCommands: registerCommands,
  callContract: callContract,
  transactContract: transactContract,
  terminateContract: terminateContract
}

export default BlockchainTools;


//
// Internal Functions
//

// CONTRACT

const sdacAbi = {
  v1: JSON.parse('[ { "inputs": [], "name": "ALL_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "APPEND_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DIRECTORY_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DatonaProtocolVersion", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "NO_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "READ_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "WRITE_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "requester", "type": "address" }, { "internalType": "address", "name": "file", "type": "address" } ], "name": "getPermissions", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "hasExpired", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "terminate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]')
}

function setProvider() {
  const provider = getDefaultProvider();
  datona.blockchain.setProvider(provider.blockchainUrl, provider.blockchain);
}

function deployContract(args, options={}) {
  setProvider();
  const sourceCode = options.file ? readFile(options.file, 'source code file', {json: true}) : {};
  const abi = options.abi || sourceCode.abi || sdacAbi.v1;
  let bytecode = options.bytecode || sourceCode.bytecode || sourceCode.data && sourceCode.data.bytecode ? sourceCode.data.bytecode.object : undefined;
  if (!bytecode) throw new Error("missing bytecode");
  if (bytecode.startsWith('0x')) bytecode = bytecode.substring(2);
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  console.trace("key:", key.address);
  console.trace("constructor args:", expandedArgs.join(', '));
  const contract = new datona.blockchain.Contract(abi);
  return contract.deploy(key, bytecode, expandedArgs)
    .then(address => {
      if (options.save) {
        try {
          addressBook.addAddress(options.save, address, options.memo);
        }
        catch(error) {
          console.trace(error);
          console.error('deployed contract but failed to save address:', error.message);
        }
      }
      return address;
    });
}

function terminateContract(contractStr, options={}) {
  setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  const key = wallet.getApplicationKey(options.key);
  const contract = new datona.blockchain.Contract(sdacAbi.v1, contractAddress);
  return contract.terminate(key);
}

function callContract(contractStr, method, args, options) {
  setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  return contract.call(method, _expandAddresses(args));
}

function transactContract(contractStr, method, args, options={}) {
  setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  const sourceCode = options.file ? readFile(options.file, 'source code file', {json: true}) : {};
  const abi = options.abi || sourceCode.abi || sdacAbi.v1;
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  console.trace("key:", key.address);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  return contract.transact(key, method, expandedArgs);
}

function _expandAddresses(arr) {
  return arr.map(v => { return addressBook.parseAddress(v) });
}

