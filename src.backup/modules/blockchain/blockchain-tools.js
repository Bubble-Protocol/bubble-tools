import blockchain from "./blockchain.mjs";

function registerCommands(program, errorHandler) {

  const group = program
    .command('contract')
    .description("deploy, terminate, transact and call smart contracts" );

  // DEPLOYCONTRACT Command
  group
    .command('deploy [constructor_args...]')
    .summary('deploys a contract and outputs its address')
    .description('deploys a contract and outputs its address. Use the --file option or the --abi and --bytecode options to specify the contract source code')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-b, --bytecode <bytecode>', 'bytecode of contract (hex string)')
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which to deploy')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with the abi and bytecode.  Accepts the standard compiler output or a flattened version {"abi": [...], "bytecode": "..."}')
    .option('-s, --save <label>', 'save the deployed contract address to the address book with the given label')
    .option('-m, --memo <label>', 'use in conjunction with -s to save the deployed contract address with the given memo')
    .action(async function(args, options){
      try{
        blockchain.deployContract(args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // CALLCONTRACT Command
  group
    .command('call <contract> <method> [args...]')
    .summary('calls the given pure or view method of the given contract')
    .description('calls the given pure or view method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which to deploy')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        blockchain.callContract(contract, method, args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // TRANSACTCONTRACT Command
  group
    .command('transact <contract> <method> [args...]')
    .summary('transacts with the given method of the given contract')
    .description('transacts with the given method of the given contract. Assumes the contract is an SDAC unless the contract source code is given with the --abi or --file option')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .option('-s, --silent', 'no output')
    .option('-o, --options <txnOptions>', 'json object containing ethereumjs-tx transaction options, e.g. {"value": 10000, "gasPrice": "0x09184e72a000"}')
    .action(function(contract, method, args, options){
      try{
        blockchain.transactContract(contract, method, args, options)
        .then(receipt => { 
          if (program.opts().verbose) console.log(receipt);
          else if(!options.silent) console.log('tx-hash:', receipt.transactionHash)
        })
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // GETPERMISSIONS Command
  group
    .command('permissions <contract> [user] [fileId]')
    .summary('returns the access permissions of the given Bubble contract for the given user and file Id')
    .description('Applies to a Bubble Protocol Access Control Contracts only.  Returns the access permissions for the given user and file Id. If user is missing then the default wallet address is used. If file Id is missing then the root path (0) is used.')
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which to deploy')
    .action(function(contract, user, fileId, options){
      try{
        blockchain.getPermissions(contract, user, fileId, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // GETEVENTS Command
  group
    .command('events <contract> <event>')
    .summary('gets any past events for a given contract with the given event name')
    .description('get past events for the contract given in the source code specified with the --abi or --file option.')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .option('-m, --fromBlock <block_number>', 'block number (greater than or equal to) from which to get events on (defaults to "earliest"). Pre-defined block numbers as "earliest", "latest" , "pending" , "safe" or "finalized" can also be used.')
    .option('-t, --toBlock <block_number>', 'block number (less than or equal to) to get events up to (defaults to "latest"). Pre-defined block numbers as "earliest", "latest" , "pending" , "safe" or "finalized" can also be used.')
    .option('-r, --filter <json>', 'lets you filter events by indexed parameters, e.g. {"myNumber": [12,13]} means all events where “myNumber” is 12 or 13')
    .action(function(contract, event, options){
      try{
        blockchain.getEvents(contract, event, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

}

const BlockchainTools = {
  registerCommands: registerCommands,
  ...blockchain
}

export default BlockchainTools;

