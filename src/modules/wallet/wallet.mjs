import datona from "datona-lib";
import fs from 'fs';
import {APP_DIR as CONFIGURED_APP_DIR} from "../../config.mjs";

let APP_DIR;
let WALLET_DIR;
setAppDir(CONFIGURED_APP_DIR);
const DEFAULT_KEY = 'default-key';
const INITIAL_KEY = 'initial-application-key';

function checkApplicationDir() {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, {recursive: true});
    fs.chmodSync(APP_DIR, 0o700);
  }
}

export function getApplicationKey(label=DEFAULT_KEY) {
	try {
    if (!fs.existsSync(WALLET_DIR+'/'+label)) throw new Error('key does not exist');
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

function setApplicationKey(privateKey, label=DEFAULT_KEY, force=false) {
  checkApplicationDir();
  if (!fs.existsSync(WALLET_DIR)) fs.mkdirSync(WALLET_DIR, {recursive: true});
  if (label === INITIAL_KEY) throw new Error('cannot overwrite the initial-application-key - it connects this installation to your Bubble');
  if (!force && hasApplicationKey(label)) {
    throw new Error("application key '"+label+"' already exists");
  };
  fs.writeFileSync(WALLET_DIR+'/'+label, privateKey);
  if (label === DEFAULT_KEY && !hasApplicationKey(INITIAL_KEY)) fs.writeFileSync(WALLET_DIR+'/initial-application-key', privateKey);
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
  if (label === DEFAULT_KEY) throw new Error('cannot delete the default-key.  Use wallet.setDefault instead');
  if (label === INITIAL_KEY) throw new Error('cannot delete the initial-application-key - it connects this installation to your Bubble');
  if (!fs.existsSync(WALLET_DIR+'/'+label)) throw new Error('key does not exist');
  fs.unlinkSync(WALLET_DIR+'/'+label);
}

function setDefaultKey(label=INITIAL_KEY) {
  label = label.toLowerCase();
  if (!fs.existsSync(WALLET_DIR+'/'+label)) throw new Error('key does not exist');
  fs.copyFileSync(WALLET_DIR+'/'+label, WALLET_DIR+'/default-key');
}

function resetDefaultKey() {
  setDefaultKey();
}

function hasApplicationKey(label=DEFAULT_KEY) {
  return fs.existsSync(WALLET_DIR+'/'+label);
}

function listKeys(label) {
  if (!fs.existsSync(WALLET_DIR)) return [];
  let keyNames = fs.readdirSync(WALLET_DIR);
  if (label) keyNames = keyNames.filter(k => { return k === label })
  return keyNames.map(k => {
    const key = getApplicationKey(k);
    if (key) return {label: k, address: key.address, publicKey: '0x'+datona.crypto.uint8ArrayToHex(key.publicKey)}
    else return {label: k, address: 'error!', publicKey: ''}
  })
}

function getInfo(keyStr, options={}) {
  try {
    const addresses = listKeys(keyStr);
    let address = addresses.find(a => { return a.label === keyStr.toLowerCase() });
    if (address) {
      return {address: address.address, publicKey: address.publicKey}
    }
    else {
      if (keyStr && keyStr.startsWith('0x')) keyStr = keyStr.substring(2);
      const key = new datona.crypto.Key(keyStr);
      return {address: key.address, publicKey: '0x'+datona.crypto.uint8ArrayToHex(key.publicKey)}
    }
  }
  catch(error) {
    throw new Error("invalid private key");
  }
}

function setAppDir(appDir) {
  APP_DIR = appDir;
  WALLET_DIR = appDir+'/wallet';
}

function testPoint(appDir) {
  if (appDir) setAppDir(appDir);
}


const wallet = {
  getApplicationKey: getApplicationKey,
  addApplicationKey: addApplicationKey,
  createApplicationKey: createApplicationKey,
  removeApplicationKey: removeApplicationKey,
  setApplicationKey: setApplicationKey,
  hasApplicationKey: hasApplicationKey,
  listKeys: listKeys,
  getInfo: getInfo,
  setDefaultKey: setDefaultKey,
  resetDefaultKey: resetDefaultKey,
  testPoint: testPoint
}

export default wallet;
