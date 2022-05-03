import datona from "datona-lib";
import StringUtils from "./string-utils.mjs";
import fs from 'fs';
import { homedir } from "os";

import { BubbleDIDURL, createBubbleUrlStr, createDID, isBubbleDID } from "./bubble-utils.mjs";

const APP_DIR = homedir()+'/.bubble-tools';
const WALLET_DIR = APP_DIR+'/wallet';
const SERVERS_FILE = APP_DIR+'/servers';
const ADDRESSES_FILE = APP_DIR+'/addresses';

// DID TOOLS

export function didToAddress(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl.address;
}

export function addressToDid(address) {
  return createDID(address);
}

export function createBubbleUrl(contractAddress, vaultServerUrl, vaultServerId, file) {
  return createBubbleUrlStr(contractAddress, {url: vaultServerUrl, id: vaultServerId}, file);
}

/**
 * Generates hash(contractAddress, file) as expected by the setPermissions function of the GenericBubble SDAC
 */
export function sdacFileHash(contractAddress, file) {
  const packet = new Uint8Array(40);
  packet.set(StringUtils.hexToByteArray(contractAddress, 20), 0);
  packet.set(StringUtils.hexToByteArray(file, 20), 20);
  return datona.crypto.hash(packet);
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

function addAddress(label, address, memo) {
  datona.assertions.isString(label, "label");
  if (isBubbleDID(address)) address = new BubbleDIDURL(address).address;
  datona.assertions.isAddress(address, "address");
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
  const contract = parseAddress(contractStr);
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

function parseAddress(addressStr, multipath=false) {
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
      if (!isNaN(intAddress)) {
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


// TOOLS

const tools = {
  wallet: wallet,
  addressBook: addressBook,
  vaultServerConfig: vaultServerConfig,
  vault: vaultTools,
  didToAddress: didToAddress,
  addressToDid: addressToDid,
  createBubbleUrl: createBubbleUrl,
  sdacFileHash: sdacFileHash,
  toChecksumAddress: toChecksumAddress
}

export default tools;
