import { createRequire } from "module";
const require = createRequire(import.meta.url);
const defaultProviders = require('../../../providers.json');
import {APP_DIR as CONFIGURED_APP_DIR} from "../../config.js";
import fs from 'fs';


export const blockchainProviders = {

  getDefaultProvider: () =>  {
    return getProviders[0];
  },

  getProvider: (chain) => {
    const providerList = getProviders();
    if (!chain) return providerList[0];
    const provider = providerList.find(p => (p.chainId == chain || p.name === chain || p.nickname === chain || p.currency === chain));
    if (!provider || provider.type === 'unsupported') throw new Error('blockchain unsupported');
    return provider;
  },

  testPoint: (appDir) => {
    localProviders = undefined;
    if (appDir) setAppDir(appDir);
  }

}



//
// Providers file
//

let localProviders;
let APP_DIR;
let PROVIDERS_FILE;
setAppDir(CONFIGURED_APP_DIR);

function checkApplicationDir() {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, {recursive: true});
    fs.chmodSync(APP_DIR, 0o700);
  }
}

function setAppDir(appDir) {
  APP_DIR = appDir;
  PROVIDERS_FILE = APP_DIR+'/providers';
}

function getProviders() {
  if (localProviders) return localProviders;
	try {
    checkApplicationDir();
    if (!fs.existsSync(PROVIDERS_FILE)) {
      fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(defaultProviders));
      return defaultProviders;
    }
    const json = fs.readFileSync(PROVIDERS_FILE, {encoding: 'utf8'});
    return JSON.parse(json);
	}
	catch(error) {
		console.error(error);
    return [];
	}
}
