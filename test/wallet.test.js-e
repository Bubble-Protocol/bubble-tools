import {assert, expect} from 'chai';
import wallet from '../src/modules/wallet/wallet.js';
import fs from 'fs';
import '../src/utils/log.js';

const TEST_KEYS = {
  key1: {
    privateKey: 'bf2ab3d3f4d017b1775dfae180da93d8bb6c4306327ec2bf24f92c8604440945',
    publicKey: '04ba032b6edcab16b0eb13e77891af30a8546c68ff4de508703623a1169dbaebcf87f27afc157f5c940092abd1c7060089b15ccf4104058fc0de8fe92a0f8181fc',
    address: '0x4e16dd537432447fb9cec2726252accb4514abae',
    did: 'did:bubble:11266kMKUHrQfZKGz2CuQwFsFWx4xd'
  },
  key2: {
    privateKey: 'c98ef00c9c97dfd3c690bb07c85cba7f8ceabfb789454487d89c14b799c3ac58',
    publicKey: '04f3c694cb873d84a82a8777081c6b1e004b860574748560d20a963020fd874b4849bed7464dcbc300e8f60b0291636acfceda7b4a968ce87513df450557de0969',
    address: '0x72e05725cd2d1fd3fb5df419d33c4cadc69fdfaf'
  },
  key3: {
    privateKey: 'aa5b21038ce72b9e52e274125ddc485c7da64f7f977ab0c15122b0674f3be46e',
    publicKey: '0464b184a4263e9845d032f070fc0144dd915502a5a76155dbb4707f4bd6c29df730556d209211e8460c5b50335b3731c7cee8385cce4d87842e2671b9af78ede3',
    address: '0xf34f78d14de047253f7f3f58206666e1ce3dfefc'
  },
  tempKey: {
    privateKey: 'e6e9b7d27d8c73c45b2e82f77ba05b001d8449a17d2b666add4610bd238c95a3',
    publicKey: '',
    address: '0x61f05023348c82b41509ebff37353f1bc8cfa480'
  }
}

function assertDefaultKeyState() {
  const defaultKey = wallet.getApplicationKey();
  assert.strictEqual(defaultKey.address, TEST_KEYS.key1.address);
  const initialAppKey = wallet.getApplicationKey('initial-application-key');
  assert.strictEqual(initialAppKey.address, TEST_KEYS.key1.address);
  const key1 = wallet.getApplicationKey('key1');
  assert.strictEqual(key1.address, TEST_KEYS.key1.address);
  const key2 = wallet.getApplicationKey('key2');
  assert.strictEqual(key2.address, TEST_KEYS.key2.address);
  const key3 = wallet.getApplicationKey('key3');
  assert.strictEqual(key3.address, TEST_KEYS.key3.address);
}

describe('Wallet', () => {
   
  describe('getInfo', () => {

    it('decodes a private key correctly', () => {
      const key = wallet.getInfo(TEST_KEYS.key1.privateKey);
      assert.strictEqual(key.address, TEST_KEYS.key1.address);
      assert.strictEqual(key.publicKey, TEST_KEYS.key1.publicKey);
    })
    
    it('decodes a private key prepended with "0x" correctly', () => {
      const key = wallet.getInfo('0x'+TEST_KEYS.key1.privateKey);
      assert.strictEqual(key.address, TEST_KEYS.key1.address);
      assert.strictEqual(key.publicKey, TEST_KEYS.key1.publicKey);
    })
    
    it('throws an invalid private key error if key is missing', () => {
      expect(() => {wallet.getInfo()}).to.throw('invalid private key');
    })
    
    it('throws an invalid private key error if key is invalid', () => {
      expect(() => {wallet.getInfo('invalid:'+TEST_KEYS.key1.privateKey)}).to.throw('invalid private key');
    })
    
  })

  describe('listKeys', () => {

    it('returns empty array if app directory does not exist', () => {
      wallet.testPoint('./non-existent-dir');
      const keys = wallet.listKeys();
      assert.isArray(keys);
      assert.strictEqual(keys.length, 0);
    })
    
    it('returns empty array if wallet directory does not exist', () => {
      const appDir = './test/test-dirs/empty-app-dir';
      assert(fs.existsSync(appDir), 'appDir does not exist');
      wallet.testPoint(appDir);
      const keys = wallet.listKeys();
      assert.isArray(keys);
      assert.strictEqual(keys.length, 0);
    })
    
    it('returns empty array if wallet directory is empty', () => {
      const appDir = './test/test-dirs/app-dir-with-empty-wallet';
      assert(fs.existsSync(appDir), 'appDir does not exist');
      wallet.testPoint(appDir);
      const keys = wallet.listKeys();
      assert.isArray(keys);
      assert.strictEqual(keys.length, 0);
    })
    
    it('returns empty array if wallet directory is empty and label is given', () => {
      const appDir = './test/test-dirs/app-dir-with-empty-wallet';
      assert(fs.existsSync(appDir), 'appDir does not exist');
      wallet.testPoint(appDir);
      const keys = wallet.listKeys('default-key');
      assert.isArray(keys);
      assert.strictEqual(keys.length, 0);
    })
    
    it('returns full wallet contents', () => {
      wallet.testPoint('./test/test-dirs/app-dir');
      const keys = wallet.listKeys();
      assert.isArray(keys);
      assert.strictEqual(keys.length, 5);
      assert.strictEqual(keys[0].address, TEST_KEYS.key1.address); // default-key
      assert.strictEqual(keys[0].publicKey, TEST_KEYS.key1.publicKey);
      assert.strictEqual(keys[1].address, TEST_KEYS.key1.address); // initial-application-key
      assert.strictEqual(keys[1].publicKey, TEST_KEYS.key1.publicKey);
      assert.strictEqual(keys[2].address, TEST_KEYS.key1.address);
      assert.strictEqual(keys[2].publicKey, TEST_KEYS.key1.publicKey);
      assert.strictEqual(keys[3].address, TEST_KEYS.key2.address);
      assert.strictEqual(keys[3].publicKey, TEST_KEYS.key2.publicKey);
      assert.strictEqual(keys[4].address, TEST_KEYS.key3.address);
      assert.strictEqual(keys[4].publicKey, TEST_KEYS.key3.publicKey);
    })
    
    it('returns just the requested key', () => {
      wallet.testPoint('./test/test-dirs/app-dir');
      const keys = wallet.listKeys('key1');
      assert.isArray(keys);
      assert.strictEqual(keys.length, 1);
      assert.strictEqual(keys[0].address, TEST_KEYS.key1.address);
      assert.strictEqual(keys[0].publicKey, TEST_KEYS.key1.publicKey);
    })
    
    it('returns empty array if the requested key does not exist', () => {
      wallet.testPoint('./test/test-dirs/app-dir');
      const keys = wallet.listKeys('key4');
      assert.isArray(keys);
      assert.strictEqual(keys.length, 0);
    })
    
  })

  describe('Creating, adding, setting & removing keys', () => {

    const appDir = './test/test-dirs/app-dir';
    const keyLabel = 'temp-key';

    before(() => {
      wallet.testPoint(appDir);
    })

    beforeEach(() => {
      assertDefaultKeyState();
    })

    afterEach(() => {
      assertDefaultKeyState();
    })

    function runCARTest(createFunction) {
      // check key does not already exist
      assert(!wallet.hasApplicationKey(keyLabel), keyLabel+' already exists');
      assert(!fs.existsSync(appDir+'/wallet/'+keyLabel), keyLabel+' file already exists');
      // create key and confirm
      createFunction();
      assert(fs.existsSync(appDir+'/wallet/'+keyLabel), keyLabel+' file was not created');
      assert(wallet.hasApplicationKey(keyLabel), keyLabel+' does not exist');
      const key = wallet.getApplicationKey(keyLabel);
      // check new key is valid and is different from the others
      assert.match(key.address, /^0x[0-9a-fA-F]{40}$/, 'new key address is invalid');
      assert.notStrictEqual(key.address, TEST_KEYS.key1.address);
      assert.notStrictEqual(key.address, TEST_KEYS.key2.address);
      assert.notStrictEqual(key.address, TEST_KEYS.key3.address);
      // check the default and initial keys are not affected
      const defaultKey = wallet.getApplicationKey();
      assert.strictEqual(defaultKey.address, TEST_KEYS.key1.address);
      const initialAppKey = wallet.getApplicationKey('initial-application-key');
      assert.strictEqual(initialAppKey.address, TEST_KEYS.key1.address);
      // remove key and confirm
      wallet.removeApplicationKey(keyLabel);
      assert(!wallet.hasApplicationKey(keyLabel), keyLabel+' was not removed');
      assert(!fs.existsSync(appDir+'/wallet/'+keyLabel), keyLabel+' file was not removed');
    }

    it('create fails if label is missing and default-key already exists', () => {
      expect(() => {
        wallet.createApplicationKey();
      })
      .to.throw();
    })
    
    it('create & remove new random key', () => {
      runCARTest(() => {
        wallet.createApplicationKey(keyLabel);
      });
    })
    
    it('add & remove new private key', () => {
      runCARTest(() => {
        wallet.addApplicationKey(keyLabel, TEST_KEYS.tempKey.privateKey);
      });
    })
    
    it('add fails if label is missing', () => {
      expect(() => {
        wallet.addApplicationKey(undefined, TEST_KEYS.tempKey.privateKey);
      })
      .to.throw();
    })
    
    it('add fails if private key is missing', () => {
      expect(() => {
        wallet.addApplicationKey(keyLabel);
      })
      .to.throw();
    })
    
    it('add & remove new private key using the setApplicationKey function', () => {
      runCARTest(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, keyLabel);
      });
    })
    
    it('remove initial-application-key fails', () => {
      expect(() => {
        wallet.removeApplicationKey('initial-application-key');
      })
      .to.throw();
    })
    
  })

  describe('Setting keys', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      wallet.testPoint(appDir);
    })
    
    beforeEach(() => {
      assertDefaultKeyState();
    })

    afterEach(() => {
      assertDefaultKeyState();
    })

    it('setting with no label fails if default-key already exists and no force option is given', () => {
      expect(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey);
      })
      .to.throw();
    })
    
    it('setting default-key fails if it already exists and no force option is given', () => {
      expect(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'default-key');
      })
      .to.throw();
    })
    
    it('setting initial-application-key fails when no force option is false', () => {
      expect(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'initial-application-key', false);
      })
      .to.throw();
    })
    
    it('setting initial-application-key fails when no force option is true', () => {
      expect(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'initial-application-key', true);
      })
      .to.throw();
    })
    
    it('overwriting existing key fails if it already exists and no force option is given', () => {
      expect(() => {
        wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'key1');
      })
      .to.throw();
    })
    
    it('overwrite existing key with force option', () => {
      wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'key1', true);
      const key = wallet.getApplicationKey('key1');
      assert.strictEqual(key.address, TEST_KEYS.tempKey.address);
      wallet.setApplicationKey(TEST_KEYS.key1.privateKey, 'key1', true);
    })
    
    it('overwrite default key with force option', () => {
      wallet.setApplicationKey(TEST_KEYS.tempKey.privateKey, 'default-key', true);
      const key = wallet.getApplicationKey();
      assert.strictEqual(key.address, TEST_KEYS.tempKey.address);
      wallet.setApplicationKey(TEST_KEYS.key1.privateKey, 'default-key', true);
    })
    
  })

  describe('Set/reset default key', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      wallet.testPoint(appDir);
    })
    
    beforeEach(() => {
      assertDefaultKeyState();
    })

    afterEach(() => {
      assertDefaultKeyState();
    })

    it('setting to key2 succeeds', () => {
      wallet.setDefaultKey('key2');
      const key = wallet.getApplicationKey();
      assert.strictEqual(key.address, TEST_KEYS.key2.address);
      wallet.resetDefaultKey();
    })
    
    it('fails if label does not exist', () => {
      expect(() => {
        wallet.setDefaultKey('key4');
      })
      .to.throw();
    })

  })



  describe('Startup Scenario', () => {

    const appDir = './test/test-dirs/startup-scenario-temp-app-dir';

    it('default and initial-application keys are created automatically when createApplicationKey is called', () => {
      wallet.testPoint(appDir);
      wallet.createApplicationKey();
      assert(fs.existsSync(appDir), 'appDir was not created');
      assert(fs.existsSync(appDir+'/wallet'), 'appDir/wallet was not created');
      assert(fs.existsSync(appDir+'/wallet/initial-application-key'), 'initial-application-key was not created');
      assert(fs.existsSync(appDir+'/wallet/default-key'), 'default-key was not created');
      const keys = wallet.listKeys();
      assert.isArray(keys);
      assert.strictEqual(keys.length, 2);
      assert.strictEqual(keys[0].label, 'default-key');
      assert.strictEqual(keys[1].label, 'initial-application-key');
      const key = wallet.getApplicationKey();
      assert.isObject(key);
      assert.match(key.address, /^0x[0-9a-fA-F]{40}$/, 'key address is invalid');
      const initialAppKey = wallet.getApplicationKey('initial-application-key');
      assert.strictEqual(initialAppKey.address, key.address, "addresses don't match");
      assert.deepEqual(initialAppKey.publicKey, key.publicKey, "public keys don't match");
    })

    afterEach( () => {
      fs.rmSync(appDir, {recursive: true, force: true});
      assert(!fs.existsSync(appDir), 'failed to remove appDir');
    })
    
  })

});