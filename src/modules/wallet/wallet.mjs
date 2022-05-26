import datona from "datona-lib";
import fs from 'fs';
import {APP_DIR} from "../../config.mjs";

const WALLET_DIR = APP_DIR+'/wallet';

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

const wallet = {
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

export default wallet;