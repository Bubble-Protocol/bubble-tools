/**
 * General Bubble-related utility functions
 */

import datona from 'datona-lib';
import StringUtils from './string-utils.mjs';
import bip32 from 'bip32';

// Default vault file containing a persona's public identity (nickname & icon)
const PUBLIC_ID_FILE = "0x0000000000000000000000000000000000000102";


/**
 * Creates a new random Bubble ID - an object containing:
 *   key: random private key (as a datona-lib Key object)
 *   chaincode: random chaincode
 */
export function createRandomId() {
  // TODO use decent random number generator and accept entropy from UI
  const entropy = new Uint8Array(32);
  window.crypto.getRandomValues(entropy);
  return {
    key: datona.crypto.generateKey(),
    chaincode: datona.crypto.uint8ArrayToHex(entropy)
  };
}


/**
 * Returns a new private key (datona-lib Key object) derived deterministically from the given bubble id and 
 * derivation function and index using BIP32.
 * 
 * The derivation function is a function of the form f(index) => bip32_derivation_path_string
 */
export function deriveKey(privateId, derivationFunction, index) {
  const derivationPath = derivationFunction(index);
  let bip32Node = bip32.fromPrivateKey(privateId.key.privateKey, datona.crypto.hexToUint8Array(privateId.chaincode));
  const childKey = bip32Node.derivePath(derivationPath);
  return new datona.crypto.Key(datona.crypto.uint8ArrayToHex(childKey.privateKey));
}


//
// Bubble Decentralised Identifier utils
//

// version of Bubble DIDs included in did urls
const DID_VERSION = 0;

/**
 * Builds a Bubble url for a given file within a bubble.  
 * 
 * vaultServer is an object containing the server's url string and public address as {url: <urlString>, id: <publicAddress>}
 * 
 * The vaultServer and file parameters are optional.  Upon decoding a bubble url without a vault server Bubble will
 * attempt to retrieve the server information from the smart contract.  Upon decoding a bubble url without a file
 * Bubble will assume the file is the PUBLIC_ID_FILE.  This supports the short form of url representing a user's 
 * persona.
 * 
 * Bubble URLs are of the form:
 * 
 *   bubble:<b58 encoded version (2-bytes)><b58 encoded contract address><b58 encoded url parameters 'vault' and 'file' if given>
 */
export function createBubbleUrlStr(contractAddress, vaultServer, file) {
  const params = [];
  if (vaultServer && vaultServer.url && vaultServer.id) {
    params.push("vault="+StringUtils.stringToBase58(vaultServer.id.replace('0x','')+vaultServer.url));
  }
  if (file) params.push("file="+StringUtils.hexToBase58(file));
  const paramStr = params.length > 0 ? '?'+params.join('&') : "";
  const addressStr = StringUtils.hexToBase58(contractAddress);
  const versionStr = StringUtils.uintToBase58(DID_VERSION).padStart(2,'1');
  return "bubble:"+versionStr+addressStr+paramStr;
}


/**
 * Creates a Bubble DID url for a given file within a bubble.  
 * See createBubbleUrlStr for parameter information.
 */
export function createDID(contractAddress, vaultServer, file) {
  return "did:"+createBubbleUrlStr(contractAddress, vaultServer, file);
}

/**
 * Extension of the URL class with the Bubble-specific fields: version, address, vaultServer and file.
 * 
 * Can be constructed in two ways:
 *   - new BubbleUrl(<url_string>)
 *   - BubbleUrl.fromAddress(<contract_address>, [vaultServer], [file])
 * 
 * Throws an error if the url does not have 'bubble:' as it's protocol or if it contains an invalid address, 
 * vault parameter or file parameter.
 */
export class BubbleUrl extends URL {

  constructor(url) {
    super(url);
    if (this.protocol !== "bubble:") throw new Error("not a Bubble URL");
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

/**
 * Extension of the URL class with the Bubble DID-specific fields: method, version, address, vaultServer and file.
 * Currently supports the 'bubble:' method, i.e. did:bubble:...
 * 
 * Can be constructed in two ways:
 *   - new BubbleDIDUrl(<url_string>)
 *   - BubbleDIDUrl.fromAddress(<contract_address>, [vaultServer], [file])
 * 
 * Throws an error if the url does not have 'did:' as it's protocol, has an unsupported method, or if it contains 
 * an invalid address, vault parameter or file parameter.
 */
 export class BubbleDIDURL extends BubbleUrl {

  constructor(did) {
    if (!did.startsWith("did:")) throw new Error("not a DID");
    super(did.substring(4));
    this.method = this.protocol;
    this.protocol = "did:";
    this.did = did;
  }

  // returns a short version of this url - one without the vaultserver information which can be retrieved from
  // the smart contract
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

/**
 * A DIDResolver resolves a Bubble DID from a Bubble short-DID, one without the vault server information.
 * It attempts to resolve the vault server information by reading the vault hash from the short-DID's 
 * smart contract address and looking it up in a table of known Bubble servers.
 * 

 */
 export class DIDResolver {

  // Constructed with a blockchainGateway object that must contain the function getVaultHash(<contract_address>).
  // That function must return undefined or a string containing the hash retrieved from the given smart contract
  // address.
  constructor(blockchainGateway) {
    this.blockchainGateway = blockchainGateway;
  }

  // Promises to resolve the given did url string or BubbleDIDURL object.  See parseDidUrl below.
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

  // Promises to resolve the given BubbleDIDURL object.  If successful, the given url object will contain populated
  // vaultServer and file properties.  If the given url object does not already contain a file property it will be
  // set to PUBLIC_ID_FILE on the assumption that this is a did representing a persona's public identity.
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


/**
 * Looks up the given hash in the table of known vault servers returning a vault server object of the form
 * {url: <server_url_string>, id: <server_public_address>}
 */
export function discoverVaultService(hash) {
  return knownVaultServers.find(srv => { return srv.hash === hash })
}

/**
 * Returns true if the given parameter is a string containing a Bubble DID url.  False otherwise.
 */
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

/**
 * Promises to resolve the contents of the DID document at the given BubbleDIDURL.  Requires a datona-lib 
 * Key to read the file.
 */
function _fetchDIDDocument(url, key) {
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.read(url.file)
    .then(json => {
      return JSON.parse(json);
    })
}

/**
 * Promises to resolve the contents of the DID document at the given url string or BubbleDIDURL.  If the
 * url is of short-did form then it will be resolved using the given didResolver. If a key is not given
 * the file must be public or the action will be rejected.
 */
 export function retrieveDIDDocument(did, didResolver, key=randomKey) {
  console.trace("retrieving did document", did);
  return didResolver.parseDID(did)
    .then(url => {
      return _fetchDIDDocument(url, key);
    })
}

/**
 * Promises to write the given data to the DID document file at the given url string or BubbleDIDURL.  If the
 * url is of short-did form then it will be resolved using the given didResolver. If a key is not given
 * the file must be public or the action will be rejected.  Options are passed on to datona-lib.
 */
export function writeDIDDocument(did, didResolver, data, key=randomKey, options={}) { 
  return didResolver.parseDID(did)
    .then(url => {
      return writeBubbleUrl(url, data, key, options);
    })
}

// Temporary table of known vault servers
export const knownVaultServers = [
  {
    hash: "0x077db7b2f0d920ab1eaf5bcfac4e58281ba017ce4c646ea332486372212ffeef",
    name: "Bubble Private Cloud",
    id: "0x288b32F2653C1d72043d240A7F938a114Ab69584",
    url: "https://datonavault.com:8131"
  }
]


/**
 * Utility function to construct a vault hash from the given vault server information
 */
export function getVaultHash(vaultServer) {
  return datona.crypto.hash(vaultServer.url+'?id='+vaultServer.id);
}

// Table of known Bubble types
const knownBubbles = [
  {
    id: "GenericApplicationBubble",
    version: "0.1",
    hash: "be382e4f326c5f8fa4e0668611b78e469b0eb9f42df3c9c18ff9110a09d4d94c",
  }
]

/**
 * Returns the source code for given bubble type or undefined if the bubble type is not known.
 */
function getBubbleSourceCode(id, version, hash) {
  return knownBubbles.find(b => { return b.id === id && b.version === version && b.hash === hash});
}

/**
 * Promises to resolve the contents of the file at the given bubble url string or BubbleURL object.  If a key is not given
 * the file must be public or the action will be rejected.
 */
function fetchBubbleUrl(url, key=randomKey) {
  if (!url.protocol) url = new BubbleUrl(url);
  console.trace("fetching bubble url", url)
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.read(url.file);
}

/**
 * Promises to write the given data to the file at the given bubble url string or BubbleURL object.  If a key is not given
 * the file must be public or the action will be rejected.  Options are passed on to datona-lib.
 */
function writeBubbleUrl(url, data, key=randomKey, options) {
  if (!url.protocol) url = new BubbleUrl(url);
  console.trace("writing bubble url", url, options);
  const vault = new datona.vault.RemoteVault(StringUtils.stringToUrl(url.vaultServer.url), url.address.toLowerCase(), key, url.vaultServer.id);
  return vault.write(data, url.file || options.file);
}

/**
 * Returns true if the parameter is a url string.  False otherwise.
 */
export function isUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Returns either a BubbleDIDURL, BubbleURL or URL object from the given url string, or undefined if not a URL.
 */
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

/**
 * Promises to resolve the contents of the file at the given url.  Supports standard URLs, 
 * Bubble URLs and Bubble DID URLs.  If a key is not given the file must be public or the 
 * action will be rejected.
 */
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


/**
 * Promises to write the given data to the file at the given url.  Supports standard URLs, 
 * Bubble URLs and Bubble DID URLs.  If a key is not given the file must be public or the 
 * action will be rejected.  Options are passed on to datona-lib.
 */
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


// Random Key object used to interact with public bubble files
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
  writeUrl: writeUrl
}

export default bubbleUtils;