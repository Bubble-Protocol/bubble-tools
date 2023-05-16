/*
 * Example user defined module extending the CLI with new group and command.  Exports a single 'registerCommands'
 * function, which the CLI calls on construction.  This function can add groups and/or commands to extend
 * the CLI in accordance with the Commander package usage - see https://www.npmjs.com/package/commander.
 *
 * Parameters:
 *   program - the Commander package.
 *   errorHandler - takes an Error object.  Outputs the error to the console, taking into account the -v option, then exits.
 *   imports - an object containing the other CLI modules thereby to give access to the wallet, address book, etc.
 * 
 * The imports object contains:
 * 
 *   blockchain from src/modules/blockchain/blockchain.js
 *   wallet from src/modules/wallet/wallet.js
 *   addressBook from src/modules/address-book/address-book.js
 *   BubbleTools from src/modules/bubble/bubble-tools.js
 *   CryptoTools from src/modules/crypto/crypto-tools.js
 *   ImageTools from src/modules/image/image-tools.js
 *   ImageUtils from src/utils/image-utils.js
 *   StringUtils from src/utils/string-utils.js
 *   TimeUtils from src/utils/time-utils.js
 *
 */

export function registerCommands(program, errorHandler, imports) {

  // Example group
  const group = program
    .command('my-group')
    .description("My amazing new commands" );

  // Example command, in this case added to the example group
  group
  .command('my-command <param1>')
  .description("my astonishing command" )
  .option('-o, --my-option <option>', 'example option')
  .action(function(param1, options={}){
    try{
      console.log(
        "Executing my-command with parameter "+param1, 
        options.myOption ? 'and option '+options.myOption : ''
      );
      console.log("Use -v to list the 'imports' object");
      console.debug("imports =", imports);
    }
    catch(error) { errorHandler(error) }
  });

}
