import { assert } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';
import fs from 'fs';
import {APP_DIR as CONFIGURED_APP_DIR} from "../../config.js";
import wallet from "../wallet/wallet.js";

let APP_DIR;
let SERVERS_FILE;
let ADDRESSES_FILE;
setAppDir(CONFIGURED_APP_DIR);

function checkApplicationDir() {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, {recursive: true});
    fs.chmodSync(APP_DIR, 0o700);
  }
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

function addServer(label, url) {
  assert.isString(label, "label");
  assert.isString(url, "url");
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
  servers.push({label: label, url: url});
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


// ADDRESSES

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
  assert.isString(label, "label");
  ecdsa.assert.isAddress(address, "address");
  if (options.toLowerCase) address = address.toLowerCase();
  const addresses = getAddressBook();
  label = label.toLowerCase();
  if (addresses.findIndex(s => {return s.label === label}) >= 0) throw new Error("address with that label already exists");
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

function parseServer(serverStr, silent=true, descriptiveName='url') {
  if (!serverStr) {
    if (silent) return undefined;
    else throw new Error(descriptiveName+' is missing')
  }
  const servers = getServers();
  let server = servers.find(s => {return s.label === serverStr.toLowerCase()});
  if (!server) {
    try {
      const url = new URL(serverStr)
      server = {name: 'Unknown', url: url.toString()};
    }
    catch(error) {
      if (!silent) throw new Error(descriptiveName+' is invalid: '+error.message);
    }
  }
  return server;
}

function parseAddress(addressStr, silent=true, descriptiveName='address') {
  if (!addressStr || !assert.isString(addressStr)) {
    if (silent) return undefined;
    else throw new Error(descriptiveName+' is invalid')
  }
  if (ecdsa.assert.isAddress(addressStr)) return addressStr;
  const parts = addressStr.split('/');
  if (parts.length !== 1) {
    if (parts.length !== 2) return undefined;
    const dir = addressBook.parseAddress(parts[0]);
    if (dir) return dir+'/'+parts[1];
    else return undefined;
  }
  const addresses = [...getAddressBook()];
  addresses.push(...wallet.listKeys(addressStr));
  let address = addresses.find(a => { return a.label === addressStr.toLowerCase() });
  if (address) {
    address = address.address;
  }
  else {
    if (addressStr.startsWith('0x')) {
      if (addressStr.length === 2 || addressStr.length > 42) {
        if (silent) address = undefined;
        else throw new Error(descriptiveName+' is invalid')
      }
      else {
        address = '0x'+("0000000000000000000000000000000000000000"+addressStr.substring(2)).slice(-40);
        if (!ecdsa.assert.isAddress(address)) address = undefined;
      }
    }
    else {
      const intAddress = parseInt(addressStr, 10);
      if (isNaN(intAddress)) {
        if (silent) address = undefined;
        else throw new Error(descriptiveName+' is invalid')
      }
      else if (!/^\d+$/.test(addressStr)) {
        if (silent) address = undefined;
        else throw new Error(descriptiveName+' is invalid')
      }
      else {
        address = '0x'+("0000000000000000000000000000000000000000"+intAddress.toString(16)).slice(-40);
        if (!ecdsa.assert.isAddress(address)) {
          if (silent) address = undefined;
          else throw new Error(descriptiveName+' is invalid')
        }
      }
    }
  }
  return address;
}

function setAppDir(appDir) {
  APP_DIR = appDir;
  SERVERS_FILE = APP_DIR+'/servers';
  ADDRESSES_FILE = APP_DIR+'/addresses';
}

function testPoint(appDir) {
  localAddressBook = undefined;
  localServers = undefined;
  if (appDir) setAppDir(appDir);
}


const addressBook = {
  getAddressBook: getAddressBook,
  addAddress: addAddress,
  removeAddress: removeAddress,
  parseAddress: parseAddress,
  getServers: getServers,
  addServer: addServer,
  removeServer: removeServer,
  parseServer: parseServer,
  testPoint: testPoint
}

export default addressBook;
