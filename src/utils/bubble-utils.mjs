import datona from 'datona-lib';
import StringUtils from './string-utils.mjs';
import fs from 'fs';
// import gabContract from '../contract/gab-contract.json';

import bip32 from 'bip32';
const PUBLIC_ID_FILE = "0x0000000000000000000000000000000000000102";


export function createRandomId() {
  // TODO use decent random number generator and accept entropy from UI
  const entropy = new Uint8Array(32);
  window.crypto.getRandomValues(entropy);
  return {
    key: datona.crypto.generateKey(),
    chaincode: datona.crypto.uint8ArrayToHex(entropy)
  };
}


export function deriveKey(privateId, derivationFunction, index) {
  const derivationPath = derivationFunction(index);
  let bip32Node = bip32.fromPrivateKey(privateId.key.privateKey, datona.crypto.hexToUint8Array(privateId.chaincode));
  const childKey = bip32Node.derivePath(derivationPath);
  return new datona.crypto.Key(datona.crypto.uint8ArrayToHex(childKey.privateKey));
}

const DID_VERSION = 0;

export function createBubbleUrlStr(contractAddress, vaultServer, file) {
  const params = [];
  if (vaultServer) params.push("vault="+StringUtils.stringToBase58(vaultServer.id.replace('0x','')+vaultServer.url));
  if (file) params.push("file="+StringUtils.hexToBase58(file));
  const paramStr = params.length > 0 ? '?'+params.join('&') : "";
  const addressStr = StringUtils.hexToBase58(contractAddress);
  const versionStr = StringUtils.uintToBase58(DID_VERSION).padStart(2,'1');
  return "bubble:"+versionStr+addressStr+paramStr;
}

export function createDID(contractAddress, vaultServer, file) {
  return "did:"+createBubbleUrlStr(contractAddress, vaultServer, file);
}

export class BubbleUrl extends URL {

  constructor(url) {
    super(url);
    this.specificIdentifier = this.pathname;
    if (this.specificIdentifier.length < 3) throw new Error("invalid Bubble DID/URL - specific identifier is too short");
    this.version = StringUtils.base58ToUint(this.specificIdentifier.substring(0,2));
    this.address = StringUtils.base58ToHex(this.specificIdentifier.substring(2));
    if (!datona.assertions.isAddress(this.address)) throw new Error("invalid Bubble DID/URL - address is invalid")
    this._initialiseVaultServer();
    this._initialiseFile();
  }

  toString() {
    return createBubbleUrlStr(this.address, this.vaultServer, this.file);
  }

  _initialiseVaultServer() {
    const vaultBase58 = this.searchParams.get("vault");
    const encodedVault = vaultBase58 ? StringUtils.base58ToString(vaultBase58) : undefined;
    if (encodedVault) {
      if (encodedVault.length < 44) throw new Error("invalid Bubble DID/URL - vault parameter is invalid");
      const id = '0x'+encodedVault.substring(0, 40);
      const url = encodedVault.substring(40);
      if (!datona.assertions.isAddress(id)) throw new Error("invalid Bubble DID/URL - vault parameter id is not an address");
      this.vaultServer = {
        url: url,
        id: id
      }
    }
  }

  _initialiseFile() {
    const fileBase58 = this.searchParams.get("file");
    this.file = fileBase58 ? StringUtils.base58ToHex(fileBase58) : undefined;
    if (this.file && !datona.assertions.isAddress(this.file)) throw new Error("invalid Bubble DID/URL - file is invalid")
  }

}

BubbleUrl.fromAddress = (address, vaultServer, file) => {
  return new BubbleUrl(createBubbleUrlStr(address, vaultServer, file));
}

export class BubbleDIDURL extends BubbleUrl {

  constructor(did) {
    if (!did.startsWith("did:")) throw new Error("not a DID");
    super(did.substring(4));
    this.method = this.protocol;
    if (this.method !== "bubble:") throw new Error("not a Bubble DID");
    this.protocol = "did:";
    this.did = did;
  }

  toShortString() {
    const vaultFile = this.file && this.file !== PUBLIC_ID_FILE ? "&file="+StringUtils.stringToBase58(this.file) : "";
    return "did:bubble:"+this.specificIdentifier+vaultFile;
  }

  toString() {
    return createDID(this.address, this.vaultServer, this.file);
  }

}

BubbleDIDURL.fromAddress = (address, vaultServer, file) => {
  return new BubbleDIDURL(createDID(address, vaultServer, file));
}

export class DIDResolver {

  constructor(blockchainGateway) {
    this.blockchainGateway = blockchainGateway;
  }

  parseDID(did) {
    if (did instanceof BubbleDIDURL) return this.parseDidUrl(did);
    try {
      const url = new BubbleDIDURL(did);
      return this.parseDidUrl(url);
    }
    catch(error) {
      return Promise.reject(error);
    }
  }

  parseDidUrl(url) {
    const promise = url.vaultServer ? Promise.resolve(url.vaultServer) : this._fetchVaultServer(url.address);
    return promise
    .then(vaultServer => {
      url.vaultServer = vaultServer;
      url.file = url.file || PUBLIC_ID_FILE;
      return url;
    })
  }

  _fetchVaultServer(address) {
    return this.blockchainGateway.getVaultHash(address)
      .then(vaultHash => {
        const vaultServer = discoverVaultService(vaultHash);
        if (!vaultServer) throw new Error("Vault service with hash "+vaultHash+" is unknown");
        return vaultServer;
      })
  }

}


export function discoverVaultService(hash) {
  return knownVaultServers.find(srv => { return srv.hash === hash })
}

export function isBubbleDID(did) {
  if (!did || !did.substring) return false
  try {
    new BubbleDIDURL(did);
    return true;
  }
  catch(_) {
    return false 
  }
}

function _fetchDIDDocument(url, key) {
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.read(url.file)
    .then(json => {
      return JSON.parse(json);
    })
}

export function retrieveDIDDocument(did, didResolver, key) {
  console.trace("retrieving did document", did);
  return didResolver.parseDID(did)
    .then(url => {
      return _fetchDIDDocument(url, key);
    })
}

export function writeDIDDocument(did, didResolver, data, key, options={}) { 
  return didResolver.parseDID(did)
    .then(url => {
      return writeBubbleUrl(url, data, key, options);
    })
}

export const knownVaultServers = [
  {
    hash: "0x077db7b2f0d920ab1eaf5bcfac4e58281ba017ce4c646ea332486372212ffeef",
    name: "Bubble Private Cloud",
    id: "0x288b32F2653C1d72043d240A7F938a114Ab69584",
    url: "https://datonavault.com:8131"
  }
]

export function getVaultHash(vaultServer) {
  return datona.crypto.hash(vaultServer.url+'?id='+vaultServer.id);
}

const knownBubbles = [
  {
    id: "GenericApplicationBubble",
    version: "0.1",
    hash: "be382e4f326c5f8fa4e0668611b78e469b0eb9f42df3c9c18ff9110a09d4d94c",
    // abi: gabContract.abi,
    // bytecode: gabContract.bytecode,
    // runtimeBytecode: gabContract.runtimeBytecode
  }
]

function getBubbleSourceCode(id, version, hash) {
  return knownBubbles.find(b => { return b.id === id && b.version === version && b.hash === hash});
}

function fetchBubbleUrl(url, key) {
  if (!url.protocol) url = new BubbleUrl(url);
  console.trace("fetching bubble url", url)
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.read(url.file);
}

function writeBubbleUrl(url, data, key, options) {
  if (!url.protocol) url = new BubbleUrl(url);
  console.trace("writing bubble url", url, options);
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.write(data, url.file || options.file);
}

export function isUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

export function toUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    if (url.protocol === "did:" && url.pathname.startsWith("bubble:")) return new BubbleDIDURL(urlStr);
    else if (url.protocol === "bubble:") return new BubbleUrl(urlStr)
    else return url;
  } catch (_) {
    return undefined;
  }
}

export function fetchUrl(urlOrString, didResolver, key=randomKey) {
  if (datona.assertions.isString(urlOrString)) {
    try {
      const newUrl = new URL(urlOrString);
      if (newUrl.protocol === "did:" && newUrl.pathname.startsWith("bubble:")) return retrieveDIDDocument(urlOrString, didResolver, key);
      else if (newUrl.protocol === "bubble:") return fetchBubbleUrl(urlOrString, key);
      else return fetch(urlOrString).then(response => response.text());
    } catch (error) {
      return Promise.reject(error);
    }
  }
  else if (urlOrString.protocol === "did:" && urlOrString.method === "bubble:"){
    return _fetchDIDDocument(urlOrString, key)
  }
  else if (urlOrString.protocol === "bubble:") {
    return fetchBubbleUrl(urlOrString, key);
  }
  else return fetch(urlOrString).then(response => response.text());
}


export function writeUrl(urlOrString, data, didResolver, key=randomKey, options) {
  if (datona.assertions.isString(urlOrString)) {
    try {
      const newUrl = new URL(urlOrString);
      if (newUrl.protocol === "did:" && newUrl.pathname.startsWith("bubble:")) return writeDIDDocument(urlOrString, didResolver, key, options);
      else if (newUrl.protocol === "bubble:") return writeBubbleUrl(urlOrString, data, key, options);
      else return fetch(urlOrString, {method: "POST", body: data});
    } catch (error) {
      return Promise.reject(error);
    }
  }
  else if (urlOrString.protocol === "did:" && urlOrString.method === "bubble:"){
    return writeBubbleUrl(urlOrString, data, key, options)
  }
  else if (urlOrString.protocol === "bubble:") {
    return writeBubbleUrl(urlOrString, data, key, options);
  }
  else return fetch(urlOrString, {method: "POST", body: data});
}

export function paramToHex(param, byteLength, descriptiveName='parameter') {
  if (!param) throw new Error('missing '+descriptiveName);
  const baseHex = '0x'+'00'.repeat(byteLength)
  if (param.startsWith('0x')) return (baseHex+param.substring(2)).slice(-byteLength*2);
  else {
    const intParam = parseInt(param);
    if (isNaN(intParam)) throw new Error('invalid '+descriptiveName);
    return (baseHex+intParam.toString(16)).slice(-byteLength*2);
  }
}

export function readFile(filename, descriptiveName='file', options={}) {
  console.trace("reading file "+filename);
  if (!fs.existsSync(filename)) throw new Error(descriptiveName+' does not exist');
  return fs.readFileSync(filename, {encoding: options.encoding || 'utf8'});
}

const randomKey = datona.crypto.generateKey();

const bubbleUtils = {
  createRandomId: createRandomId,
  deriveKey: deriveKey,
  createBubbleUrlStr: createBubbleUrlStr,
  createDID: createDID,
  DIDResolver: DIDResolver,
  isBubbleDID: isBubbleDID,
  retrieveDIDDocument: retrieveDIDDocument,
  writeDIDDocument: writeDIDDocument,
  knownVaultServers: knownVaultServers,
  getBubbleSourceCode: getBubbleSourceCode,
  getVaultHash: getVaultHash,
  isUrl: isUrl,
  toUrl: toUrl,
  fetchUrl: fetchUrl,
  writeUrl: writeUrl,
  paramToHex: paramToHex,
  readFile: readFile
}

export default bubbleUtils;