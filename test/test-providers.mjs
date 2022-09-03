import {assert, expect} from 'chai';
import fs from 'fs';
import {getDefaultProvider, testPoint} from '../src/modules/blockchain/providers.mjs';
import '../src/utils/log.js';

describe('Providers', () => {
   
  function checkProvider(provider) {
    assert.isObject(provider, 'provider not an object');
    assert.isObject(provider.blockchain, 'provider.blockchain not an object');
    assert.isString(provider.blockchainUrl, 'provider.blockchainUrl not a string');
  }

  it("does not create the appdir if it doesn't exist", () => {
    const appDir = './non-existent-dir';
    assert(!fs.existsSync(appDir), 'appDir exists');
    testPoint(appDir);
    const provider = getDefaultProvider();
    assert(!fs.existsSync(appDir), 'appDir should not have been created');
  })

  it("returns bubblenet if appdir doesn't exist", () => {
    const appDir = './non-existent-dir';
    assert(!fs.existsSync(appDir), 'appDir exists');
    testPoint(appDir);
    const provider = getDefaultProvider();
    checkProvider(provider);
    assert.strictEqual(provider.blockchain.name, 'bubblenet');
  })

  it("creates the providers config file and returns bubblenet if it doesn't exist and appdir does exist", () => {
    const appDir = './test/test-dirs/empty-app-dir';
    const expectedProviderFile = appDir+'/provider';
    assert(fs.existsSync(appDir), 'appDir does not exist');
    testPoint(appDir);
    const provider = getDefaultProvider();
    assert(fs.existsSync(expectedProviderFile), 'provider file has not been created');
    checkProvider(provider);
    assert.strictEqual(provider.blockchain.name, 'bubblenet');
    fs.unlinkSync(expectedProviderFile); // tidy up
    assert(!fs.existsSync(expectedProviderFile), 'provider file has not been tidied up after test');
  })

  it("returns bubblenet correctly when run twice (i.e. after it has created the provider file)", () => {
    const appDir = './test/test-dirs/empty-app-dir';
    const expectedProviderFile = appDir+'/provider';
    assert(fs.existsSync(appDir), 'appDir does not exist');
    testPoint(appDir);
    const dummyProvider = getDefaultProvider();
    assert(fs.existsSync(expectedProviderFile), 'provider file has not been created');
    const provider = getDefaultProvider();
    checkProvider(provider);
    assert.strictEqual(provider.blockchain.name, 'bubblenet');
    fs.unlinkSync(expectedProviderFile); // tidy up
    assert(!fs.existsSync(expectedProviderFile), 'provider file has not been tidied up after test');
  })

  it("returns a pre-configured provider file and does not overwrite it", () => {
    const appDir = './test/test-dirs/app-dir';
    const expectedProviderFile = appDir+'/provider';
    assert(fs.existsSync(expectedProviderFile), 'test provider file does not exist');
    testPoint(appDir);
    const provider1 = getDefaultProvider();
    checkProvider(provider1);
    assert.strictEqual(provider1.blockchain.name, 'testnet');
    assert.strictEqual(provider1.blockchainUrl, 'https://testnet.com:1234');
    const provider2 = getDefaultProvider();
    checkProvider(provider2);
    assert.strictEqual(provider2.blockchain.name, 'testnet');
    assert.strictEqual(provider1.blockchainUrl, 'https://testnet.com:1234');
  })

  describe('Throws with a meaningful error', () => {

    const appDir = './test/test-dirs/empty-app-dir';
    const providerFile = appDir+'/provider';

    const DEFAULT_EXPECTED_ERROR_MESSAGE = new RegExp("invalid provider configuration.*"+providerFile);

    function setupTest(providerFileContents) {
      assert(fs.existsSync(appDir), 'appDir does not exist');
      fs.writeFileSync(providerFile, providerFileContents);
      assert(fs.existsSync(providerFile), 'test provider file was not created');
      testPoint(appDir);
    }

    function test(providerFileContents, expectedError=DEFAULT_EXPECTED_ERROR_MESSAGE) {
      setupTest(providerFileContents);
      expect( () => { 
        getDefaultProvider();
      })
      .to.throw(expectedError);
    }

    before( () => {
      // control test case
      setupTest('{"blockchain":{"name":"testnet"},"blockchainUrl":"https://testnet.com:1234"}');
      expect( () => { 
        const provider = getDefaultProvider();
        assert.strictEqual(provider.blockchain.name, 'testnet');
        assert.strictEqual(provider.blockchainUrl, 'https://testnet.com:1234');
      })
      .to.not.throw();
    })

    afterEach( () => {
      fs.unlinkSync(providerFile);
      assert(!fs.existsSync(providerFile), 'provider file has not been tidied up after test');
    })

    it("if provider file is not JSON", () => {
      test("invalid JSON", /invalid provider configuration.*JSON/);
    })

    it("if provider is not an object", () => {
      test("[]");
    })

    it("if provider does not have the blockchain field", () => {
      test('{"blockchainUrl":"https://testnet.com:1234"}');
    })

    it("if provider does not have the blockchainUrl field", () => {
      test('{"blockchain":{"name":"testnet"}}');
    })

  })

})
    
