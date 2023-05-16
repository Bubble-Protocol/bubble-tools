import { createRequire } from "module";
const require = createRequire(import.meta.url);
const providerList = require('./providers.json');


export const blockchainProviders = {

  getDefaultProvider: () =>  {
    return providerList[0];
  },

  getProvider: (chain) => {
    if (!chain) return providerList[0];
    const provider = providerList.find(p => (p.chainId == chain || p.name === chain || p.nickname === chain || p.currency === chain));
    if (!provider || provider.type === 'unsupported') throw new Error('blockchain unsupported');
    return provider;
  },

  testPoint: (testProviders) => {
    providerList = testProviders;
  }

}

