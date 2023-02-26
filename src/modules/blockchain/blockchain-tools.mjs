import blockchain from "./blockchain.mjs";

function registerCommands(program, errorHandler) {

  const group = program
    .command('contract')
    .description("deploy, terminate, transact and call smart contracts" );

  // DEPLOYCONTRACT Command
  group
    .command('deploy [args...]')
    .summary('deploys a contract and outputs its address')
    .description('deploys a contract and outputs its address. Use the --file option or the --abi and --bytecode options to specify the contract source code')
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .option('-a, --abi <abi>', 'abi of contract (in json format)')
    .option('-b, --bytecode <bytecode>', 'bytecode of contract (hex string)')
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with the abi and bytecode.  Accepts the standard compiler output or a flattened version {"abi": [...], "bytecode": "..."}')
    .option('-s, --save <label>', 'save the deployed contract address to the address book with the given label')
    .option('-m, --memo <label>', 'use in conjunction with -s to save the deployed contract address with the given memo')
    .action(function(args, options){
      try{
        blockchain.deployContract(args, options)
        .then(console.log)
        .catch(error => { errorHandler(error) })
      }
      catch(error) { errorHandler(error) }
    });

  // TERMINATECONTRACT Command
  group
    .command('terminate <contract>')
    .description("terminates the given SDAC" )
    .option('-k, --key <key>', 'wallet key to use to sign the transaction')
    .action(function(contract, options){
      try{
        blockchain.terminateContract(contract, options)
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
    .option('-f, --file <sourceCodeFile>', 'json file containing an object with at least the abi, i.e. {"abi": [...], ...}')
    .action(function(contract, method, args, options){
      try{
        blockchain.transactContract(contract, method, args, options)
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

