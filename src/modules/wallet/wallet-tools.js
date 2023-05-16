import { getBalance } from "../blockchain/blockchain.js";
import { generateAccount } from "../crypto/crypto.js";
import wallet from "./wallet.js";

function registerCommands(program, errorHandler) {

  const group = program
    .command('wallet')
    .description("view and manage your private keys" );

  // LISTKEYS Command
  group
    .command('list [label]')
    .description("lists the keys in your wallet and displays their public addresses" )
    .option('-p, --public-key', "display public key")
    .action(function(label, options){
      try{
        wallet.listKeys(label, options.publicKey).forEach(key => {
          const publicKey = options.publicKey ? '\t'+key.publicKey : '';
          console.log(key.label+'\t'+key.address+publicKey);
        })
      }
      catch(error) { errorHandler(error) }
    });

  // CREATEKEY Command
  group
    .command('create [label]')
    .summary("create a private key and optionally save it to the wallet with the given label" )
    .action(function(label){
      try{
        const account = generateAccount();
        if (label) wallet.addApplicationKey(label, account.privateKey);
        console.log(account.privateKey);
      }
      catch(error) { errorHandler(error) }
    });

  // ADDKEY Command
  group
    .command('add <label> [privateKey]')
    .summary("add a private key to the wallet with the given label" )
    .description("adds a private key to the wallet with the given label.  If privateKey is not given then a new random key is created." )
    .action(function(label, privateKey){
      try{
        if (privateKey) wallet.addApplicationKey(label, privateKey);
        else wallet.createApplicationKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // REMOVEKEY Command
  group
    .command('remove <label>')
    .description("remove the private key with the given name" )
    .action(function(label){
      try{
        wallet.removeApplicationKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // SETDEFAULTKEY Command
  group
    .command('set-default <label>')
    .description("set the default key to the given wallet key" )
    .action(function(label){
      try{
        wallet.setDefaultKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // RESETDEFAULTKEY Command
  group
    .command('reset-default')
    .description("resets the default key to the initial application key created on install" )
    .action(function(){
      try{
        wallet.resetDefaultKey();
      }
      catch(error) { errorHandler(error) }
    });

  // GETBALANCE Command
  group
    .command('balance')
    .description("displays the balance of a key or address" )
    .argument('[labelOrAddress]', "key label or account address.  If not given the default application key is used")
    .option('-c, --chain <chain>', 'chain id or name of the blockchain on which the contract is deployed')
    .action(function(labelOrAddress, options){
      try{
        const addressStr = labelOrAddress || wallet.getApplicationKey().address;
        getBalance(addressStr, options)
        .then(console.log)
        .catch(errorHandler)
      }
      catch(error) { errorHandler(error) }
    });

  // GETINFO Command
  group
    .command('info')
    .description("displays information about a key or label" )
    .argument('<key>', "private key (in hex) or label")
    .option('-p, --public-key', "display public key")
    .action(function(keyStr, options){
      try{
        const key = wallet.getInfo(keyStr);
        const publicKey = options.publicKey ? '\t'+key.publicKey : '';
        console.log(key.address+publicKey);
      }
      catch(error) { errorHandler(error) }
    });

}

const WalletTools = {
  registerCommands: registerCommands,
  wallet: wallet
}

export default WalletTools;

