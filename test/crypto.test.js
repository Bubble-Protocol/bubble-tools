import { generateAccount, hash, privateKeyToAccount, publicKeyToAddress } from '../src/modules/crypto/crypto.js';

const TEST_KEY = {
  privateKey: 'bf2ab3d3f4d017b1775dfae180da93d8bb6c4306327ec2bf24f92c8604440945',
  publicKey: '04ba032b6edcab16b0eb13e77891af30a8546c68ff4de508703623a1169dbaebcf87f27afc157f5c940092abd1c7060089b15ccf4104058fc0de8fe92a0f8181fc',
  address: '0x4e16dd537432447fb9cec2726252accb4514abae'
};

describe('Crypto', () => {
  it('constructs an account from a private key', () => {
    const account = privateKeyToAccount(TEST_KEY.privateKey);

    expect(account.privateKey).toBe(TEST_KEY.privateKey);
    expect(account.publicKey).toBe(TEST_KEY.publicKey);
    expect(account.address).toBe(TEST_KEY.address);
    expect(typeof account.sign).toBe('function');
  });

  it('derives an address from a public key', () => {
    expect(publicKeyToAddress(TEST_KEY.publicKey)).toBe(TEST_KEY.address);
    expect(publicKeyToAddress(`0x${TEST_KEY.publicKey}`)).toBe(TEST_KEY.address);
  });

  it('hashes a string with keccak256', () => {
    expect(hash('bubble')).toBe('0xcfbb536edd550b9583ff6a776ee2a4a3db0950e28750b5884dfefed3840a61e3');
  });

  it('generates a valid random account', () => {
    const account = generateAccount();

    expect(account.privateKey).toMatch(/^[0-9a-f]{64}$/);
    expect(account.publicKey).toMatch(/^04[0-9a-f]{128}$/);
    expect(account.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(typeof account.sign).toBe('function');
  });
});
