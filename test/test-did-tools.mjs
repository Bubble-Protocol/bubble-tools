import {assert, expect} from 'chai';
import addressBook from '../src/modules/address-book/address-book.mjs';
import DIDTools from '../src/modules/did/did-tools.mjs';
import wallet from '../src/modules/wallet/wallet.mjs';
import '../src/utils/log.js';

const TEST_ADDRESSES = {
  validAddress: '0x0123456789abcdef0123456789abcdef01234567',
  invalidAddress: 'invalid address',
  addressInAddressBook: 'address1',
  addressInWallet: 'key1',
  addressNotInAddressBookOrWallet: 'address4'
}

const SERVER_PATH = 'https://server1.com/path1/'

const TEST_SERVERS = {
  validServer: SERVER_PATH+'?id='+TEST_ADDRESSES.validAddress,
  idInAddressBook: SERVER_PATH+'?id=address2',
  idInWallet: SERVER_PATH+'?id=key2',
  idNotInAddressBookOrWallet: SERVER_PATH+'?id='+TEST_ADDRESSES.addressNotInAddressBookOrWallet,
  invalidUrl: 'invalid url',
  invalidId: SERVER_PATH+'?id='+TEST_ADDRESSES.invalidAddress,
  serverNotInAddressBook: 'server4'
}

const TEST_FILES = {
  validFile: '0x0000000000000000000000000000000000000001',
  invalidFile: 'invalid file',
  fileInAddressBook: 'address3',
  fileInWallet: 'key3',
  fileNotInAddressBookOrWallet: 'address4'
}

const TEST_DIDS = {
  invalidURL: {
    did: 'not a url'
  },
  invalidNotDID: {
    did: 'not:bubble:11vKkZ3XHF1D98QwaUTYfKUuwdB4'
  },
  invalidMissingVersion: {
    did: 'did:bubble:vKkZ3XHF1D98QwaUTYfKUuwdB4'
  },
  invalidNotBubbleDID: {
    did: 'did:nubble:11vKkZ3XHF1D98QwaUTYfKUuwdB4'
  },
  invalidNotBase58Encoded: {
    did: 'did:bubble:'+TEST_ADDRESSES.validAddress.substring(2)
  },
  validWithJustAddress: {
    address: TEST_ADDRESSES.validAddress,
    expectedAddress: TEST_ADDRESSES.validAddress,
    server: undefined,
    expectedServerId: undefined,
    file: undefined,
    expectedFile: undefined,
    did: 'did:bubble:11vKkZ3XHF1D98QwaUTYfKUuwdB4'
  },
  validWithServerAndFile: {
    address: TEST_ADDRESSES.validAddress,
    expectedAddress: TEST_ADDRESSES.validAddress,
    server: TEST_SERVERS.validServer,
    expectedServerId: TEST_ADDRESSES.validAddress,
    file: TEST_FILES.validFile,
    expectedFile: TEST_FILES.validFile,
    did: 'did:bubble:11vKkZ3XHF1D98QwaUTYfKUuwdB4?vault=KmhyenYESVyoEEv41iBEypF8TAHW7TCYmoDHBxFNq7KPxRM42tS6gs4YiB6rBonDDJ2BXDSwueNFAzKughmf9mVoEe&file=11111111111111111112'
  },
  validWithAddressesInAddressBook: {
    address: TEST_ADDRESSES.addressInAddressBook,
    expectedAddress: '0x1111111111111111111111111111111111111111',
    server: TEST_SERVERS.idInAddressBook,
    expectedServerId: '0x2222222222222222222222222222222222222222',
    file: TEST_FILES.fileInAddressBook,
    expectedFile: '0x3333333333333333333333333333333333333333',
    did: 'did:bubble:11EnrGHeqCd5UQ2jTW2Mo32o6a2GG?vault=LYyeMWjMTD9CJkrtKGVBu3Gcv6QSrmbZFFvJcEHQx4TnAyoLXAug9ZCFNUD82fY1Z5THNiAUt45dfXQePPZRUHJfL2&file=iNYnrxVbsERC6CNW55P76PHi4nn'
  },
  validWithAddressesInWallet: {
    address: TEST_ADDRESSES.addressInWallet,
    expectedAddress: '0x4e16dd537432447fb9cec2726252accb4514abae',
    server: TEST_SERVERS.idInWallet,
    expectedServerId: '0x72e05725cd2d1fd3fb5df419d33c4cadc69fdfaf',
    file: TEST_FILES.fileInWallet,
    expectedFile: '0xf34f78d14de047253f7f3f58206666e1ce3dfefc',
    did: 'did:bubble:11266kMKUHrQfZKGz2CuQwFsFWx4xd?vault=NVx37255iUPkSB7VX73CwcpNhna4t2xzJwqs6Qy6UMABj3nFK6unfqGQGqHQJfjLzZg2G27gwS2Wpq7QTtJden6jJv&file=4Pc2heBLBC5w7thHe2JPawTyFHfq'
  }
}


describe('DID Tools', () => {
   
  const appDir = './test/test-dirs/app-dir';

  before(() => {
    wallet.testPoint(appDir);
    addressBook.testPoint(appDir);
  })

  describe('create', () => {

    function testCreateDID(test) {
      const did = DIDTools.create(test.address, test.server, test.file);
      assert.strictEqual(did, test.did);
    }

    it('throws if all fields are missing', () => {
      expect(() => {
        DIDTools.create();
      })
      .to.throw();
    })
    
    it('throws if address is missing', () => {
      expect(() => {
        console.log(DIDTools.create(undefined, TEST_SERVERS.validServer, TEST_FILES.validFile));
      })
      .to.throw('address is missing');
    })
    
    it('throws if server is missing but file is present', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, undefined, TEST_FILES.validFile));
      })
      .to.throw('server is missing');
    })
    
    it('does not throw if server and file are missing', () => {
      expect(() => {
        DIDTools.create(TEST_ADDRESSES.validAddress);
      })
      .to.not.throw();
    })
    
    it('throws if address is invalid', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.invalidAddress));
      })
      .to.throw('address is invalid');
    })
    
    it('throws if address is not found in address book or wallet', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.addressNotInAddressBookOrWallet));
      })
      .to.throw('address is invalid');
    })
    
    it('throws if server is invalid', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.invalidUrl, TEST_FILES.validFile));
      })
      .to.throw('server is invalid');
    })
    
    it('throws if server id is invalid', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.invalidId, TEST_FILES.validFile));
      })
      .to.throw('server is invalid');
    })
    
    it('throws if server id is not in address book', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.idNotInAddressBookOrWallet, TEST_FILES.validFile));
      })
      .to.throw('server is invalid');
    })
    
    it('throws if server is not found in address book', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.serverNotInAddressBook, TEST_FILES.validFile));
      })
      .to.throw('server is invalid');
    })
    
    it('throws if server is present but file is missing', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.validServer));
      })
      .to.throw('file is invalid');
    })
    
    it('throws if file is invalid', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.validServer, TEST_FILES.invalidFile));
      })
      .to.throw('file is invalid');
    })
    
    it('throws if file is not found in address book', () => {
      expect(() => {
        console.log(DIDTools.create(TEST_ADDRESSES.validAddress, TEST_SERVERS.validServer, TEST_FILES.fileNotInAddressBookOrWallet));
      })
      .to.throw('file is invalid');
    })
    
    it('generates correct DID for just an address', () => {
      testCreateDID(TEST_DIDS.validWithJustAddress);
    })
    
    it('generates correct DID with all fields valid', () => {
      testCreateDID(TEST_DIDS.validWithServerAndFile);
    })
    
    it('generates correct DID with address, id and file all labels in the address book', () => {
      testCreateDID(TEST_DIDS.validWithAddressesInAddressBook);
    })
    
    it('generates correct DID with address, id and file all labels in the wallet', () => {
      testCreateDID(TEST_DIDS.validWithAddressesInWallet);
    })
    
  })


  describe('decode', () => {

    function testDecodeDID(test) {
      const didUrl = DIDTools.decode(test.did);
      assert.strictEqual(didUrl.protocol, 'did:');
      assert.strictEqual(didUrl.method, 'bubble:');
      assert.strictEqual(didUrl.address, test.expectedAddress);
      if (test.server === undefined) assert.isUndefined(didUrl.vaultServer)
      else {
        assert.strictEqual(didUrl.vaultServer.url, SERVER_PATH);
        assert.strictEqual(didUrl.vaultServer.id, test.expectedServerId);
      }
      assert.strictEqual(didUrl.file, test.expectedFile);
    }

    it('throws if url is missing', () => {
      expect(() => {
        DIDTools.decode();
      })
      .to.throw('Invalid URL');
    })

    it('throws if url is empty', () => {
      expect(() => {
        DIDTools.decode('');
      })
      .to.throw('Invalid URL');
    })

    it('throws if url is not a string', () => {
      expect(() => {
        DIDTools.decode(679);
      })
      .to.throw('Invalid URL');
    })

    it('throws if url is invalid', () => {
      expect(() => {
        DIDTools.decode(TEST_DIDS.invalidURL.did);
      })
      .to.throw('Invalid URL');
    })

    it('throws if url is not a did', () => {
      expect(() => {
        DIDTools.decode(TEST_DIDS.invalidNotDID.did);
      })
      .to.throw('Invalid DID URL');
    })

    it('throws if url is not a bubble did', () => {
      expect(() => {
        DIDTools.decode(TEST_DIDS.invalidNotBubbleDID.did);
      })
      .to.throw('Invalid Bubble URL');
    })

    it('throws if missing version from bubble url', () => {
      expect(() => {
        DIDTools.decode(TEST_DIDS.invalidMissingVersion.did);
      })
      .to.throw('address is invalid');
    })

    it('throws if not base58 encoded', () => {
      expect(() => {
        DIDTools.decode(TEST_DIDS.invalidNotBase58Encoded.did);
      })
      .to.throw('Non-base58');
    })

    it('decodes DID containing just an address', () => {
      testDecodeDID(TEST_DIDS.validWithJustAddress);
    })
    
    it('decodes DID with all fields valid', () => {
      testDecodeDID(TEST_DIDS.validWithServerAndFile);
    })
    
    it('decodes DID with address, id and file all labels in the address book', () => {
      testDecodeDID(TEST_DIDS.validWithAddressesInAddressBook);
    })
    
    it('decodes DID with address, id and file all labels in the wallet', () => {
      testDecodeDID(TEST_DIDS.validWithAddressesInWallet);
    })
    
  })

});