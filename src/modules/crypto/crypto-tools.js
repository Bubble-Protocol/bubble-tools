import { readFile } from "../../utils/file-utils.js";
import StringUtils from "../../utils/string-utils.js";
import { hash, publicKeyToAddress } from "./crypto.js";

function registerCommands(program, errorHandler) {

  // HASH Command
  program
    .command('hash [data]')
    .description('returns the keccak256 hash of the given string')
    .option('-f, --file <file>', 'hash the given file instead (any data string will be appended to the file data)')
    .action(function(data, options){
      try {
        if (options.file) data = readFile(options.file, "file") + data;
        console.log('0x'+hash(data || ''));
      }
      catch(error) { errorHandler(error) }
    });

  // PUBLICKEYTOADDRESS Command
  program
    .command('pub-to-address <publicKey>')
    .description('returns the 20-byte address generated from the given 32-byte publicKey')
    .action(function(publicKey){
      if (publicKey && publicKey.substring(0,2) === '0x') publicKey = publicKey.substring(2);
      console.log(publicKeyToAddress(publicKey));
    });

  // FROMBASE58 Command
  program
    .command('from-b58 <data>')
    .description('returns the decoded base-58 string')
    .action(function(data){
      console.log(StringUtils.base58ToString(data));
    });

  // TOBASE58 Command
  program
    .command('to-b58 <data>')
    .description('returns the base-58 encoded string')
    .action(function(data){
      console.log(StringUtils.stringToBase58(data));
    });

}

const CryptoTools = {
  registerCommands: registerCommands,
  publicKeyToAddress: publicKeyToAddress,
  base58ToString: StringUtils.base58ToString,
  stringToBase58: StringUtils.stringToBase58
}

export default CryptoTools;


//
// Internal Functions
//

