import { assert, BubblePermissions, ROOT_PATH } from '@bubble-protocol/core';
import {getApplicationKey} from "../wallet/wallet.js";
import addressBook from "../address-book/address-book.js";
import { readFile } from "../../utils/file-utils.js";
import { blockchainProviders } from "./providers.js";
import Web3 from 'web3';
import { Contract } from "./Contract.js";

const accABI = {
  "0.0.2": [{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"contentId","type":"uint256"}],"name":"getAccessPermissions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
}


export async function deployContract(args=[], options={}) {
  args = _validateMethodArgs(args, options);
  const bytecode = _getBytecode(options);
  const key = getApplicationKey(options.key);

  console.trace("key:", key.address);
  console.trace("constructor args:", args.join(', '));

  const contract = _getContract(options);

  return contract.deploy(key, bytecode, args)
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


export function getPermissions(contractStr, user, fileId, options) {
  assert.isString(contractStr, 'contract');
  user = _validateAddress(user || getApplicationKey().address);
  return callContract(contractStr, 'getAccessPermissions', [user, fileId || ROOT_PATH], options)
    .then(permissionBits => {
      const permissions = new BubblePermissions(BigInt(permissionBits));
      return '' +
        (permissions.bubbleTerminated() ? 't' : '-') +
        (permissions.isDirectory() ? 'd' : '-') +
        (permissions.canRead() ? 'r' : '-') +
        (permissions.canWrite() ? 'w' : '-') +
        (permissions.canAppend() ? 'a' : '-') +
        (permissions.canExecute() ? 'x' : '-');
    })
}

export function callContract(contractStr, method, args, options={}) {
  let contractAddress, contract;
  [contractAddress, method, args, contract] = _validateParams(contractStr, method, args, options);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+args.join(', ')+')');
  return contract.call(method, args);
}


export async function transactContract(contractStr, method, args, options={}) {
  let contractAddress, contract;
  [contractAddress, method, args, contract] = _validateParams(contractStr, method, args, options);
  const key = getApplicationKey(options.key);

  let txnOptions = undefined;
  if (options.options) {
    try {
      txnOptions = JSON.parse(options.options)
    }
    catch(err) { throw new Error('transaction options is not a valid JSON object') }
  }

  console.trace("key:", key.address);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+args.join(', ')+')');

  if (txnOptions) console.trace("options:", JSON.stringify(txnOptions));

  return contract.transact(key, method, args, txnOptions);
}


export async function getBalance(accountStr, options={}) {
  const account = _validateAddress(accountStr);
  const provider = blockchainProviders.getProvider(options.chain);
  const web3 = new Web3(provider.url);

  console.trace("getting balance of", account, "on", provider.name);

  return web3.eth.getBalance(account)
  .then(balance => {
    return web3.utils.fromWei(balance, "ether")
  })
}


export async function getEvents(contractStr, event, options={}) {
  const contractAddress = _validateAddress(contractStr);
  assert.isString(event, 'event');

  let filter = undefined;
  try {
    if (options.filter) filter = JSON.parse(options.filter);
  }
  catch(err) { throw new Error('filter is not a valid JSON object') }

  const filters = {
    fromBlock: options.fromBlock || 'earliest', 
    toBlock: options.toBlock || 'latest', 
    filter: filter
  };

  console.trace('getting', event, 'events from block', '"'+filters.fromBlock+'"', 'to block', '"'+filters.toBlock+'"', (filters.filter ? 'with filter' : ''), filters.filter || '' );

  const contract = _getContract(options, contractAddress);

  return contract.web3Contract.getPastEvents(event, filters)
    .then(events => {
      console.trace(events);
      console.trace(events.length, "events received");
      return events.map(e => { return JSON.stringify(e.returnValues) }).join(',\n');
    })
}


function _validateAddress(address) {
  assert.isString(address, 'contract');
  const addr = addressBook.parseAddress(address);
  if (!addr) throw new Error('invalid address');
  return addr;
}

function _validateMethodArgs(args, options) {
  assert.isArray(args, 'args');
  return options.noexpand ? args : _expandArgs(args);
}

function _getABI(options) {
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : accABI['0.0.2']);
  if (!abi) throw new Error("abi or source code file is invalid");
  return abi;
}

function _getBytecode(options) {
  const sourceCode = options.file ? JSON.parse(readFile(options.file, "source code file")) : {};
  let bytecode = options.bytecode || sourceCode.bytecode || ((sourceCode.data && sourceCode.data.bytecode) ? sourceCode.data.bytecode.object : undefined);
  if (!bytecode) throw new Error("missing bytecode");
  if (bytecode.startsWith('0x')) bytecode = bytecode.substring(2);
  return bytecode;
}

function _getContract(options, address) {
  const abi = _getABI(options);
  const chain = blockchainProviders.getProvider(options.chain).chain;
  const web3 = _getWeb3(options.chain);
  return new Contract(web3, chain, abi, address);
}

function _validateParams(contractStr, method, args, options) {
  assert.isString(method, 'method');
  const contractAddress = _validateAddress(contractStr);
  const expandedArgs = _validateMethodArgs(args, options);
  const contract = _getContract(options, contractAddress);
  return [contractAddress, method, expandedArgs, contract];
}

function _getWeb3(chain) {
  const provider = blockchainProviders.getProvider(chain);
  return new Web3(provider.url);
}


function _expandAddresses(arr) {
  return arr.map(v => { return addressBook.parseAddress(v) });
}


function _expandArgs(arr) {
  return arr.map(v => { 
    return addressBook.parseAddress(v) || _parseBooleanArg(v);
  });
}

function _parseBooleanArg(arg) {
  if (arg === 'false') return false;
  if (arg === 'true') return true;
  if (arg === '\false') return "false";
  if (arg === '\true') return "true";
  return arg;
}


const blockchain = {
  deployContract: deployContract,
  callContract: callContract,
  transactContract: transactContract,
  getBalance: getBalance,
  getEvents: getEvents,
  getPermissions: getPermissions
}

export default blockchain;