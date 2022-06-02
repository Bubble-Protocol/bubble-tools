import datona from "datona-lib";
import fs from 'fs';
import {APP_DIR} from "../../config.mjs";
import { BubbleDIDURL, isBubbleDID } from "../../utils/bubble-utils.mjs";

const SERVERS_FILE = APP_DIR+'/servers';
const ADDRESSES_FILE = APP_DIR+'/addresses';


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
    const dir = addressBook.parseAddress(parts[0]);
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



const addressBook = {
  getAddressBook: getAddressBook,
  addAddress: addAddress,
  removeAddress: removeAddress,
  parseAddress: parseAddress,
  getServers: getServers,
  addServer: addServer,
  removeServer: removeServer,
  parseServer: parseServer
}

export default addressBook;