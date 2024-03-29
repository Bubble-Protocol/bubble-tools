/**
 * General String utility functions
 * 
 */

import bs58 from "bs58";

function copyStringToClipboard (str) {
  let el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style = {position: 'absolute', left: '-9999px'};
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

/**
 * Returns a new string with the first letter capitalised
 */
function capitalise(str) {
  return str[0].toUpperCase() + str.substring(1);
}

/**
 * Returns a new string with all words capitalised
 */
function capitaliseAllWords(str) {
  return str.split(' ')
    .map(a => a.trim())
    .map(a => a[0].toUpperCase() + a.substring(1))
    .join(" ")
}

/**
 * Returns a new string appended with 's' if value != 1.
 * If includeValue is true then the value will be appended separated by a space
 */
function pluralise(str, value, includeValue = false) {
  const pluralisedStr = value === 1 ? str : str+"s";
  return includeValue ? value + " " +pluralisedStr : pluralisedStr;
}

/**
 * Returns the mimetype of the given url string based on the url's file extension
 */
function getMimeType(url) {
  const extensions = url.match(/\.[a-z0-9]+(?:\?|$)/);
  let mimeType = "unknown";
  if (extensions && extensions.length > 0) {
    switch (extensions[0].toLowerCase()) {
      case '.png': mimeType = "image/png"; break;
      case '.jpg': 
      case '.jpeg':
      case '.jpe':
        mimeType = "image/jpeg"; break;
      case '.gif': mimeType = "image/gif"; break;
      case '.tif': 
      case '.tiff':
        mimeType = "image/tiff"; break;
      case '.ief': mimeType = "image/ief"; break;
      case '.bmp': mimeType = "image/bmp"; break;
      case '.svg': mimeType = "image/svg+xml"; break;
      case '.jfif': mimeType = "image/pipeg"; break;
      case '.ico': mimeType = "image/x-icon"; break;
      case '.ras': mimeType = "image/x-cmu-raster"; break;
      case '.cmx': mimeType = "image/x-cmx"; break;
      case '.pnm': mimeType = "image/x-portable-anymap"; break;
      case '.pbm': mimeType = "image/x-portable-bitmap"; break;
      case '.pgm': mimeType = "image/x-portable-graymap"; break;
      case '.ppm': mimeType = "image/x-portable-pixmap"; break;
      case '.rgb': mimeType = "image/x-rgb"; break;
      case '.xbm': mimeType = "image/x-xbitmap"; break;
      case '.xpm': mimeType = "image/x-xpixmap"; break;
      case '.xwd': mimeType = "image/x-xwindowdump"; break;
      case 'mp2':
      case 'mpa':
      case 'mpe':
      case 'mpeg':
      case 'mpg':
      case 'mpv2':
        mimeType = "video/mpeg"; break;
      case '.mp4': mimeType = "video/mp4"; break;
      case '.avi': mimeType = "video/x-msvideo"; break;
      case '.movie': mimeType = "video/x-sgi-movie"; break;
      case 'mov':
      case 'qt':
        mimeType = "video/quicktime"; break;
      case 'lsf':
      case 'lsx':
        mimeType = "video/x-la-asf"; break;
      case 'asf':
      case 'asr':
      case 'asx':
        mimeType = "video/x-ms-asf"; break;
      default: 
    }
  }
  return mimeType;
}


/**
 * returns the unicode array representation of the given string
 */
function textToUint8Array(val, length) {
  const arr = new Uint8Array(length);
  let arrIndex = length - val.length;
  for (let i=0; i<val.length; i++) {
    arr[arrIndex++] = val.charCodeAt(i);
  }
  return arr;
}

/**
 * Returns the uint8 array representation of the given hex string.  Hex string may be with or
 * without a leading '0x'.  If length is not given it will be calculated from the string length.
 * 
 * Warning: the client is responsible for ensuring the string is a valid hex string.  Non-hex
 * chars will be converted to zero.
 */
function hexToUint8Array(val, length) {
  if (val.startsWith("0x")) val = val.slice(2);
  if (!length) length = val.length/2;
  const arr = new Uint8Array(length);
  const valArr = Buffer.from(val, 'hex');
  let arrIndex = length - valArr.length;
  for (let i=0; i<valArr.length; i++) {
    arr[arrIndex++] = valArr[i];
  }
  return arr;
}


/**
 * Returns the hex string representation of the array, without '0x' prefix.
 */
function uint8ArrayToHex(val) {
  if (!(val instanceof Uint8Array)) throw new Error('uint8ArrayToHex: value is not a uint8Array')
  return Buffer.from(val).toString('hex');
}


/**
 * Returns the byte array representation of the given unsigned integer.  The length of the
 * array must be provided by the client.
 * 
 * Warning: the client is responsible for ensuring the length is sufficient for holding the
 * the value or else an index error will be thrown.
 */
function uintToUint8Array(val, length) {
  const arr = new Uint8Array(length);
  let i = arr.length-1;
  while (val > 0) {
    arr[i--] = (val & 0xFF);
    val = val >> 8;
  }
  return arr;
}

/**
 * Returns a new string with the base-58 representation of the given string
 */
function stringToBase58(str) { 
  if (str === undefined) return undefined; 
  return bs58.encode(Buffer.from(str)) 
}

/**
 * Decodes the given base-58 encoded string and returns the result 
 */
function base58ToString(str) { 
  if (str === undefined) return undefined; 
  return bs58.decode(str).toString() 
}

/**
 * Returns a new string with the base-58 representation of the given unsigned integer
 */
function uintToBase58(int) { 
  if (int === undefined) return undefined; 
  const size = int/256 + 1;
  return bs58.encode(uintToUint8Array(int, size))
}

/**
 * Decodes the given base-58 encoded uint and returns the result 
 */
function base58ToUint(str) { 
  if (str === undefined) return undefined; 
  return parseInt(bs58.decode(str).toString('hex'), 16); 
}

/**
 * Returns a new string with the base-58 representation of the given hex string
 */
function hexToBase58(address) { 
  if (address === undefined) return undefined; 
  if (address.startsWith("0x")) address = address.substr(2); 
  return bs58.encode(Buffer.from(address, 'hex')) 
}

/**
 * Decodes the given base-58 encoded hex string and returns the result 
 */
function base58ToHex(address) { 
  if (address === undefined) return undefined; 
  return "0x"+bs58.decode(address).toString('hex') 
}

function uintToHex(val, byteLength) {
  if (!val) return undefined;
  const baseHex = '00'.repeat(byteLength)
  if (typeof val === 'number') val = ''+val;
  if (val.startsWith('0x')) return '0x'+(baseHex+val.substring(2)).slice(-byteLength*2);
  else {
    const intVal = parseInt(val);
    if (isNaN(intVal)) return undefined;
    return '0x'+(baseHex+intVal.toString(16)).slice(-byteLength*2);
  }
}

//
// Exports
//

const StringUtils = {
  copyStringToClipboard: copyStringToClipboard,
  getMimeType: getMimeType,
  hexToBase58: hexToBase58,
  base58ToHex: base58ToHex,
  stringToBase58: stringToBase58,
  base58ToString: base58ToString,
  uintToBase58: uintToBase58,
  base58ToUint: base58ToUint,
  capitalise: capitalise,
  capitaliseAllWords: capitaliseAllWords,
  pluralise: pluralise,
  textToUint8Array: textToUint8Array,
  hexToUint8Array: hexToUint8Array,
  uint8ArrayToHex: uint8ArrayToHex,
  uintToUint8Array: uintToUint8Array,
  uintToHex: uintToHex
};

export default StringUtils;