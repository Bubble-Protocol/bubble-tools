import {assert, expect} from 'chai';
import addressBook from '../src/modules/address-book/address-book.js';
import fs from 'fs';
import '../src/utils/log.js';
import wallet from '../src/modules/wallet/wallet.js';

const TEST_ADDRESSES = {
  key1: {
    label: 'key1',
    address: '0x4e16dd537432447fb9cec2726252accb4514abae',
    memo: 'key1 address from wallet'
  },
  address1: {
    label: 'address1',
    address: '0x1111111111111111111111111111111111111111',
    did: 'did:bubble:11EnrGHeqCd5UQ2jTW2Mo32o6a2GG',
    memo: 'this is address 1'
  },
  address2: {
    label: 'address2',
    address: '0x2222222222222222222222222222222222222222',
    memo: 'this is address 2'
  },
  address3: {
    label: 'address3',
    address: '0x3333333333333333333333333333333333333333',
    memo: 'this is address 3'
  },
  tempAddress: {
    label: 'temp',
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
    url: 'https://server1.com'
  },
  server2: {
    label: 'server2',
    url: 'https://server2.com:1234'
  },
  server3: {
    label: 'server3',
    url: 'https://server3.co.uk:5678'
  },
  tempServer: {
    label: 'temp',
    url: 'https://temp.co.uk:1289'
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
  assert.strictEqual(servers[1].label, TEST_SERVERS.server2.label);
  assert.strictEqual(servers[1].url, TEST_SERVERS.server2.url);
  assert.strictEqual(servers[2].label, TEST_SERVERS.server3.label);
  assert.strictEqual(servers[2].url, TEST_SERVERS.server3.url);
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
        addressBook.addServer(undefined, TEST_SERVERS.tempServer.url);
      })
      .to.throw();
    })
    
    it('add fails if url is missing', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, undefined);
      })
      .to.throw();
    })
    
    it('add fails if url is not a url', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, 'not a url');
      })
      .to.throw();
    })
    
    it('add fails if label already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.server1.label, TEST_SERVERS.tempServer.url);
      })
      .to.throw('server with that label already exists');
    })
    
    it('add succeeds and remove succeeds', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.tempServer.url);
      })
      .to.not.throw();
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      assertDefaultServersUnchanged(servers);
      assert.strictEqual(servers[3].label, TEST_SERVERS.tempServer.label);
      assert.strictEqual(servers[3].url, TEST_SERVERS.tempServer.url);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    })
    
    it('add succeeds even if url already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url);
      })
      .to.not.throw();
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      assertDefaultServersUnchanged(servers);
      assert.strictEqual(servers[3].label, TEST_SERVERS.tempServer.label);
      assert.strictEqual(servers[3].url, TEST_SERVERS.server1.url);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    })
    
    it('remove by label succeeds if label is a different case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url);
      const servers = addressBook.getServers();
      assert.strictEqual(servers.length, 4);
      addressBook.removeServer(TEST_SERVERS.tempServer.label.toUpperCase());
    })
    
    it('labels are stored in lower case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label.toUpperCase(), TEST_SERVERS.server1.url);
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
    })

    it('rejects if url is missing', () => {
      expect(() => {
        addressBook.parseServer(undefined, false);
      })
      .to.throw('url is missing');
    })

    it('rejects if url is invalid', () => {
      const url = 'invalid url'
      expect(() => {
        addressBook.parseServer(url, false);
      })
      .to.throw('url is invalid');
    })

    it('returns undefined for invalid url if silent option is not overridden', () => {
      const url = 'invalid url'
      const address = addressBook.parseServer(url);
      assert.isUndefined(address);
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
      assert.strictEqual(address, TEST_ADDRESSES.key1.address);
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

    it('returns undefined for invalid address if default silent option is not overridden', () => {
      const addressIn = '0x';
      const address = addressBook.parseAddress(addressIn);
      assert.isUndefined(address);
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