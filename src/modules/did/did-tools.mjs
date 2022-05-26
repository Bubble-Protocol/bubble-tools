
import { BubbleDIDURL, createDID } from "../../utils/bubble-utils.mjs";


function registerCommands(program, errorHandler) {

  // DID2ADDRESS Command
  program
  .command('did2address <did>')
  .description('extracts the ethereum contract address from the given did')
  .action(function(did){
    console.log(didToAddress(did));
  });

  // DECODEDID Command
  program
  .command('decodeDid <did>')
  .description('decodes and displays the given did url')
  .action(function(did){
    const didUrl = decodeDid(did);
    console.log('address:    '+didUrl.address);
    console.log('vault url:  '+didUrl.vaultServer.url);
    console.log('vault id:   '+didUrl.vaultServer.id);
    console.log('vault file: '+didUrl.file);
  });

  // ADDRESS2DID Command
  program
  .command('address2did <address>')
  .description('generates a plain DID for the given ethereum address')
  .action(function(address){
    console.log(addressToDid(address));
  });

}

const DIDTools = {
  registerCommands: registerCommands,
  didToAddress: didToAddress,
  decodeDid: decodeDid,
  addressToDid: addressToDid
}

export default DIDTools;


//
// Internal Functions
//

export function didToAddress(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl.address;
}

export function decodeDid(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl;
}

export function addressToDid(address) {
  return createDID(address);
}
