import { Bubble, bubbleProviders } from '@bubble-protocol/client';
import { ROOT_PATH, BubbleFilename, ContentId, assert } from '@bubble-protocol/core';
import fs from 'fs';
import wallet from "../wallet/wallet.js";
import addressBook from "../address-book/address-book.js";
import { blockchainProviders } from '../blockchain/providers.js';


export function createBubble(server, contract, options) {
  const params = _validateBubble(server, contract, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  console.trace('create', params.server.url, params.contract, serverOpts);
  return params.bubble.create(serverOpts);
}


export function deleteBubble(server, contract, options) {
  const params = _validateBubble(server, contract, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  console.trace('delete-bubble', params.server.url, params.contract, serverOpts);
  return params.bubble.terminate(serverOpts);
}


export function readBubble(server, contract, filename, options) {
  const params = _validateBubbleParams(server, contract, filename, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  console.trace('read', params.server.url, params.contract, params.filename, serverOpts);
  return params.bubble.read(params.filename, serverOpts)
    .then( data => {
      if (options.binary) {
        console.trace("writing output to "+options.binary);
        fs.writeFileSync(options.binary, Buffer.from(data, 'base64'));
        return;
      }
      return data
    });
}


export function writeBubble(server, contract, filename, file, options={}) {
  const params = _validateBubbleParams(server, contract, filename, options);
  let data = options.data;
  if (file && data) throw new Error('cannot write both file and data');
  if (!file && !data) throw new Error('missing file or data string');
  if (file) {
    if (!fs.existsSync(file)) throw new Error('file does not exist');
    data = fs.readFileSync(file).toString(options.binary ? 'base64' : 'utf8');
  }
  console.trace('write', params.server.url, params.contract, params.filename);
  return params.bubble.write(params.filename, data);
}


export function appendBubble(server, contract, filename, file, options={}) {
  const params = _validateBubbleParams(server, contract, filename, options);
  let data = options.data;
  if (file && data) throw new Error('cannot append both file and data');
  if (!file && !data) throw new Error('missing file or data string');
  if (file) {
    if (!fs.existsSync(file)) throw new Error('file does not exist');
    data = fs.readFileSync(file).toString(options.binary ? 'base64' : 'utf8');
  }
  console.trace('append', params.server.url, params.contract, params.filename);
  return params.bubble.append(params.filename, data);
}


export function deleteBubbleFile(server, contract, filename, options={}) {
  const params = _validateBubbleParams(server, contract, filename, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  console.trace('delete', params.server.url, params.contract, params.filename, serverOpts);
  return params.bubble.delete(params.filename, serverOpts);
}


export function mkdirBubbleFile(server, contract, filename, options={}) {
  const params = _validateBubbleParams(server, contract, filename, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  console.trace('mkdir', params.server.url, params.contract, params.filename, serverOpts);
  return params.bubble.mkdir(params.filename, serverOpts);
}

export function listBubbleFile(server, contract, filename, options={}) {
  const params = _validateBubbleParams(server, contract, filename || ROOT_PATH, options);
  const serverOpts = {};
  if (options.silent) serverOpts.silent = true;
  if (options.before) serverOpts.before = options.before;
  if (options.after) serverOpts.after = options.after;
  if (options.createdBefore) serverOpts.createdBefore = options.createdBefore;
  if (options.createdAfter) serverOpts.createdAfter = options.createdAfter;
  if (options.long) serverOpts.long = true;
  if (options.dirOnly) serverOpts.directoryOnly = true;
  if (options.matches) serverOpts.matches = options.matches;
  console.trace('list', params.server.url, params.contract, params.filename, serverOpts);
  return params.bubble.list(params.filename, serverOpts);
}

export function getPermissions(server, contract, filename, options={}) {
  const params = _validateBubbleParams(server, contract, filename || ROOT_PATH, options);
  console.trace('getPermissions', params.server.url, params.contract, params.filename);
  return params.bubble.getPermissions(params.filename)
    .then(permissions => {
      return '' +
        (permissions.bubbleTerminated() ? 't' : '-') +
        (permissions.isDirectory() ? 'd' : '-') +
        (permissions.canRead() ? 'r' : '-') +
        (permissions.canWrite() ? 'w' : '-') +
        (permissions.canAppend() ? 'a' : '-') +
        (permissions.canExecute() ? 'x' : '-');
    })
}


export function getContentId(server, contract, filename, options) {
  const params = _validateBubble(server, contract, options);
  if (filename) {
    filename = _validateFilename(filename);
    params.contentId.file = filename;
  }
  return new ContentId({
    chain: params.contentId.chain, 
    contract: params.contentId.contract, 
    provider: params.contentId.provider, 
    file: params.contentId.file
  });
}


//
// Local functions
//

function _validateBubble(serverStr, contractStr, options={}) {
  const server = addressBook.parseServer(serverStr);
  let contract = addressBook.parseAddress(contractStr);
  if (options.toLowerCase) contract = contract.toLowerCase();
  if (!server) throw new Error('invalid provider url');
  if (!contract) throw new Error('invalid contract address');
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  const provider = blockchainProviders.getProvider(options.chain);
  const bubbleId = {
    contract: contract,
    chain: provider.chainId,
    provider: server.url
  }
  const bubble = new Bubble(bubbleId, new bubbleProviders.HTTPBubbleProvider(server.url), key.sign);
  return {contentId: bubbleId, server: server, contract: contract, key: key, bubble: bubble}
}

function _validateBubbleParams(serverStr, contractStr, filenameStr, options) {
  const params = _validateBubble(serverStr, contractStr, options);
  params.filename = _validateFilename(filenameStr);
  params.contentId.file = params.filename;
  return params;
}

function _validateFilename(filename) {
  assert.isString(filename, 'filename');
  if (assert.isHex32(filename)) return filename;
  const parts = filename.split('/');
  if (parts.length === 0 || parts.length > 2) throw new Error('filename is invalid');
  if (parts[0].slice(0,2) === '0x') {  // hex
    parts[0] = '0x' + ('0'.repeat(64) + parts[0].slice(2)).slice(-64);
  }
  else if (parts[0].match(/^[0-9]/)) {  // int
    parts[0] = '0x' + ('0'.repeat(64) + parseInt(parts[0]).toString(16)).slice(-64);
  }
  else {  // address label
    const address = addressBook.parseAddress(parts[0]);
    if (!address) throw new Error('filename is not recognised');
    parts[0] = '0x000000000000000000000000'+address.slice(2);
  }
  const expandedFilename = parts.join('/');
  const bubblePath = new BubbleFilename(expandedFilename);
  if (bubblePath.isValid()) return expandedFilename;
  else throw new Error('filename is invalid');
}
