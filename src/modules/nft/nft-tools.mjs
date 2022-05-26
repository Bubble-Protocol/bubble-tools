import datona from "datona-lib";
import wallet from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import  BlockchainTools from "../blockchain/blockchain-tools.mjs";
import StringUtils from "../../utils/string-utils.mjs";
import { parseDuration } from "../../utils/time-utils.mjs";

function registerCommands(program, errorHandler) {

  // MINT Command
  program
  .command('nft.mint <contract> <series> <tokenId> <recipient>')
  .description("mints an nft for the Bubble NFT contract" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .action(function(contract, series, tokenId, options={}){
    try{
      mintNft(contract, series, tokenId, options)
      .then(console.log)
      .catch(errorHandler);
    }
    catch(error) { errorHandler(error) }
  });

  // GENERATEMINTINVITATION Command
  program
  .command('nft.mint-invite <contract> <series> <tokenId>')
  .description("generates an mintWithInvite packet for the Bubble NFT contract with a 28-day expiry (use -e to change expiry)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-e, --expiry <expiryTime>', 'expiry duration in the form 12h (12 hours) or 7d (7days)')
  .action(function(contract, series, tokenId, options={}){
    try{
      console.log(generateMintInvitation(contract, series, tokenId, options));
    }
    catch(error) { errorHandler(error) }
  });

  // GENERATEMINTNEXTINVITATION Command
  program
  .command('nft.mint-next-invite <contract> <series>')
  .description("generates an mintNextWithInvite packet for the Bubble NFT contract with a 28-day expiry (use -e to change expiry)" )
  .option('-k, --key <key>', 'wallet key to use to sign the transaction')
  .option('-e, --expiry <expiryTime>', 'expiry duration in the form 12h (12 hours) or 7d (7days)')
  .action(function(contract, series, options={}){
    try{
      console.log(generateMintNextInvitation(contract, series, options));
    }
    catch(error) { errorHandler(error) }
  });

}

const NFTTools = {
  registerCommands: registerCommands,
  mintNft: mintNft,
  generateMintInvitation: generateMintInvitation,
  generateMintNextInvitation: generateMintNextInvitation
}

export default NFTTools;


//
// Internal Functions
//

const BubbleNFTAbi = [{"inputs": [{"internalType": "address", "name": "accountOrProxy", "type": "address"}, {"internalType": "string", "name": "contractName", "type": "string"}, {"internalType": "string", "name": "contractSymbol", "type": "string"}], "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "approved", "type": "address"}, {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Approval", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "operator", "type": "address"}, {"indexed": false, "internalType": "bool", "name": "approved", "type": "bool"}], "name": "ApprovalForAll", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Transfer", "type": "event"}, {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "approve", "outputs": [], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "bubbleURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOrProxy", "type": "address"}], "name": "changeContractOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "getApproved", "outputs": [{"internalType": "address", "name": "operator", "type": "address"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "uint32", "name": "series", "type": "uint32"}], "name": "getSeriesCount", "outputs": [{"internalType": "uint128", "name": "", "type": "uint128"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "operator", "type": "address"}], "name": "isApprovedForAll", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "uint32", "name": "series", "type": "uint32"}], "name": "isLocked", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint32", "name": "series", "type": "uint32"}], "name": "lock", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint32", "name": "series", "type": "uint32"}, {"internalType": "uint128", "name": "tokenId", "type": "uint128"}, {"internalType": "address", "name": "owner", "type": "address"}], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOrProxy", "type": "address"}, {"internalType": "uint32", "name": "series", "type": "uint32"}, {"internalType": "uint256", "name": "nonce", "type": "uint256"}, {"internalType": "uint256", "name": "expiryTime", "type": "uint256"}, {"internalType": "bytes", "name": "ownerSignature", "type": "bytes"}], "name": "mintNextWithInvite", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOrProxy", "type": "address"}, {"internalType": "uint32", "name": "series", "type": "uint32"}, {"internalType": "uint128", "name": "tokenId", "type": "uint128"}, {"internalType": "uint256", "name": "expiryTime", "type": "uint256"}, {"internalType": "bytes", "name": "ownerSignature", "type": "bytes"}], "name": "mintWithInvite", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "ownerOf", "outputs": [{"internalType": "address", "name": "owner", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "nonce", "type": "uint256"}, {"internalType": "bytes", "name": "signature", "type": "bytes"}], "name": "proxyTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "safeTransferFrom", "outputs": [], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "bytes", "name": "data", "type": "bytes"}], "name": "safeTransferFrom", "outputs": [], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "_approved", "type": "bool"}], "name": "setApprovalForAll", "outputs": [], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "string", "name": "URI", "type": "string"}], "name": "setBubbleURI", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}], "name": "supportsInterface", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "pure", "type": "function"}, {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"}];

function mintNft(contractAddress, series, tokenId, recipientAddress, options) {
  const contract = addressBook.parseAddress(contractAddress);
  if (!datona.assertions.isAddress(contract)) throw new Error('invalid contract address');
  const seriesHex = _paramToHex(series, 8, "series");
  const tokenIdHex = _paramToHex(tokenId, 32, "tokenId");
  const recipient = addressBook.parseAddress(recipientAddress);
  if (!datona.assertions.isAddress(recipient)) throw new Error('invalid recipient address');
  return BlockchainTools.transactContract(contractAddress, 'mint', [seriesHex, tokenIdHex, recipientAddress], {...options, abi: BubbleNFTAbi})
}

function generateMintInvitation(contractAddress, series, tokenId, options={}) {
  // abi.encodePacked("mintWithInvite", address(this), uint32 series, uint128 tokenId, uint expiryTime)
  const contract = addressBook.parseAddress(contractAddress);
  if (!datona.assertions.isAddress(contract)) throw new Error('invalid contract address');
  if (!series) throw new Error('missing series');
  if (!tokenId) throw new Error('missing tokenId');
  const duration = parseDuration(options.expiryTime || '28d');
  if (!duration) throw new Error('invalid expiry time');
  let expiryTime = Math.trunc(new Date(Date.now()+duration).getTime() / 1000)
  const packet = encodePacked(
    {type: 'text', value: "mintWithInvite"}, 
    {type: 'address', value: contract}, 
    {type: 'uint32', value: series}, 
    {type: 'uint128', value: tokenId}, 
    {type: 'uint256', value: expiryTime}
  );
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  const signature = '0x'+key.sign(datona.crypto.hash(packet));
  const invite = {
    c: contract,
    s: series,
    t: tokenId,
    e: expiryTime,
    sig: signature
  }
  console.debug(invite);
  return StringUtils.stringToBase58(JSON.stringify(invite));
}


function generateMintNextInvitation(contractAddress, series, options={}) {
  // abi.encodePacked("mintWithInvite", address(this), uint32 series, uint128 tokenId, uint expiryTime)
  const contract = addressBook.parseAddress(contractAddress);
  if (!datona.assertions.isAddress(contract)) throw new Error('invalid contract address');
  if (!series) throw new Error('missing series');
  const duration = parseDuration(options.expiryTime || '28d');
  if (!duration) throw new Error('invalid expiry time');
  const nonce = '0x'+datona.crypto.hash(contractAddress + Date.now() + "nonce");
  let expiryTime = Math.trunc(new Date(Date.now()+duration).getTime() / 1000)
  const packet = encodePacked(
    {type: 'text', value: "mintNextWithInvite"}, 
    {type: 'address', value: contract}, 
    {type: 'uint32', value: series}, 
    {type: 'hex', value: nonce}, 
    {type: 'uint256', value: expiryTime}
  );
  const key = wallet.getApplicationKey(options.key);
  if (!key) throw new Error('you must connect to your bubble or manually add a key');
  const signature = '0x'+key.sign(datona.crypto.hash(packet));
  const invite = {
    c: contract,
    s: series,
    n: nonce,
    e: expiryTime,
    sig: signature
  }
  console.debug(invite);
  return StringUtils.stringToBase58(JSON.stringify(invite));
}

// 0x6d696e7457697468496e76697465d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000006274067d
// 0x6d696e7457697468496e76697465d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000006274067d
const clParamRegex = /[0-9]+$/;

function encodePacked(...args) {
  const packet = new Uint8Array(1024);
  let index = 0;
  args.forEach(arg => {
    const customLengthParam = clParamRegex.test(arg.type);
    const type = customLengthParam ? arg.type.replace(clParamRegex, '') : arg.type;
    let length = customLengthParam ? parseInt(arg.type.substring(arg.type.search(clParamRegex)))/8 : undefined;
    switch (type) {

      case 'text':
        packet.set(StringUtils.textToByteArray(arg.value, arg.value.length), index);
        console.debug(arg, type, index, arg.value.length);
        index += arg.value.length;
        break;
        
      case 'hex':
        if (!customLengthParam) length = arg.value.startsWith('0x') ? arg.value.length/2 - 1 : arg.value.length/2;
        packet.set(StringUtils.hexToByteArray(arg.value, length), index);
        console.debug(arg, type, index, length);
        index += length;
        break;

      case 'address':
        packet.set(StringUtils.hexToByteArray(arg.value, 20), index);
        console.debug(arg, type, index, 20);
        index += 20;
        break;

      case 'bool':
        packet.set(StringUtils.uintToByteArray(arg.value ? 1 : 0, 1), index);
        console.debug(arg, type, index, 1);
        index += 1;
        break;

      case 'uint':
        if (!customLengthParam) length = 32;  // default to uint256
        packet.set(StringUtils.uintToByteArray(arg.value, length), index);
        console.debug(arg, type, index, length);
        index += length;
        break;

      default:
        throw new Error("invalid type passed to encodePacked: '"+type+"'");
    }
  })
  const finalPacket = packet.slice(0, index);
  console.debug(finalPacket.length+' bytes', '0x'+datona.crypto.uint8ArrayToHex(finalPacket))
  return finalPacket;
}

function _paramToHex(param, byteLength, descriptiveName='parameter') {
  if (!param) throw new Error('missing '+descriptiveName);
  const baseHex = '0x'+'00'.repeat(byteLength)
  if (param.startsWith('0x')) return (baseHex+param.substring(2)).slice(-byteLength*2);
  else {
    const intParam = parseInt(param);
    if (isNaN(intParam)) throw new Error('invalid '+descriptiveName);
    return (baseHex+intParam.toString(16)).slice(-byteLength*2);
  }
}
