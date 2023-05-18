
import { assert, BubblePermissions, ROOT_PATH } from '@bubble-protocol/core';
import { ecdsa } from '@bubble-protocol/crypto';
import { Transaction } from 'ethereumjs-tx';


export class Contract {

  /**
   * If the address is not given this represents a new contract to be deployed.
   */
  constructor(web3, chain, abi, address) {
    assert.isObject(web3, 'web3');
    if (!assert.isNumber(chain) && !assert.isObject(chain)) throw new TypeError("Contract chain type. Expected number or object");
    assert.isArray(abi, "Contract abi");
    this.web3 = web3;
    this.chain = chain;
    this.web3Contract = new web3.eth.Contract(abi);
    this.abi = abi;
    if (address !== undefined) this.setAddress(address);
  }


  /**
   * Sets the address of this contract on the blockchain.  Can be used as an
   * alternative to passing it in the constructor.
   */
  setAddress(address) {
    ecdsa.assert.isAddress(address, "address");
    this.web3Contract.options.address = address;
    this.address = address;
  }


  /**
   * Promises to deploy this contract on the blockchain
   */
  deploy(key, bytecode, constructorArgs, options={}) {
    assert.isObject(key, "key");
    assert.isHexString(bytecode, "bytecode");
    if (constructorArgs !== undefined) assert.isArray(constructorArgs, "constructorArgs");
    if (this.address !== undefined) throw new Error("contract already deployed");

    // create deployment transaction data from bytecode
    const txnData = this.web3Contract.deploy({
      data: '0x' + bytecode,
      arguments: constructorArgs
    }).encodeABI();

    // create skeleton transaction
    const rawTxn = {
      data: txnData,
      gas: this.web3.utils.toHex(6000000),
      ..._hexifyOptions(options)
    }

    // function to set the address of this Contract instance once the receipt is received
    function storeAddress(receipt) {
      this.setAddress(receipt.contractAddress);
      return receipt.contractAddress;
    }

    return _sendTransaction(this.web3, this.chain, key, rawTxn)
      .then(storeAddress.bind(this));

  }


  /**
   * Promises to return a Permissions object
   */
  getPermissions(user, fileId) {
    ecdsa.assert.isAddress(user, "user");
    if (fileId === undefined) fileId = ROOT_PATH;
    else assert.isHex32(fileId, "fileId");
    if (this.address === undefined) throw new Error("contract has not been deployed or mapped to an existing contract");
    return this.call("getAccessPermissions", [user, fileId])
      .then(permissionBits => {
        return new BubblePermissions(permissionBits)
      });
  }


  /**
   * Promises to call the given view or pure method with the given arguments.
   * Use 'transact' to call a state-modifying method.
   */
  call(method, args = []) {
    assert.isString(method, "method");
    assert.isArray(args, "args");
    if (this.address === undefined) throw new Error("contract has not been deployed or mapped to an existing contract");
    var methodAbi = this.abi.find(obj => { return obj.name === method; });
    if (!methodAbi) throw new Error("method '"+method+"' does not exist");
    return this.web3Contract.methods[method](...args).call()
      .catch(function(error) {
        throw new Error("Failed to call method " + method, {cause: error.message});
      });
  }


  /**
   * Promises to call the given state-modifying method with the given arguments.
   * Use 'call' to call a view or pure method.
   */
  transact(key, method, args = [], options={}) {
    assert.isObject(key, "key");
    assert.isString(method, "method");
    assert.isArray(args, "args");
    if (this.address === undefined) throw new Error("contract has not been deployed or mapped to an existing contract");
    if (this.web3Contract === undefined) throw new Error("contract does not exist on the blockchain");

    // find method abi
    var methodAbi = this.abi.find(obj => { return obj.name === method; });
    if (!methodAbi) throw new Error("method '"+method+"' does not exist");

    // build transaction data
    const rawTxn = {
      gas: this.web3.utils.toHex(3000000),
      data: this.web3Contract.methods[method](...args).encodeABI(),
      to: this.address,
      ..._hexifyOptions(options)
    };
    return _sendTransaction(this.web3, this.chain, key, rawTxn);
  }

}


/**
 * Promises to publish a transaction on the blockchain
 */
function _sendTransaction(web3, chain, key, transaction) {

  if (transaction.from === undefined ) transaction.from = key.address;
  if (transaction.gas === undefined ) transaction.gas = web3.utils.toHex(6000000);

  // function to get the transaction nonce of the signatory
  function getTransactionCount(gasPrice) {
    if (transaction.gasPrice === undefined ) transaction.gasPrice = web3.utils.toHex(gasPrice);
    return web3.eth.getTransactionCount(key.address, "pending");
  }

  // function to construct and sign the transaction once the nonce has been calculated
  function createTransaction(nonce) {
    if (transaction.nonce === undefined ) transaction.nonce = nonce;
    const txn = new Transaction(transaction, {'chain': chain});
    txn.sign(Buffer.from(key.privateKey, 'hex'));
    const serializedTxn = txn.serialize();
    return "0x"+serializedTxn.toString('hex');
  }

  // function to reject the promise if the transaction was not successful
  function checkReceiptStatus(receipt) {
    if (receipt.status === true) return receipt;
    else throw new Error("Blockchain VM reverted the transaction", {cause: receipt});
  }

  // get the nonce, construct and sign the transaction then publish it on the blockchain
  return web3.eth.getGasPrice()
    .then(getTransactionCount)
    .then(createTransaction)
    .then(web3.eth.sendSignedTransaction)
    .then(checkReceiptStatus);

}


function _hexifyOptions(options) {
  if (options.gasPrice) options.gasPrice = _hexify(options.gasPrice);
  if (options.gas) options.gas = _hexify(options.gas);
  return options;
}


function _hexify(val) {
  if (typeof val === 'string') {
    if (val.slice(0,2) === '0x') return val;
    return '0x'+parseInt(val).toString(16);
  }
  else if (typeof val === 'number') return '0x'+val.toString(16);
  return val;
}