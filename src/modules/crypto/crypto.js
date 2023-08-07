import { assert } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';
import Web3 from 'web3';
import secp256k1 from 'secp256k1';
import StringUtils from '../../utils/string-utils.js';

/**
 * 
 * @returns Constructs a new random account
 */
export function generateAccount() {
  const crypto = _getCrypto();
  var privateKey;
  do {
    privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);
  } while (!secp256k1.privateKeyVerify(privateKey));
  return _constructAccount(StringUtils.uint8ArrayToHex(privateKey));
}


export function privateKeyToAccount(privateKey) {
  ecdsa.assert.isPrivateKey(privateKey, "privateKey"); 
  return _constructAccount(privateKey);
}

export function publicKeyToAddress(publicKey) {
  assert.isHexString(publicKey, 'public key');
  if (publicKey.slice(0,2) === '0x') publicKey = publicKey.slice(2);
  const publicKeyBuf = Buffer.from(publicKey, 'hex');
  return '0x'+Web3.utils.keccak256(publicKeyBuf.slice(1)).slice(-40);
}


export function hash(str) {
  return Web3.utils.keccak256(str);
}


function _constructAccount(privateKey) {
  const key = new ecdsa.Key(privateKey);
  key.publicKey = key.uPublicKey;
  const account = {
    key: key,
    address: key.address,
    privateKey: key.privateKey,
    publicKey: key.uPublicKey,
    sign: key.signFunction
  };
  return account;  
}


/**
 * Platform agnostic SubtleCrypto 
 */

const _crypto = crypto || window.crypto || {};

function _getCrypto() {
  if (!_crypto.subtle) throw new Error("Missing crypto capability");
  return _crypto;
}

function _getSubtleCrypto() {
  return _getCrypto().subtle;
}

