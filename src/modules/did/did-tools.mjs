
import { BubbleDIDURL, createDID } from "../../utils/bubble-utils.mjs";
import StringUtils from "../../utils/string-utils.mjs";
import addressBook from "../address-book/address-book.mjs";


function registerCommands(program) {

  const group = program
    .command('did')
    .description("bubble decentralised identifier utils" );

  // INFO Command
  group
  .command('info <did>')
  .description('decodes and displays the given did url')
  .option('-a, --address', 'output address')
  .option('-u, --url', 'output vault url')
  .option('-i, --id', 'output vault id')
  .option('-f, --file', 'output vault file')
  .action(function(did, options){
    const didUrl = decode(did);
    const vaultServer = didUrl.vaultServer || {};
    const optCount = 0 + (options.address ? 1 : 0) + (options.url ? 1 : 0) + (options.id ? 1 : 0) + (options.file ? 1 : 0);
    if (options.address || optCount === 0) console.log((optCount === 1 ? '' : 'address:    ')+didUrl.address);
    if (options.url || optCount === 0) console.log((optCount === 1 ? '' : 'vault url:  ')+vaultServer.url);
    if (options.id || optCount === 0) console.log((optCount === 1 ? '' : 'vault id:   ')+vaultServer.id);
    if (options.file || optCount === 0) console.log((optCount === 1 ? '' : 'vault file: ')+didUrl.file);
  });

  // CREATE Command
  group
  .command('create <address> [url] [file]')
  .summary('generates a bubble DID')
  .description('generates a plain DID for the given ethereum address, vault server label or url (url must include the server id) and vault file')
  .action(function(address, url, file){
    console.log(create(address, url, file));
  });

}

const DIDTools = {
  registerCommands: registerCommands,
  decode: decode,
  create: create
}

export default DIDTools;


//
// Internal Functions
//

export function decode(did) {
  const didUrl = new BubbleDIDURL(did);
  return didUrl;
}

export function create(addressStr, serverStr, fileStr) {
  if (!addressStr) throw new Error('address is missing');
  if (!serverStr && fileStr) throw new Error('server is missing');
  const address = addressBook.parseAddress(addressStr);
  const server = addressBook.parseServer(serverStr);
  const file = addressBook.parseAddress(fileStr);
  if (!address) throw new Error('address is invalid');
  if (!server && fileStr) throw new Error('server is invalid');
  if (!file && serverStr) throw new Error('file is invalid');
  return createDID(address, server, file);
}
