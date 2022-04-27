function generateMintInvitation(contractAddress, series, tokenId, expiryTime) {
  // abi.encodePacked("mintWithInvite", address(this), uint32 series, uint128 tokenId, uint expiryTime)
  return encodePacked(
    {type: 'text', value: "mintWithInvite"}, 
    {type: 'address', value: contractAddress}, 
    {type: 'uint32', value: series}, 
    {type: 'uint128', value: tokenId}, 
    {type: 'uint256', value: expiryTime}
  );
}

const clParamRegex = /.*[0-9]+/;

function encodePacked(...args) {
  const packet = new Uint8Array(1024);
  let index = 0;
  args.forEach(arg => {
    const customLengthParam = clParamRegex.test(arg.type);
    const type = customLengthParam ? arg.type.replace(clParamRegex, '') : arg.type;
    let length = customLengthParam ? parseInt(arg.type.search(clParamRegex))/8 : undefined;
    switch (type) {

      case 'text':
        packet.set(stringUtils.textToByteArray(arg.value, arg.value.length), index);
        index += arg.value.length;
        break;
        
      case 'hex':
        if (!customLengthParam) length = arg.value.startsWith('0x') ? arg.value.length/2 - 1 : arg.value.length/2;
        packet.set(stringUtils.hexToByteArray(arg.value, length), index);
        index += length;
        break;

      case 'address':
        packet.set(stringUtils.hexToByteArray(arg.value, 20), index);
        index += 20;
        break;

      case 'bool':
        packet.set(stringUtils.uintToByteArray(arg.value ? 1 : 0, 1), index);
        index += 1;
        break;

      case 'uint':
        if (!customLengthParam) length = 32;  // default to uint256
        packet.set(stringUtils.uintToByteArray(arg.value, length), index);
        index += arg.length;
        break;

    }
  })
  return packet.slice(0, index);
}