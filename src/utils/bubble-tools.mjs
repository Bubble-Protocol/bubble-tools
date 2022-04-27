import datona from "datona-lib";
import StringUtils from "./string-utils.mjs";
import fs from 'fs';
import { homedir } from "os";

import { BubbleDIDURL, createBubbleUrlStr, createDID } from "./bubble-utils.mjs";

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

function getApplicationKey(label='default-key') {
	try {
    if (!fs.existsSync(homedir()+'/.bubble-tools/wallet/default-key')) throw new Error('key does not exist');
		const privateKey = fs.readFileSync(homedir()+'/.bubble-tools/wallet/'+label, {encoding: 'utf8'});
		return new datona.crypto.Key(privateKey);
	}
	catch(error) {
		console.error(error);
	}
}

function createApplicationKey(label='default-key') {
	const key = datona.crypto.generateKey();
  const success = setApplicationKey(datona.crypto.uint8ArrayToHex(key.privateKey), label);
  return success ? key : undefined;
}

function setApplicationKey(privateKey, label='default-key', force=false) {
	try {
    if (!fs.existsSync(homedir()+'/.bubble-tools/wallet')) fs.mkdirSync(homedir()+'/.bubble-tools/wallet', {recursive: true});
		if (!force && hasApplicationKey(label)) {
      throw new Error("application key '"+label+"' already exists");
    };
		fs.writeFileSync(homedir()+'/.bubble-tools/wallet/'+label, privateKey);
    return true;
	}
	catch(error) {
		console.error(error);
    return false;
	}
}

function hasApplicationKey(label='default-key') {
  return fs.existsSync(homedir()+'/.bubble-tools/wallet/'+label);
}

export const wallet = {
  getApplicationKey: getApplicationKey,
  createApplicationKey: createApplicationKey,
  setApplicationKey: setApplicationKey,
  hasApplicationKey: hasApplicationKey
}


// SERVERS

let localServers;

function getServers() {
  if (localServers) return localServers;
	try {
    if (!fs.existsSync(homedir()+'/.bubble-tools/servers')) return [];
    const json = fs.readFileSync(homedir()+'/.bubble-tools/servers', {encoding: 'utf8'});
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
  if (!fs.existsSync(homedir()+'/.bubble-tools')) fs.mkdirSync(homedir()+'/.bubble-tools');
  fs.writeFileSync(homedir()+'/.bubble-tools/servers', JSON.stringify(servers));
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
    if (!fs.existsSync(homedir()+'/.bubble-tools/addresses')) return [];
    const json = fs.readFileSync(homedir()+'/.bubble-tools/addresses', {encoding: 'utf8'});
    return JSON.parse(json);
	}
	catch(error) {
		console.error(error);
    return [];
	}
}

function addAddress(label, address, memo) {
  datona.assertions.isString(label, "label");
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
  if (!fs.existsSync(homedir()+'/.bubble-tools')) fs.mkdirSync(homedir()+'/.bubble-tools');
  fs.writeFileSync(homedir()+'/.bubble-tools/addresses', JSON.stringify(addresses));
  localAddressBook = addresses;
}

const addressBook = {
  getAddressBook: getAddressBook,
  addAddress: addAddress,
  removeAddress: removeAddress
}


// VAULTS

function readVault(server, contract, filename, file, data) {
  const params = validateVaultParams(server, contract, filename);
  console.trace('readVault', JSON.stringify(params.server), params.contract, params.filename);
  return params.vault.read(params.filename);
}

function writeVault(server, contract, filename, file, data) {
  const params = validateVaultParams(server, contract, filename);
  if (file && data) throw new Error('cannot write both file and data');
  if (!file && !data) throw new Error('missing file or data string');
  if (file) {
    if (!fs.existsSync(file)) throw new Error('file does not exist');
    data = fs.readFileSync(file).toString();
  }
  console.trace('writeVault', JSON.stringify(params.server), params.contract, params.filename);
  return params.vault.write(data, params.filename);
}

function validateVaultParams(serverStr, contractStr, filenameStr) {
  const server = parseServer(serverStr);
  const contract = parseAddress(contractStr);
  const filename = parseAddress(filenameStr, true);
  if (!server) throw new Error('invalid server url');
  if (!contract) throw new Error('invalid contract address');
  if (!filename) throw new Error('invalid filename - should be an address');
  const key = getApplicationKey();
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(server.url), contract, key, server.id);
  return {server: server, contract: contract, filename: filename, key: key, vault: vault}
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

const vault = {
  readVault: readVault,
  writeVault: writeVault
}


// TOOLS

const tools = {
  wallet: wallet,
  addressBook: addressBook,
  vaultServerConfig: vaultServerConfig,
  vault: vault,
  didToAddress: didToAddress,
  addressToDid: addressToDid,
  createBubbleUrl: createBubbleUrl,
  sdacFileHash: sdacFileHash,
  toChecksumAddress: toChecksumAddress
}

export default tools;
