import {assert, expect} from 'chai';
import addressBook from '../src/modules/address-book/address-book.mjs';
import fs from 'fs';
import '../src/utils/log.js';
import wallet from '../src/modules/wallet/wallet.mjs';

const TEST_ADDRESSES = {
  address1: {
    label: 'address1',
    privateKey: 'bf2ab3d3f4d017b1775dfae180da93d8bb6c4306327ec2bf24f92c8604440945',
    publicKey: '0x04ba032b6edcab16b0eb13e77891af30a8546c68ff4de508703623a1169dbaebcf87f27afc157f5c940092abd1c7060089b15ccf4104058fc0de8fe92a0f8181fc',
    address: '0x4e16dd537432447fb9cec2726252accb4514abae',
    did: 'did:bubble:11266kMKUHrQfZKGz2CuQwFsFWx4xd',
    memo: 'this is address 1'
  },
  address2: {
    label: 'address2',
    privateKey: 'c98ef00c9c97dfd3c690bb07c85cba7f8ceabfb789454487d89c14b799c3ac58',
    publicKey: '0x04f3c694cb873d84a82a8777081c6b1e004b860574748560d20a963020fd874b4849bed7464dcbc300e8f60b0291636acfceda7b4a968ce87513df450557de0969',
    address: '0x72e05725cd2d1fd3fb5df419d33c4cadc69fdfaf',
    memo: 'this is address 2'
  },
  address3: {
    label: 'address3',
    privateKey: 'aa5b21038ce72b9e52e274125ddc485c7da64f7f977ab0c15122b0674f3be46e',
    publicKey: '0x0464b184a4263e9845d032f070fc0144dd915502a5a76155dbb4707f4bd6c29df730556d209211e8460c5b50335b3731c7cee8385cce4d87842e2671b9af78ede3',
    address: '0xf34f78d14de047253f7f3f58206666e1ce3dfefc',
    memo: 'this is address 3'
  },
  tempAddress: {
    label: 'temp',
    privateKey: 'e6e9b7d27d8c73c45b2e82f77ba05b001d8449a17d2b666add4610bd238c95a3',
    publicKey: '',
    address: '0x61f05023348c82b41509ebff37353f1bc8cfa480',
    checksumAddress: '0x61F05023348C82B41509ebFf37353f1BC8cFA480',
    did: 'did:bubble:112N91mXn9hXDPzRhLePfieUoxwyyH',
    longDid: 'did:bubble:112N91mXn9hXDPzRhLePfieUoxwyyH?vault=221tjyCj4UxJTchXqL3JPjWnKNwoq7jSGK7e3toewPSSSHDCBAvXuK5b3vQ74SFvvPTPRbV3VXZxBXPakJbdbwBcTGNfi4W&file=11111111111111111112',
    memo: 'this is temp address'
  }
}

const TEST_SERVERS = {
  server1: {
    label: 'server1',
    url: 'https://server1.com',
    id: TEST_ADDRESSES.address1.address
  },
  server2: {
    label: 'server2',
    url: 'https://server2.com:1234',
    id: TEST_ADDRESSES.address2.address
  },
  server3: {
    label: 'server3',
    url: 'https://server3.co.uk:5678',
    id: TEST_ADDRESSES.address3.address
  },
  tempServer: {
    label: 'temp',
    url: 'https://temp.co.uk:1289',
    id: TEST_ADDRESSES.tempAddress.address
  }
}

function assertDefaultAddressBookState() {
  const addresses = addressBook.getAddressBook();
  assert.isArray(addresses);
  assert.strictEqual(addresses.length, 3);
  assertDefaultAddressesUnchanged(addresses);
}

function assertDefaultAddressesUnchanged(addresses) {
  assert.strictEqual(addresses[0].label, TEST_ADDRESSES.address1.label);
  assert.strictEqual(addresses[0].address, TEST_ADDRESSES.address1.address);
  assert.strictEqual(addresses[0].memo, TEST_ADDRESSES.address1.memo);
  assert.strictEqual(addresses[1].label, TEST_ADDRESSES.address2.label);
  assert.strictEqual(addresses[1].address, TEST_ADDRESSES.address2.address);
  assert.strictEqual(addresses[1].memo, TEST_ADDRESSES.address2.memo);
  assert.strictEqual(addresses[2].label, TEST_ADDRESSES.address3.label);
  assert.strictEqual(addresses[2].address, TEST_ADDRESSES.address3.address);
  assert.strictEqual(addresses[2].memo, TEST_ADDRESSES.address3.memo);
}

function assertDefaultServersState() {
  const servers = addressBook.getServers();
  assert.isArray(servers);
  assert.strictEqual(servers.length, 3);
  assertDefaultServersUnchanged(servers);
}

function assertDefaultServersUnchanged(servers) {
  assert.strictEqual(servers[0].label, TEST_SERVERS.server1.label);
  assert.strictEqual(servers[0].url, TEST_SERVERS.server1.url);
  assert.strictEqual(servers[0].id, TEST_SERVERS.server1.id);
  assert.strictEqual(servers[1].label, TEST_SERVERS.server2.label);
  assert.strictEqual(servers[1].url, TEST_SERVERS.server2.url);
  assert.strictEqual(servers[1].id, TEST_SERVERS.server2.id);
  assert.strictEqual(servers[2].label, TEST_SERVERS.server3.label);
  assert.strictEqual(servers[2].url, TEST_SERVERS.server3.url);
  assert.strictEqual(servers[2].id, TEST_SERVERS.server3.id);
}

describe('Address Book', () => {
  
  describe('getAddressBook', () => {

    it('returns empty array if app directory does not exist', () => {
      addressBook.testPoint('./non-existent-dir');
      const addresses = addressBook.getAddressBook();
      assert.isArray(addresses);
      assert.strictEqual(addresses.length, 0);
    })
    
    it('returns empty array if address book file does not exist', () => {
      const appDir = './test/test-dirs/empty-app-dir';
      assert(fs.existsSync(appDir), 'appDir does not exist');
      addressBook.testPoint(appDir);
      const addresses = addressBook.getAddressBook();
      assert.isArray(addresses);
      assert.strictEqual(addresses.length, 0);
    })
    
    it('returns full address book contents', () => {
      addressBook.testPoint('./test/test-dirs/app-dir');
      assertDefaultAddressBookState();
    })
    
  })

  describe('Adding & removing addresses', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      addressBook.testPoint(appDir);
    })

    beforeEach(() => {
      assertDefaultAddressBookState();
    })

    afterEach(() => {
      assertDefaultAddressBookState();
    })

    it('add fails if all fields are missing', () => {
      expect(() => {
        addressBook.addAddress();
      })
      .to.throw();
    })
    
    it('add fails if label is missing', () => {
      expect(() => {
        addressBook.addAddress(undefined, TEST_ADDRESSES.tempAddress.address, TEST_ADDRESSES.tempAddress.memo);
      })
      .to.throw();
    })
    
    it('add fails if address is missing', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, undefined, TEST_ADDRESSES.tempAddress.memo);
      })
      .to.throw();
    })
    
    it('add fails if address is not an address', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, 'not an address', TEST_ADDRESSES.tempAddress.memo);
      })
      .to.throw();
    })
    
    it('add fails if label already exists', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.address1.label, TEST_ADDRESSES.address1.address);
      })
      .to.throw('address with that label already exists');
    })
    
    it('add succeeds without a memo and remove by label succeeds', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address);
      })
      .to.not.throw();
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].label, TEST_ADDRESSES.tempAddress.label);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.tempAddress.address);
      assert.strictEqual(addresses[3].memo, undefined);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    })
    
    it('add succeeds with a memo and remove by label succeeds', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address, TEST_ADDRESSES.tempAddress.memo);
      })
      .to.not.throw();
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].label, TEST_ADDRESSES.tempAddress.label);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.tempAddress.address);
      assert.strictEqual(addresses[3].memo, TEST_ADDRESSES.tempAddress.memo);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    })
    
    it('add accepts a short did as the address', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.did);
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].label, TEST_ADDRESSES.tempAddress.label);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.tempAddress.address);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    })
    
    it('add succeeds even if address and memo already exists', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.address1.address, TEST_ADDRESSES.address1.memo);
      })
      .to.not.throw();
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].label, TEST_ADDRESSES.tempAddress.label);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.address1.address);
      assert.strictEqual(addresses[3].memo, TEST_ADDRESSES.address1.memo);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    })
    
    it('remove by label succeeds if label is a different case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address);
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    })
    
    it('labels are stored in lower case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase(), TEST_ADDRESSES.tempAddress.address);
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].label, TEST_ADDRESSES.tempAddress.label.toLowerCase());
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    })
    
    it('without the the toLowerCase option the address is saved in the given case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.checksumAddress);
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.tempAddress.checksumAddress);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    })
    
    it('with the toLowerCase option the address is saved in lower case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.checksumAddress, undefined, {toLowerCase: true});
      const addresses = addressBook.getAddressBook();
      assert.strictEqual(addresses.length, 4);
      assertDefaultAddressesUnchanged(addresses);
      assert.strictEqual(addresses[3].address, TEST_ADDRESSES.tempAddress.checksumAddress.toLowerCase());
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    })
    
  })

  describe('getServers', () => {

    it('returns empty array if app directory does not exist', () => {
      addressBook.testPoint('./non-existent-dir');
      const servers = addressBook.getServers();
      assert.isArray(servers);
      assert.strictEqual(servers.length, 0);
    })
    
    it('returns empty array if servers file does not exist', () => {
      const appDir = './test/test-dirs/empty-app-dir';
      assert(fs.existsSync(appDir), 'appDir does not exist');
      addressBook.testPoint(appDir);
      const servers = addressBook.getServers();
      assert.isArray(servers);
      assert.strictEqual(servers.length, 0);
    })
    
    it('returns full servers file contents', () => {
      addressBook.testPoint('./test/test-dirs/app-dir');
      assertDefaultServersState();
    })
    
  })

  describe('Adding & removing servers', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      addressBook.testPoint(appDir);
    })

    beforeEach(() => {
      assertDefaultServersState();
    })

    afterEach(() => {
      assertDefaultServersState();
    })

    it('add fails if all fields are missing', () => {
      expect(() => {
        addressBook.addServer();
      })
      .to.throw();
    })
    
    it('add fails if label is missing', () => {
      expect(() => {
        addressBook.addServer(undefined, TEST_SERVERS.tempServer.url, TEST_SERVERS.tempServer.id);
      })
      .to.throw();
    })
    
    it('add fails if url is missing', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, undefined, TEST_SERVERS.tempServer.id);
      })
      .to.throw();
    })
    
    it('add fails if id is missing', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.tempServer.url);
      })
      .to.throw();
    })
    
    it('add fails if url is not a url', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, 'not a url', TEST_SERVERS.tempServer.id);
      })
      .to.throw();
    })
    
    it('add fails if id is not a valid address', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.tempServer.url, TEST_SERVERS.tempServer.id+'0');
      })
      .to.throw();
    })
    
    it('add fails if label already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.server1.label, TEST_SERVERS.tempServer.url, TEST_SERVERS.tempServer.id);
      })
      .to.throw('server with that label already exists');
    })
    
    it('add succeeds and remove succeeds', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.tempServer.url, TEST_SERVERS.tempServer.id);
      })
      .to.not.throw();
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      assertDefaultServersUnchanged(servers);
      assert.strictEqual(servers[3].label, TEST_SERVERS.tempServer.label);
      assert.strictEqual(servers[3].url, TEST_SERVERS.tempServer.url);
      assert.strictEqual(servers[3].id, TEST_SERVERS.tempServer.id);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    })
    
    it('add succeeds even if url and id already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url, TEST_SERVERS.server1.id);
      })
      .to.not.throw();
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      assertDefaultServersUnchanged(servers);
      assert.strictEqual(servers[3].label, TEST_SERVERS.tempServer.label);
      assert.strictEqual(servers[3].url, TEST_SERVERS.server1.url);
      assert.strictEqual(servers[3].id, TEST_SERVERS.server1.id);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    })
    
    it('remove by label succeeds if label is a different case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url, TEST_SERVERS.server1.id);
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      addressBook.removeServer(TEST_SERVERS.tempServer.label.toUpperCase());
    })
    
    it('labels are stored in lower case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label.toUpperCase(), TEST_SERVERS.server1.url, TEST_SERVERS.server1.id);
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      assertDefaultServersUnchanged(servers);
      assert.strictEqual(servers[3].label, TEST_SERVERS.tempServer.label.toLowerCase());
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    })
    
  })

  describe('Startup Scenario', () => {

    const appDir = './test/test-dirs/address-book-startup-scenario-temp-app-dir';

    it('app dir and addresses file are created automatically when addAddress is called', () => {
      addressBook.testPoint(appDir);
      addressBook.addAddress('address1', TEST_ADDRESSES.address1.address, TEST_ADDRESSES.address1.memo);
      assert(fs.existsSync(appDir), 'appDir was not created');
      assert(fs.existsSync(appDir+'/addresses'), 'appDir/addresses was not created');
      const json = fs.readFileSync(appDir+'/addresses', {encoding: 'utf8'});
      const addresses = JSON.parse(json);
      assert.isArray(addresses);
      assert.strictEqual(addresses.length, 1);
      assert.strictEqual(addresses[0].label, 'address1');
      assert.strictEqual(addresses[0].address, TEST_ADDRESSES.address1.address);
      assert.strictEqual(addresses[0].memo, TEST_ADDRESSES.address1.memo);
    })

    it('app dir and servers file are created automatically when addServer is called', () => {
      addressBook.testPoint(appDir);
      addressBook.addServer(TEST_SERVERS.server1.label, TEST_SERVERS.server1.url, TEST_SERVERS.server1.id);
      assert(fs.existsSync(appDir), 'appDir was not created');
      assert(fs.existsSync(appDir+'/servers'), 'appDir/servers was not created');
      const json = fs.readFileSync(appDir+'/servers', {encoding: 'utf8'});
      const servers = JSON.parse(json);
      assert.isArray(servers);
      assert.strictEqual(servers.length, 1);
      assert.strictEqual(servers[0].label, TEST_SERVERS.server1.label);
      assert.strictEqual(servers[0].url, TEST_SERVERS.server1.url);
      assert.strictEqual(servers[0].id, TEST_SERVERS.server1.id);
    })

    afterEach( () => {
      fs.rmSync(appDir, {recursive: true, force: true});
      assert(!fs.existsSync(appDir), 'failed to remove appDir');
    })
    
  })


  describe('parseServer', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      addressBook.testPoint(appDir);
    })

    it('retrieves a server from the address book', () => {
      const server = addressBook.parseServer(TEST_SERVERS.server1.label);
      assert.strictEqual(server.label, TEST_SERVERS.server1.label);
      assert.strictEqual(server.url, TEST_SERVERS.server1.url);
      assert.strictEqual(server.id, TEST_SERVERS.server1.id);
    })

    it('parses a valid server url', () => {
      const url = TEST_SERVERS.server1.url+'/path1/path2'
      const server = addressBook.parseServer(url+'?id='+TEST_SERVERS.server1.id);
      assert.strictEqual(server.url, url);
      assert.strictEqual(server.id, TEST_SERVERS.server1.id);
    })

    it('returns undefined if url is invalid', () => {
      const url = 'invalid url'
      const server = addressBook.parseServer(url+'?id='+TEST_SERVERS.server1.id);
      assert.isUndefined(server);
    })

    it('returns undefined if id is missing', () => {
      const url = TEST_SERVERS.server1.url+'/path1/path2'
      const server = addressBook.parseServer(url);
      assert.isUndefined(server);
    })

    it('returns undefined if id is invalid', () => {
      const url = TEST_SERVERS.server1.url+'/path1/path2'
      const server = addressBook.parseServer(url+'?id=hello');
      assert.isUndefined(server);
    })

    it('throws if silent option is false', () => {
      const url = 'invalid url'
      expect(() => {
        addressBook.parseServer(url+'?id='+TEST_SERVERS.server1.id, false);
      })
      .to.throw();
    })

  })

  describe('parseAddress', () => {

    const appDir = './test/test-dirs/app-dir';

    before(() => {
      addressBook.testPoint(appDir);
      wallet.testPoint(appDir);
    })

    it('retrieves an address from the address book', () => {
      const address = addressBook.parseAddress(TEST_ADDRESSES.address1.label, false);
      assert.strictEqual(address, TEST_ADDRESSES.address1.address);
    })

    it('retrieves an address from the address book regardless of case', () => {
      const address = addressBook.parseAddress(TEST_ADDRESSES.address1.label.toUpperCase(), false);
      assert.strictEqual(address, TEST_ADDRESSES.address1.address);
    })

    it('retrieves a wallet address', () => {
      const address = addressBook.parseAddress('key1', false);
      assert.strictEqual(address, TEST_ADDRESSES.address1.address);
    })

    it('retrieves a did', () => {
      const address = addressBook.parseAddress(TEST_ADDRESSES.address1.did, false);
      assert.strictEqual(address, TEST_ADDRESSES.address1.address);
    })

    it('rejects if the string an unknown address, server or wallet label', () => {
      expect(() => {
        console.log(addressBook.parseAddress('unknownLabel', false));
      })
      .to.throw('address is invalid');
    })

    it('parses a 20-byte hex address prefix', () => {
      const addressIn = '0x4e16dd537432447fb9cec2726252accb4514abae';
      const address = addressBook.parseAddress(addressIn, false);
      assert.strictEqual(address, addressIn);
    })

    it('rejects if the address is missing', () => {
      expect(() => {
        console.log(addressBook.parseAddress(undefined, false));
      })
      .to.throw('address is invalid');
    })

    it('rejects if the address is not a string', () => {
      expect(() => {
        console.log(addressBook.parseAddress(45, false));
      })
      .to.throw('address is invalid');
    })

    it('rejects a 20-byte address without 0x prefix', () => {
      const addressIn = '4e16dd537432447fb9cec2726252accb4514abae';
      expect(() => {
        console.log(addressBook.parseAddress(addressIn, false));
      })
      .to.throw('address is invalid');
    })

    it('parses a number as a decimal address', () => {
      const addressIn = '45';
      const address = addressBook.parseAddress(addressIn, false);
      assert.strictEqual(address, '0x000000000000000000000000000000000000002d');
    })

    it('parses the zero address in decimal', () => {
      const addressIn = '0';
      const address = addressBook.parseAddress(addressIn, false);
      assert.strictEqual(address, '0x0000000000000000000000000000000000000000');
    })

    it('parses the zero address in hex', () => {
      const addressIn = '0x0';
      const address = addressBook.parseAddress(addressIn, false);
      assert.strictEqual(address, '0x0000000000000000000000000000000000000000');
    })

    it('parses a bubble FS dir/file path', () => {
      const addressIn = TEST_ADDRESSES.address1.address;
      const address = addressBook.parseAddress(addressIn+'/filename', false);
      assert.strictEqual(address, addressIn+'/filename');
    })

    it('parses a bubble FS dir/file path with dir in decimal', () => {
      const addressIn = '10';
      const address = addressBook.parseAddress(addressIn+'/filename', false);
      assert.strictEqual(address, '0x000000000000000000000000000000000000000a'+'/filename');
    })

    it('parses a bubble FS dir/file path with dir in hex', () => {
      const addressIn = '0x2';
      const address = addressBook.parseAddress(addressIn+'/filename', false);
      assert.strictEqual(address, '0x0000000000000000000000000000000000000002'+'/filename');
    })

    it('rejects if hex address is zero length', () => {
      const addressIn = '0x';
      expect(() => {
        addressBook.parseAddress(addressIn, false);
      })
      .to.throw();
    })

    it('rejects if hex address is too long', () => {
      const addressIn = TEST_ADDRESSES.address1.address+'0';
      expect(() => {
        addressBook.parseAddress(addressIn, false);
      })
      .to.throw();
    })

    it('returns undefined if default silent option is not overridden', () => {
      const addressIn = '0x';
      const address = addressBook.parseAddress(addressIn);
    })

    it('throws with a specified descriptive name if given', () => {
      const addressIn = TEST_ADDRESSES.address1.address+'0';
      expect(() => {
        addressBook.parseAddress(addressIn, false, 'Test string');
      })
      .to.throw('Test string is invalid');
    })
  
  })

});