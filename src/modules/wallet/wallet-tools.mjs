import datona from "datona-lib";
import StringUtils from "../../utils/string-utils.mjs";
import { getBalance } from "../blockchain/blockchain.mjs";
import wallet from "./wallet.mjs";

function registerCommands(program, errorHandler) {

  const group = program
    .command('wallet')
    .description("view and manage your private keys" );

  // GETREQUEST Command
  group
    .command('connectToBubble')
    .description('returns the request to paste into your Bubble Dashboard to connect this app to your bubble')
    .action(function(){
      const key = wallet.hasApplicationKey() ? wallet.getApplicationKey() : wallet.createApplicationKey();
      if (key) {
        const publicKeyB58 = StringUtils.hexToBase58(datona.crypto.uint8ArrayToHex(key.publicKey));
        console.log("Paste the following request into your Bubble Dashboard:");
        console.log("WcUuFpWX1qTB3VrgHnECFr7c6Xc1YnQZAoZQPW5YenzF5CvjrHFDQkwHzvrsKRsiQkXJ3v2yR6tBWwk48cTK6eoBRx4aCWBn3mykepqKLSPMG35bEhjW9uVFi1pxkhzAoDSWNTEoSDTQpUN6He8cXgyV5gZgHXNgwceQNXxQuK5BApcLjvupHCRtFqcFr4jGWeeBoi9BcB2NFnUhWJUHStkoNocZVHy9zFpm&publicKey="+publicKeyB58);
      }
    });

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
    .command('create <label> [privateKey]')
    .summary("store or create a private key with the given label" )
    .description("create a new private key with the given label.  If privateKey is not given then a new random key is created." )
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
    .command('setDefault <label>')
    .description("set the default key to the given wallet key" )
    .action(function(label){
      try{
        wallet.setDefaultKey(label);
      }
      catch(error) { errorHandler(error) }
    });

  // RESETDEFAULTKEY Command
  group
    .command('resetDefault')
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
    .action(function(labelOrAddress){
      try{
        const addressStr = labelOrAddress || wallet.getApplicationKey().address;
        getBalance(addressStr)
        .then(console.log)
        .catch(error => { errorHandler(error) })
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

