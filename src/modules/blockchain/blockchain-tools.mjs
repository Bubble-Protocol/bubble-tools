import datona from "datona-lib";
import wallet from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import { readFile } from "../../utils/bubble-utils.mjs";

function registerCommands(program, errorHandler) {

  // TERMINATECONTRACT Command
  program
    .command('contract.terminate <contract>')
    .description("terminates the given SDAC" )
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .action(function(contract, options){
      try{
        terminateContract(contract, options)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // CALLCONTRACT Command
  program
    .command('contract.call <contract> <method> [args...]')
    .description('calls the given pure or view method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        callContract(contract, method, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // TRANSACTCONTRACT Command
  program
    .command('contract.transact <contract> <method> [args...]')
    .description('transacts with the given method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        transactContract(contract, method, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

}

const BlockchainTools = {
  registerCommands: registerCommands,
  callContract: callContract,
  transactContract: transactContract,
  terminateContract: terminateContract
}

export default BlockchainTools;


//
// Internal Functions
//

// CONTRACT

const sdacAbi = {
  v1: JSON.parse('[ { "inputs": [], "name": "ALL_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "APPEND_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DIRECTORY_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "DatonaProtocolVersion", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "NO_PERMISSIONS", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "READ_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "WRITE_BIT", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "requester", "type": "address" }, { "internalType": "address", "name": "file", "type": "address" } ], "name": "getPermissions", "outputs": [ { "internalType": "bytes1", "name": "", "type": "bytes1" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "hasExpired", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "terminate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]')
}

const bubbleNet = {
  "blockchain": {"name":"bubblenet","chainId":45021,"networkId":45021,"comment":"The Bubble main chain","url":"https://ethstats.net/","genesis":{"hash":"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3","timestamp":null,"gasLimit":5000,"difficulty":17179869184,"nonce":"0x0000000000000042","extraData":"0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa","stateRoot":"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544"},"hardforks":[{"name":"chainstart","block":0,"consensus":"pow","finality":null},{"name":"homestead","block":1150000,"consensus":"pow","finality":null},{"name":"dao","block":1920000,"consensus":"pow","finality":null},{"name":"tangerineWhistle","block":2463000,"consensus":"pow","finality":null},{"name":"spuriousDragon","block":2675000,"consensus":"pow","finality":null},{"name":"byzantium","block":4370000,"consensus":"pow","finality":null},{"name":"constantinople","block":7280000,"consensus":"pow","finality":null},{"name":"petersburg","block":7280000,"consensus":"pow","finality":null},{"name":"istanbul","block":9069000,"consensus":"pow","finality":null},{"name":"muirGlacier","block":9200000,"consensus":"pow","finality":null}],"bootstrapNodes":[{"ip":"18.138.108.67","port":30303,"id":"d860a01f9722d78051619d1e2351aba3f43f943f6f00718d1b9baa4101932a1f5011f16bb2b1bb35db20d6fe28fa0bf09636d26a87d31de9ec6203eeedb1f666","location":"ap-southeast-1-001","comment":"bootnode-aws-ap-southeast-1-001"},{"ip":"3.209.45.79","port":30303,"id":"22a8232c3abc76a16ae9d6c3b164f98775fe226f0917b0ca871128a74a8e9630b458460865bab457221f1d448dd9791d24c4e5d88786180ac185df813a68d4de","location":"us-east-1-001","comment":"bootnode-aws-us-east-1-001"},{"ip":"34.255.23.113","port":30303,"id":"ca6de62fce278f96aea6ec5a2daadb877e51651247cb96ee310a318def462913b653963c155a0ef6c7d50048bba6e6cea881130857413d9f50a621546b590758","location":"eu-west-1-001","comment":"bootnode-aws-eu-west-1-001"},{"ip":"35.158.244.151","port":30303,"id":"279944d8dcd428dffaa7436f25ca0ca43ae19e7bcf94a8fb7d1641651f92d121e972ac2e8f381414b80cc8e5555811c2ec6e1a99bb009b3f53c4c69923e11bd8","location":"eu-central-1-001","comment":"bootnode-aws-eu-central-1-001"},{"ip":"52.187.207.27","port":30303,"id":"8499da03c47d637b20eee24eec3c356c9a2e6148d6fe25ca195c7949ab8ec2c03e3556126b0d7ed644675e78c4318b08691b7b57de10e5f0d40d05b09238fa0a","location":"australiaeast-001","comment":"bootnode-azure-australiaeast-001"},{"ip":"191.234.162.198","port":30303,"id":"103858bdb88756c71f15e9b5e09b56dc1be52f0a5021d46301dbbfb7e130029cc9d0d6f73f693bc29b665770fff7da4d34f3c6379fe12721b5d7a0bcb5ca1fc1","location":"brazilsouth-001","comment":"bootnode-azure-brazilsouth-001"},{"ip":"52.231.165.108","port":30303,"id":"715171f50508aba88aecd1250af392a45a330af91d7b90701c436b618c86aaa1589c9184561907bebbb56439b8f8787bc01f49a7c77276c58c1b09822d75e8e8","location":"koreasouth-001","comment":"bootnode-azure-koreasouth-001"},{"ip":"104.42.217.25","port":30303,"id":"5d6d7cd20d6da4bb83a1d28cadb5d409b64edf314c0335df658c1a54e32c7c4a7ab7823d57c39b6a757556e68ff1df17c748b698544a55cb488b52479a92b60f","location":"westus-001","comment":"bootnode-azure-westus-001"}]},
  "blockchainUrl": {
    "scheme": "https",
    "host": "datonavault.com",
    "port": "8130"
  }
}

datona.blockchain.setProvider(bubbleNet.blockchainUrl, bubbleNet.blockchain);

function terminateContract(contractStr, options={}) {
  const contractAddress = addressBook.parseAddress(contractStr);
  const key = wallet.getApplicationKey(options.key);
  const contract = new datona.blockchain.Contract(sdacAbi.v1, contractAddress);
  return contract.terminate(key);
}

function callContract(contractStr, method, args, options) {
  const contractAddress = addressBook.parseAddress(contractStr);
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  return contract.call(method, _expandAddresses(args));
}

function transactContract(contractStr, method, args, options={}) {
  const contractAddress = addressBook.parseAddress(contractStr);
  const abi = options.abi ? JSON.parse(options.abi) : (options.file ? JSON.parse(readFile(options.file, "source code file")).abi : sdacAbi.v1);
  if (!abi) throw new Error("abi or source code file is invalid");
  const expandedArgs = options.noexpand ? args : _expandAddresses(args);
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  console.trace("key:", key.address);
  console.trace("contract:", contractAddress);
  console.trace("calling:", method+'('+expandedArgs.join(', ')+')');
  const contract = new datona.blockchain.Contract(abi, contractAddress);
  return contract.transact(key, method, expandedArgs);
}

function _expandAddresses(arr) {
  return arr.map(v => { return addressBook.parseAddress(v) });
}

