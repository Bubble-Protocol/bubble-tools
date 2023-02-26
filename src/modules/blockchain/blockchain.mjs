import datona from "datona-lib";
import {getApplicationKey} from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import { readFile } from "../../utils/file-utils.mjs";
import { getDefaultProvider } from "./providers.mjs";
import StringUtils from "../../utils/string-utils.mjs";
import Web3 from 'web3';

const sdacAbi = {
  v1: JSON.parse('[ { "inputs": [], "name": "ALL_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "APPEND_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DIRECTORY_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DatonaProtocolVersion", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "NO_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "READ_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "WRITE_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "requester", "type": "address" }, { "internalType": "address", "name": "file", "type": "address" } ], "name": "getPermissions", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "hasExpired", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "terminate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]')
}

export function deployContract(args, options={}) {
  _setProvider();
  const sourceCode = options.file ? readFile(options.file, 'source code file', {json: true}) : {};
  const abi = options.abi || sourceCode.abi || sdacAbi.v1;
  let bytecode = options.bytecode || sourceCode.bytecode || ((sourceCode.data && sourceCode.data.bytecode) ? sourceCode.data.bytecode.object : undefined);
  if (!bytecode) throw new Error("missing bytecode");
  if (bytecode.startsWith('0x')) bytecode = bytecode.substring(2);
  const expandedArgs = options.noexpand ? args : _expandArgs(args);
  const key = getApplicationKey(options.key);
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

export function terminateContract(contractStr, options={}) {
  _setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  if (!contractAddress) throw new Error('invalid contract address');
  const key = getApplicationKey(options.key);
  const contract = new datona.blockchain.Contract(sdacAbi.v1, contractAddress);
  return contract.terminate(key);
}

export function callContract(contractStr, method, args, options) {
  _setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  if (!contractAddress) throw new Error('invalid contract address');
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  return contract.call(method, _expandAddresses(args));
}

export function transactContract(contractStr, method, args, options={}) {
  _setProvider();
  const contractAddress = addressBook.parseAddress(contractStr);
  if (!contractAddress) throw new Error('invalid contract address');
  const sourceCode = options.file ? readFile(options.file, 'source code file', {json: true}) : {};
  const abi = options.abi || sourceCode.abi || sdacAbi.v1;
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  const key = getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  console.trace("key:", key.address);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  return contract.transact(key, method, expandedArgs);
}

export function getBalance(accountStr) {
  const account = addressBook.parseAddress(accountStr);
  if (!account) throw new Error('invalid account address');
  const provider = getDefaultProvider();
  const web3 = new Web3(provider.blockchainUrl);
  console.trace("getting balance of "+account);
  return web3.eth.getBalance(account)
  .then(balance => {
    return web3.utils.fromWei(balance, "ether")
  })
}

function _setProvider() {
  const provider = getDefaultProvider();
  datona.blockchain.setProvider(StringUtils.stringToUrl(provider.blockchainUrl), provider.blockchain);
}

function _expandAddresses(arr) {
  return arr.map(v => { return addressBook.parseAddress(v) });
}

function _expandArgs(arr) {
  return arr.map(v => { 
    return addressBook.parseAddress(v) || v;
  });
}

const blockchain = {
  deployContract: deployContract,
  terminateContract: terminateContract,
  callContract: callContract,
  transactContract: transactContract,
  getBalance: getBalance
}

export default blockchain;