import datona from "datona-lib";
import StringUtils from "../../utils/string-utils.mjs";

function registerCommands(program) {

  // HASH Command
  program
    .command('hash <data>')
    .description('returns the keccak256 hash of the given string')
    .action(function(data){
      console.log('0x'+datona.crypto.hash(data));
    });

  // PUBLICKEYTOADDRESS Command
  program
    .command('publicKeyToAddress <publicKey>')
    .description('returns the 20-byte address generated from the given 32-byte publicKey')
    .action(function(publicKey){
      if (publicKey && publicKey.substring(0,2) === '0x') publicKey = publicKey.substring(2);
      console.log(datona.crypto.publicKeyToAddress(datona.crypto.hexToUint8Array(publicKey)));
    });

  // FROMBASE58 Command
  program
    .command('fromBase58 <data>')
    .description('returns the base-58 decoded string')
    .action(function(data){
      console.log(StringUtils.base58ToString(data));
    });

  // TOBASE58 Command
  program
    .command('toBase58 <data>')
    .description('returns the base-58 encoded string')
    .action(function(data){
      console.log(StringUtils.stringToBase58(data));
    });

}

const CryptoTools = {
  registerCommands: registerCommands,
  publicKeyToAddress: datona.crypto.publicKeyToAddress,
  base58ToString: StringUtils.base58ToString,
  stringToBase58: StringUtils.stringToBase58
}

export default CryptoTools;


//
// Internal Functions
//

