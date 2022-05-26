import wallet from "./wallet.mjs";

function registerCommands(program, errorHandler) {

  // GETKEY Command
  program
    .command('wallet.list [label]')
    .description("lists the keys in your wallet and displays their public addresses" )
    .option('-p, --public-key', "display public key")
    .action(function(label, options){
      try{
        wallet.listKeys(label, options.publicKey).forEach(key => {
          const publicKey = options.publicKey ? '\t'+key.publicKey : '';
          console.log(key.name+'\t'+key.address+publicKey);
        })
      }
      catch(error) { errorHandler(error) }
    });

  // CREATEKEY Command
  program
    .command('wallet.create <label> [privateKey]')
    .description("create a new private key with the given name.  If privateKey is not given then a new random key is created." )
    .action(function(label, privateKey){
      try{
        if (privateKey) wallet.addApplicationKey(label, privateKey);
        else wallet.createApplicationKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // REMOVEKEY Command
  program
    .command('wallet.remove <label>')
    .description("remove the private key with the given name" )
    .action(function(label){
      try{
        wallet.removeApplicationKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // SETDEFAULTKEY Command
  program
    .command('wallet.setDefault <label>')
    .description("set the default key to the given wallet key" )
    .action(function(label){
      try{
        wallet.setDefaultKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // RESETDEFAULTKEY Command
  program
    .command('wallet.resetDefault')
    .description("resets the default key to the initial application key created on install" )
    .action(function(){
      try{
        wallet.resetDefaultKey();
      }
      catch(error) { errorHandler(error) }
    });

}

const WalletTools = {
  registerCommands: registerCommands,
  wallet: wallet
}

export default WalletTools;

