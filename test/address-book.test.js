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
};

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
};

function assertDefaultAddressBookState() {
  const addresses = addressBook.getAddressBook();
  expect(Array.isArray(addresses)).toBe(true);
  expect(addresses).toHaveLength(3);
  assertDefaultAddressesUnchanged(addresses);
}

function assertDefaultAddressesUnchanged(addresses) {
  expect(addresses[0].label).toBe(TEST_ADDRESSES.address1.label);
  expect(addresses[0].address).toBe(TEST_ADDRESSES.address1.address);
  expect(addresses[0].memo).toBe(TEST_ADDRESSES.address1.memo);
  expect(addresses[1].label).toBe(TEST_ADDRESSES.address2.label);
  expect(addresses[1].address).toBe(TEST_ADDRESSES.address2.address);
  expect(addresses[1].memo).toBe(TEST_ADDRESSES.address2.memo);
  expect(addresses[2].label).toBe(TEST_ADDRESSES.address3.label);
  expect(addresses[2].address).toBe(TEST_ADDRESSES.address3.address);
  expect(addresses[2].memo).toBe(TEST_ADDRESSES.address3.memo);
}

function assertDefaultServersState() {
  const servers = addressBook.getServers();
  expect(Array.isArray(servers)).toBe(true);
  expect(servers).toHaveLength(3);
  assertDefaultServersUnchanged(servers);
}

function assertDefaultServersUnchanged(servers) {
  expect(servers[0].label).toBe(TEST_SERVERS.server1.label);
  expect(servers[0].url).toBe(TEST_SERVERS.server1.url);
  expect(servers[1].label).toBe(TEST_SERVERS.server2.label);
  expect(servers[1].url).toBe(TEST_SERVERS.server2.url);
  expect(servers[2].label).toBe(TEST_SERVERS.server3.label);
  expect(servers[2].url).toBe(TEST_SERVERS.server3.url);
}

describe('Address Book', () => {

  describe('getAddressBook', () => {

    it('returns empty array if app directory does not exist', () => {
      addressBook.testPoint('./non-existent-dir');
      const addresses = addressBook.getAddressBook();
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses).toHaveLength(0);
    });

    it('returns empty array if address book file does not exist', () => {
      const appDir = './test/test-dirs/empty-app-dir';
      expect(fs.existsSync(appDir)).toBe(true);
      addressBook.testPoint(appDir);
      const addresses = addressBook.getAddressBook();
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses).toHaveLength(0);
    });

    it('returns full address book contents', () => {
      addressBook.testPoint('./test/test-dirs/app-dir');
      assertDefaultAddressBookState();
    });

  });

  describe('Adding & removing addresses', () => {

    const appDir = './test/test-dirs/app-dir';

    beforeAll(() => {
      addressBook.testPoint(appDir);
    });

    beforeEach(() => {
      assertDefaultAddressBookState();
    });

    afterEach(() => {
      assertDefaultAddressBookState();
    });

    it('add fails if all fields are missing', () => {
      expect(() => {
        addressBook.addAddress();
      }).toThrow();
    });

    it('add fails if label is missing', () => {
      expect(() => {
        addressBook.addAddress(undefined, TEST_ADDRESSES.tempAddress.address, TEST_ADDRESSES.tempAddress.memo);
      }).toThrow();
    });

    it('add fails if address is missing', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, undefined, TEST_ADDRESSES.tempAddress.memo);
      }).toThrow();
    });

    it('add fails if address is not an address', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, 'not an address', TEST_ADDRESSES.tempAddress.memo);
      }).toThrow();
    });

    it('add fails if label already exists', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.address1.label, TEST_ADDRESSES.address1.address);
      }).toThrow('address with that label already exists');
    });

    it('add succeeds without a memo and remove by label succeeds', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address);
      }).not.toThrow();
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].label).toBe(TEST_ADDRESSES.tempAddress.label);
      expect(addresses[3].address).toBe(TEST_ADDRESSES.tempAddress.address);
      expect(addresses[3].memo).toBeUndefined();
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    });

    it('add succeeds with a memo and remove by label succeeds', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address, TEST_ADDRESSES.tempAddress.memo);
      }).not.toThrow();
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].label).toBe(TEST_ADDRESSES.tempAddress.label);
      expect(addresses[3].address).toBe(TEST_ADDRESSES.tempAddress.address);
      expect(addresses[3].memo).toBe(TEST_ADDRESSES.tempAddress.memo);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    });

    it('add succeeds even if address and memo already exists', () => {
      expect(() => {
        addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.address1.address, TEST_ADDRESSES.address1.memo);
      }).not.toThrow();
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].label).toBe(TEST_ADDRESSES.tempAddress.label);
      expect(addresses[3].address).toBe(TEST_ADDRESSES.address1.address);
      expect(addresses[3].memo).toBe(TEST_ADDRESSES.address1.memo);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label);
    });

    it('remove by label succeeds if label is a different case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.address);
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    });

    it('labels are stored in lower case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase(), TEST_ADDRESSES.tempAddress.address);
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].label).toBe(TEST_ADDRESSES.tempAddress.label.toLowerCase());
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    });

    it('without the the toLowerCase option the address is saved in the given case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.checksumAddress);
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].address).toBe(TEST_ADDRESSES.tempAddress.checksumAddress);
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    });

    it('with the toLowerCase option the address is saved in lower case', () => {
      addressBook.addAddress(TEST_ADDRESSES.tempAddress.label, TEST_ADDRESSES.tempAddress.checksumAddress, undefined, {toLowerCase: true});
      const addresses = addressBook.getAddressBook();
      expect(addresses).toHaveLength(4);
      assertDefaultAddressesUnchanged(addresses);
      expect(addresses[3].address).toBe(TEST_ADDRESSES.tempAddress.checksumAddress.toLowerCase());
      addressBook.removeAddress(TEST_ADDRESSES.tempAddress.label.toUpperCase());
    });

  });

  describe('getServers', () => {

    it('returns empty array if app directory does not exist', () => {
      addressBook.testPoint('./non-existent-dir');
      const servers = addressBook.getServers();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers).toHaveLength(0);
    });

    it('returns empty array if servers file does not exist', () => {
      const appDir = './test/test-dirs/empty-app-dir';
      expect(fs.existsSync(appDir)).toBe(true);
      addressBook.testPoint(appDir);
      const servers = addressBook.getServers();
      expect(Array.isArray(servers)).toBe(true);
      expect(servers).toHaveLength(0);
    });

    it('returns full servers file contents', () => {
      addressBook.testPoint('./test/test-dirs/app-dir');
      assertDefaultServersState();
    });

  });

  describe('Adding & removing servers', () => {

    const appDir = './test/test-dirs/app-dir';

    beforeAll(() => {
      addressBook.testPoint(appDir);
    });

    beforeEach(() => {
      assertDefaultServersState();
    });

    afterEach(() => {
      assertDefaultServersState();
    });

    it('add fails if all fields are missing', () => {
      expect(() => {
        addressBook.addServer();
      }).toThrow();
    });

    it('add fails if label is missing', () => {
      expect(() => {
        addressBook.addServer(undefined, TEST_SERVERS.tempServer.url);
      }).toThrow();
    });

    it('add fails if url is missing', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, undefined);
      }).toThrow();
    });

    it('add fails if url is not a url', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, 'not a url');
      }).toThrow();
    });

    it('add fails if label already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.server1.label, TEST_SERVERS.tempServer.url);
      }).toThrow('server with that label already exists');
    });

    it('add succeeds and remove succeeds', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.tempServer.url);
      }).not.toThrow();
      const servers = addressBook.getServers();
      expect(servers).toHaveLength(4);
      assertDefaultServersUnchanged(servers);
      expect(servers[3].label).toBe(TEST_SERVERS.tempServer.label);
      expect(servers[3].url).toBe(TEST_SERVERS.tempServer.url);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    });

    it('add succeeds even if url already exists', () => {
      expect(() => {
        addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url);
      }).not.toThrow();
      const servers = addressBook.getServers();
      expect(servers).toHaveLength(4);
      assertDefaultServersUnchanged(servers);
      expect(servers[3].label).toBe(TEST_SERVERS.tempServer.label);
      expect(servers[3].url).toBe(TEST_SERVERS.server1.url);
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    });

    it('remove by label succeeds if label is a different case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label, TEST_SERVERS.server1.url);
      const servers = addressBook.getServers();
      expect(servers).toHaveLength(4);
      addressBook.removeServer(TEST_SERVERS.tempServer.label.toUpperCase());
    });

    it('labels are stored in lower case', () => {
      addressBook.addServer(TEST_SERVERS.tempServer.label.toUpperCase(), TEST_SERVERS.server1.url);
      const servers = addressBook.getServers();
      expect(servers).toHaveLength(4);
      assertDefaultServersUnchanged(servers);
      expect(servers[3].label).toBe(TEST_SERVERS.tempServer.label.toLowerCase());
      addressBook.removeServer(TEST_SERVERS.tempServer.label);
    });

  });

  describe('Startup Scenario', () => {

    const appDir = './test/test-dirs/address-book-startup-scenario-temp-app-dir';

    it('app dir and addresses file are created automatically when addAddress is called', () => {
      addressBook.testPoint(appDir);
      addressBook.addAddress('address1', TEST_ADDRESSES.address1.address, TEST_ADDRESSES.address1.memo);
      expect(fs.existsSync(appDir)).toBe(true);
      expect(fs.existsSync(appDir + '/addresses')).toBe(true);
      const json = fs.readFileSync(appDir + '/addresses', {encoding: 'utf8'});
      const addresses = JSON.parse(json);
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses).toHaveLength(1);
      expect(addresses[0].label).toBe('address1');
      expect(addresses[0].address).toBe(TEST_ADDRESSES.address1.address);
      expect(addresses[0].memo).toBe(TEST_ADDRESSES.address1.memo);
    });

    it('app dir and servers file are created automatically when addServer is called', () => {
      addressBook.testPoint(appDir);
      addressBook.addServer(TEST_SERVERS.server1.label, TEST_SERVERS.server1.url, TEST_SERVERS.server1.id);
      expect(fs.existsSync(appDir)).toBe(true);
      expect(fs.existsSync(appDir + '/servers')).toBe(true);
      const json = fs.readFileSync(appDir + '/servers', {encoding: 'utf8'});
      const servers = JSON.parse(json);
      expect(Array.isArray(servers)).toBe(true);
      expect(servers).toHaveLength(1);
      expect(servers[0].label).toBe(TEST_SERVERS.server1.label);
      expect(servers[0].url).toBe(TEST_SERVERS.server1.url);
      expect(servers[0].id).toBe(TEST_SERVERS.server1.id);
    });

    afterEach(() => {
      fs.rmSync(appDir, {recursive: true, force: true});
      expect(fs.existsSync(appDir)).toBe(false);
    });

  });


  describe('parseServer', () => {

    const appDir = './test/test-dirs/app-dir';
    const blockchainProvider = {
      nickname: 'polygon',
      name: 'Polygon',
      chainId: 137
    };

    beforeAll(() => {
      addressBook.testPoint(appDir);
    });

    it('retrieves a server from the address book', () => {
      const server = addressBook.parseServer(TEST_SERVERS.server1.label, blockchainProvider);
      expect(server.label).toBe(TEST_SERVERS.server1.label);
      expect(server.url).toBe(TEST_SERVERS.server1.url);
    });

    it('rejects if url is missing', () => {
      expect(() => {
        addressBook.parseServer(undefined, blockchainProvider, false);
      }).toThrow('url is missing');
    });

    it('rejects if url is invalid', () => {
      const url = 'invalid url';
      expect(() => {
        addressBook.parseServer(url, blockchainProvider, false);
      }).toThrow('url is invalid');
    });

    it('throws for invalid url if silent option is not overridden', () => {
      const url = 'invalid url';
      expect(() => {
        addressBook.parseServer(url, blockchainProvider);
      }).toThrow();
    });

  });

  describe('parseAddress', () => {

    const appDir = './test/test-dirs/app-dir';

    beforeAll(() => {
      addressBook.testPoint(appDir);
      wallet.testPoint(appDir);
    });

    it('retrieves an address from the address book', () => {
      const address = addressBook.parseAddress(TEST_ADDRESSES.address1.label, false);
      expect(address).toBe(TEST_ADDRESSES.address1.address);
    });

    it('retrieves an address from the address book regardless of case', () => {
      const address = addressBook.parseAddress(TEST_ADDRESSES.address1.label.toUpperCase(), false);
      expect(address).toBe(TEST_ADDRESSES.address1.address);
    });

    it('retrieves a wallet address', () => {
      const address = addressBook.parseAddress('key1', false);
      expect(address).toBe(TEST_ADDRESSES.key1.address);
    });

    it('rejects if the string an unknown address, server or wallet label', () => {
      expect(() => {
        console.log(addressBook.parseAddress('unknownLabel', false));
      }).toThrow('address is invalid');
    });

    it('parses a 20-byte hex address prefix', () => {
      const addressIn = '0x4e16dd537432447fb9cec2726252accb4514abae';
      const address = addressBook.parseAddress(addressIn, false);
      expect(address).toBe(addressIn);
    });

    it('rejects if the address is missing', () => {
      expect(() => {
        console.log(addressBook.parseAddress(undefined, false));
      }).toThrow('address is invalid');
    });

    it('rejects if the address is not a string', () => {
      expect(() => {
        console.log(addressBook.parseAddress(45, false));
      }).toThrow('address is invalid');
    });

    it('rejects a 20-byte address without 0x prefix', () => {
      const addressIn = '4e16dd537432447fb9cec2726252accb4514abae';
      expect(() => {
        console.log(addressBook.parseAddress(addressIn, false));
      }).toThrow('address is invalid');
    });

    it('parses a number as a decimal address', () => {
      const addressIn = '45';
      const address = addressBook.parseAddress(addressIn, false);
      expect(address).toBe('0x000000000000000000000000000000000000002d');
    });

    it('parses the zero address in decimal', () => {
      const addressIn = '0';
      const address = addressBook.parseAddress(addressIn, false);
      expect(address).toBe('0x0000000000000000000000000000000000000000');
    });

    it('parses the zero address in hex', () => {
      const addressIn = '0x0';
      const address = addressBook.parseAddress(addressIn, false);
      expect(address).toBe('0x0000000000000000000000000000000000000000');
    });

  });

});
