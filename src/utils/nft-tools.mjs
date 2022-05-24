import datona from "datona-lib";
import { addressBook, wallet } from "./bubble-tools.mjs";
import StringUtils from "./string-utils.mjs";
import { parseDuration } from "./time-utils.mjs";

export function generateMintInvitation(contractAddress, series, tokenId, options={}) {
  // abi.encodePacked("mintWithInvite", address(this), uint32 series, uint128 tokenId, uint expiryTime)
  const contract = addressBook.parseAddress(contractAddress);
  if (!datona.assertions.isAddress(contract)) throw new Error('invalid contract address');
  if (!series) throw new Error('missing series');
  if (!tokenId) throw new Error('missing tokenId');
  const duration = parseDuration(options.expiryTime || '7d');
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


export function generateMintNextInvitation(contractAddress, series, options={}) {
  // abi.encodePacked("mintWithInvite", address(this), uint32 series, uint128 tokenId, uint expiryTime)
  const contract = addressBook.parseAddress(contractAddress);
  if (!datona.assertions.isAddress(contract)) throw new Error('invalid contract address');
  if (!series) throw new Error('missing series');
  const duration = parseDuration(options.expiryTime || '7d');
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