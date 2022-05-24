import datona from "datona-lib";
import StringUtils from "./string-utils.mjs";
import fs from 'fs';
import { homedir } from "os";

import { BubbleDIDURL, createBubbleUrlStr, createDID, isBubbleDID, readFile } from "./bubble-utils.mjs";

const APP_DIR = homedir()+'/.bubble-tools';
const WALLET_DIR = APP_DIR+'/wallet';
const SERVERS_FILE = APP_DIR+'/servers';
const ADDRESSES_FILE = APP_DIR+'/addresses';

// DID TOOLS

export function didToAddress(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl.address;
}

export function decodeDid(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl;
}

export function addressToDid(address) {
  return createDID(address);
}

export function createBubbleUrl(server, contract, filename) {
  const params = validateVaultParams(server, contract, filename);
  return createBubbleUrlStr(params.contract, params.server, params.filename);
}

/**
 * Generates hash(contractAddress, file) as expected by the setPermissions function of the GenericBubble SDAC
 */
export function sdacFileHash(contractStr, fileStr) {
  const contract = parseAddress(contractStr);
  const file = parseAddress(fileStr);
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


// WALLET

function checkApplicationDir() {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, {recursive: true});
    fs.chmodSync(APP_DIR, 0o700);
  }
}

function getApplicationKey(label='default-key') {
	try {
    if (!fs.existsSync(WALLET_DIR+'/default-key')) throw new Error('key does not exist');
		const privateKey = fs.readFileSync(WALLET_DIR+'/'+label, {encoding: 'utf8'});
		return new datona.crypto.Key(privateKey);
	}
	catch(error) {
    console.error(error);
	}
}

function createApplicationKey(label) {
	const key = datona.crypto.generateKey();
  const success = setApplicationKey(datona.crypto.uint8ArrayToHex(key.privateKey), label);
  return success ? key : undefined;
}

function setApplicationKey(privateKey, label='default-key', force=false) {
  checkApplicationDir();
  if (!fs.existsSync(WALLET_DIR)) fs.mkdirSync(WALLET_DIR, {recursive: true});
  if (!force && hasApplicationKey(label)) {
    throw new Error("application key '"+label+"' already exists");
  };
  fs.writeFileSync(WALLET_DIR+'/'+label, privateKey);
  if (label === 'default-key') fs.writeFileSync(WALLET_DIR+'/initial-application-key', privateKey);
  return true;
}

function addApplicationKey(label, privateKey) {
  datona.assertions.isPrivateKey(privateKey, "private key");
  datona.assertions.isString(label, "label");
  return setApplicationKey(privateKey, label);
}

function removeApplicationKey(label) {
  datona.assertions.isString(label, "label");
  label = label.toLowerCase();
  if (label === 'default-key') throw new Error('cannot delete the default-key.  Use wallet.setDefault instead');
  if (label === 'initial-application-key') throw new Error('cannot delete the initial-application-key - it connects this installation to your Bubble');
  if (!fs.existsSync(WALLET_DIR+'/'+label)) throw new Error('key does not exist');
  fs.unlinkSync(WALLET_DIR+'/'+label);
}

function setDefaultKey(label='initial-application-key') {
  label = label.toLowerCase();
  if (!fs.existsSync(WALLET_DIR+'/'+label)) throw new Error('key does not exist');
  fs.copyFileSync(WALLET_DIR+'/'+label, WALLET_DIR+'/default-key');
}

function resetDefaultKey() {
  setDefaultKey();
}

function hasApplicationKey(label='default-key') {
  return fs.existsSync(WALLET_DIR+'/'+label);
}

function listKeys(label) {
  if (!fs.existsSync(WALLET_DIR)) return [];
  let keyNames = fs.readdirSync(WALLET_DIR);
  if (label) keyNames = keyNames.filter(k => { return k === label })
  return keyNames.map(k => {
    const key = getApplicationKey(k);
    if (key) return {name: k, address: key.address, publicKey: '0x'+datona.crypto.uint8ArrayToHex(key.publicKey)}
    else return {name: k, address: 'error!', publicKey: ''}
  })
}

export const wallet = {
  getApplicationKey: getApplicationKey,
  addApplicationKey: addApplicationKey,
  createApplicationKey: createApplicationKey,
  removeApplicationKey: removeApplicationKey,
  setApplicationKey: setApplicationKey,
  hasApplicationKey: hasApplicationKey,
  listKeys: listKeys,
  setDefaultKey: setDefaultKey,
  resetDefaultKey: resetDefaultKey
}


// SERVERS

let localServers;

function getServers() {
  if (localServers) return localServers;
	try {
    if (!fs.existsSync(SERVERS_FILE)) return [];
    const json = fs.readFileSync(SERVERS_FILE, {encoding: 'utf8'});
    return JSON.parse(json);
	}
	catch(error) {
		console.error(error);
    return [];
	}
}

function addServer(label, url, id) {
  datona.assertions.isString(label, "label");
  datona.assertions.isString(url, "url");
  datona.assertions.isAddress(id, "id");
  try {
    new URL(url)
  }
  catch(_){
    throw new Error("invalid url");
  }
  const servers = getServers();
  label = label.toLowerCase();
  url = url.toLowerCase();
  if (servers.findIndex(s => {return s.label === label}) >= 0) throw new Error("server with that label already exists");
  if (servers.findIndex(s => {return s.url === url}) >= 0) throw new Error("server with that url already exists");
  servers.push({label: label, url: url, id: id});
  servers.sort((a,b) => { return a.label.localeCompare(b.label) });
  writeServers(servers);
}

function removeServer(label) {
  const servers = getServers();
  label = label.toLowerCase();
  const index = servers.findIndex(s => {return s.label === label});
  if (index < 0) throw new Error("server does not exist with that label");
  servers.splice(index, 1);
  writeServers(servers);
}

function writeServers(servers) {
  checkApplicationDir();
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers));
  localServers = servers;
}

const vaultServerConfig = {
  getServers: getServers,
  addServer: addServer,
  removeServer: removeServer
}


// ADDRESS BOOK

let localAddressBook;

function getAddressBook() {
  if (localAddressBook) return localAddressBook;
	try {
    if (!fs.existsSync(ADDRESSES_FILE)) return [];
    const json = fs.readFileSync(ADDRESSES_FILE, {encoding: 'utf8'});
    return JSON.parse(json);
	}
	catch(error) {
		console.error(error);
    return [];
	}
}

function addAddress(label, address, memo, options={}) {
  datona.assertions.isString(label, "label");
  if (isBubbleDID(address)) address = new BubbleDIDURL(address).address;
  datona.assertions.isAddress(address, "address");
  if (options.toLowerCase) address = address.toLowerCase();
  const addresses = getAddressBook();
  label = label.toLowerCase();
  if (addresses.findIndex(s => {return s.label === label}) >= 0) throw new Error("server with that label already exists");
  addresses.push({label: label, address: address, memo: memo});
  addresses.sort((a,b) => { return a.label.localeCompare(b.label) });
  writeAddressBook(addresses);
}

function removeAddress(label) {
  const addresses = getAddressBook();
  label = label.toLowerCase();
  const index = addresses.findIndex(s => {return s.label === label});
  if (index < 0) throw new Error("address does not exist with that label");
  addresses.splice(index, 1);
  writeAddressBook(addresses);
}

function writeAddressBook(addresses) {
  checkApplicationDir();
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses));
  localAddressBook = addresses;
}

export const addressBook = {
  getAddressBook: getAddressBook,
  addAddress: addAddress,
  removeAddress: removeAddress,
  parseAddress: parseAddress
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
  const server = parseServer(serverStr);
  let contract = parseAddress(contractStr);
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
  params.filename = parseAddress(filenameStr, true);
  if (!params.filename) throw new Error('invalid filename - should be an address');
  return params;
}

function parseServer(serverStr) {
  const servers = getServers();
  let server = servers.find(s => {return s.label === serverStr.toLowerCase()});
  if (!server) {
    try {
      const url = new URL(serverStr)
      const id = (new URLSearchParams(url.search)).get('id');
      datona.assertions.isAddress(id, 'server url id');
      server = {
        url: url.protocol+'//'+url.host+url.pathname,
        id: id
      }
    }
    catch(error) {
      console.debug(error);
    }
  }
  return server;
}

function parseAddress(addressStr) {
  if (datona.assertions.isAddress(addressStr)) return addressStr;
  const parts = addressStr.split('/');
  if (parts.length !== 1) {
    if (parts.length !== 2) return undefined;
    const dir = parseAddress(parts[0]);
    if (dir) return dir+'/'+parts[1];
    else return undefined;
  }
  const addresses = getAddressBook();
  let address = addresses.find(a => { return a.label === addressStr.toLowerCase() });
  if (address) {
    address = address.address;
  }
  else {
    if (addressStr.startsWith('0x')) {
      address = '0x'+("0000000000000000000000000000000000000000"+addressStr.substring(2)).slice(-40);
      if (!datona.assertions.isAddress(address)) address = undefined;
    }
    else {
      const intAddress = parseInt(addressStr);
      if (isNaN(intAddress)) return addressStr;
      else {
        address = '0x'+("0000000000000000000000000000000000000000"+intAddress.toString(16)).slice(-40);
        if (!datona.assertions.isAddress(address)) address = undefined;
      }
    }
  }
  return address;
}

export const vaultTools = {
  getServers: getServers,
  createVault: createVault,
  deleteVault: deleteVault,
  readVault: readVault,
  writeVault: writeVault,
  deleteVaultFile: deleteVaultFile,
  validateVault: validateVault,
  validateVaultParams: validateVaultParams,
  parseServer: parseServer
}


// CONTRACT

const sdacAbi = {
  v1: JSON.parse('[ { "inputs": [], "name": "ALL_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "APPEND_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DIRECTORY_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DatonaProtocolVersion", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "NO_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "READ_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "WRITE_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "requester", "type": "address" }, { "internalType": "address", "name": "file", "type": "address" } ], "name": "getPermissions", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "hasExpired", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "terminate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]')
}

const bubbleNet = {
  "blockchain": {"name":"bubblenet","chainId":45021,"networkId":45021,"comment":"The Bubble main chain","url":"https://ethstats.net/","genesis":{"hash":"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3","timestamp":null,"gasLimit":5000,"difficulty":17179869184,"nonce":"0x0000000000000042","extraData":"0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa","stateRoot":"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544"},"hardforks":[{"name":"chainstart","block":0,"consensus":"pow","finality":null},{"name":"homestead","block":1150000,"consensus":"pow","finality":null},{"name":"dao","block":1920000,"consensus":"pow","finality":null},{"name":"tangerineWhistle","block":2463000,"consensus":"pow","finality":null},{"name":"spuriousDragon","block":2675000,"consensus":"pow","finality":null},{"name":"byzantium","block":4370000,"consensus":"pow","finality":null},{"name":"constantinople","block":7280000,"consensus":"pow","finality":null},{"name":"petersburg","block":7280000,"consensus":"pow","finality":null},{"name":"istanbul","block":9069000,"consensus":"pow","finality":null},{"name":"muirGlacier","block":9200000,"consensus":"pow","finality":null}],"bootstrapNodes":[{"ip":"18.138.108.67","port":30303,"id":"d860a01f9722d78051619d1e2351aba3f43f943f6f00718d1b9baa4101932a1f5011f16bb2b1bb35db20d6fe28fa0bf09636d26a87d31de9ec6203eeedb1f666","location":"ap-southeast-1-001","comment":"bootnode-aws-ap-southeast-1-001"},{"ip":"3.209.45.79","port":30303,"id":"22a8232c3abc76a16ae9d6c3b164f98775fe226f0917b0ca871128a74a8e9630b458460865bab457221f1d448dd9791d24c4e5d88786180ac185df813a68d4de","location":"us-east-1-001","comment":"bootnode-aws-us-east-1-001"},{"ip":"34.255.23.113","port":30303,"id":"ca6de62fce278f96aea6ec5a2daadb877e51651247cb96ee310a318def462913b653963c155a0ef6c7d50048bba6e6cea881130857413d9f50a621546b590758","location":"eu-west-1-001","comment":"bootnode-aws-eu-west-1-001"},{"ip":"35.158.244.151","port":30303,"id":"279944d8dcd428dffaa7436f25ca0ca43ae19e7bcf94a8fb7d1641651f92d121e972ac2e8f381414b80cc8e5555811c2ec6e1a99bb009b3f53c4c69923e11bd8","location":"eu-central-1-001","comment":"bootnode-aws-eu-central-1-001"},{"ip":"52.187.207.27","port":30303,"id":"8499da03c47d637b20eee24eec3c356c9a2e6148d6fe25ca195c7949ab8ec2c03e3556126b0d7ed644675e78c4318b08691b7b57de10e5f0d40d05b09238fa0a","location":"australiaeast-001","comment":"bootnode-azure-australiaeast-001"},{"ip":"191.234.162.198","port":30303,"id":"103858bdb88756c71f15e9b5e09b56dc1be52f0a5021d46301dbbfb7e130029cc9d0d6f73f693bc29b665770fff7da4d34f3c6379fe12721b5d7a0bcb5ca1fc1","location":"brazilsouth-001","comment":"bootnode-azure-brazilsouth-001"},{"ip":"52.231.165.108","port":30303,"id":"715171f50508aba88aecd1250af392a45a330af91d7b90701c436b618c86aaa1589c9184561907bebbb56439b8f8787bc01f49a7c77276c58c1b09822d75e8e8","location":"koreasouth-001","comment":"bootnode-azure-koreasouth-001"},{"ip":"104.42.217.25","port":30303,"id":"5d6d7cd20d6da4bb83a1d28cadb5d409b64edf314c0335df658c1a54e32c7c4a7ab7823d57c39b6a757556e68ff1df17c748b698544a55cb488b52479a92b60f","location":"westus-001","comment":"bootnode-azure-westus-001"}]},
  "blockchainUrl": {
    "scheme": "https",
    "host": "datonavault.com",
    "port": "8130"
  }
}

datona.blockchain.setProvider(bubbleNet.blockchainUrl, bubbleNet.blockchain);

function terminateContract(contractStr, options={}) {
  const contractAddress = parseAddress(contractStr);
  const key = wallet.getApplicationKey(options.key);
  const contract = new datona.blockchain.Contract(sdacAbi.v1, contractAddress);
  return contract.terminate(key);
}

function callContract(contractStr, method, args, options) {
  const contractAddress = parseAddress(contractStr);
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  return contract.call(method, _expandAddresses(args));
}

function transactContract(contractStr, method, args, options={}) {
  const contractAddress = parseAddress(contractStr);
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
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
  return arr.map(v => { return parseAddress(v) });
}

export const contractTools = {
  terminate: terminateContract,
  call: callContract,
  transact: transactContract
}


// TOOLS

const tools = {
  wallet: wallet,
  addressBook: addressBook,
  vaultServerConfig: vaultServerConfig,
  vault: vaultTools,
  contract: contractTools,
  didToAddress: didToAddress,
  decodeDid: decodeDid,
  addressToDid: addressToDid,
  createBubbleUrl: createBubbleUrl,
  sdacFileHash: sdacFileHash,
  toChecksumAddress: toChecksumAddress
}

export default tools;
