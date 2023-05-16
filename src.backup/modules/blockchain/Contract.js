import { BubblePermissions, ContentId } from '@bubble-protocol/core';
import { Bubble } from '@bubble-protocol/client';
import { Transaction } from 'ethereumjs-tx';
import StringUtils from '../../utils/string-utils.mjs';

//
// Contract & Bubbles
//

export class Contract {
  
  
  constructor(web3, options) {
    this.web3 = web3;
    this.abi = options.abi;
    this.bytecode = options.bytecode;
    this.address = options.address;
  }

  async initialiseAccounts() {
    if (!this.accounts) this.accounts = await this.web3.eth.getAccounts();
  }

  async deploy(key, chain, params=[]) {

    this.web3Contract = new this.web3.eth.Contract(this.abi);
    const web3Key = this.web3.eth.accounts.privateKeyToAccount(key.privateKey);

    const txParams = {
      nonce: '0x00',
      from: key.address,
      value: 0,
      data: this.web3Contract.deploy({data: this.bytecode, arguments: params}).encodeABI(),
      gasPrice: StringUtils.uintToHex('30000000000000')
    };

    const tx = new Transaction(txParams, {chain: chain});

    tx.sign(Buffer.from(key.privateKey, 'hex'));
    const serialisedTx = tx.serialize().toString('hex');

    await this.web3.eth.sendSignedTransaction('0x'+serialisedTx)
      .on('receipt', receipt => {
        this.address = receipt.contractAddress;
        this.web3Contract.options.address = receipt.contractAddress;
        return this.address;
      });
    
  }

  call(method, params) {
    return this.web3Contract.methods[method].call(params);
  }

  transact(key, method, params, options) {
    return this.web3Contract.methods[method].call(params);
  }

  getBubble(chainId, bubbleServerURL, bubbleProvider, accountIndex=0) {
    if( !this.address) throw new Error("Contract - you must deploy the contract first");

    const bubbleId = new ContentId({
      chain: chainId,
      contract: this.address,
      provider: bubbleServerURL
    });

    return new Bubble(bubbleId, bubbleProvider, (hash) => this.web3.eth.sign(hash, this.accounts[accountIndex]));
  }


  getAccounts() {
    if( !this.accounts) throw new Error("Contract - you must initialiseAccounts or deploy the contract first");
    return this.accounts;
  }
  
  getAccount(accountIndex=0) {
    if( !this.accounts) throw new Error("Contract - you must initialiseAccounts or deploy the contract first");
    return this.accounts[accountIndex];
  }
  
  getAddress() {
    if( !this.address) throw new Error("Contract - you must deploy the contract first");
    return this.address;
  }


  async testContractIsAvailable() {
    if( !this.address) throw new Error("Contract - you must deploy the contract first");
    const file0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const permissionBits = await this.web3Contract.methods.getAccessPermissions(this.accounts[0], file0).call();
    const permissions = new BubblePermissions(BigInt(permissionBits));
    expect(permissions.bubbleTerminated()).toBe(false);
    expect(permissions.isDirectory()).toBe(false);
    expect(permissions.canRead()).toBe(true);
    expect(permissions.canWrite()).toBe(true);
    expect(permissions.canAppend()).toBe(true);
    expect(permissions.canExecute()).toBe(true);
  }

}
