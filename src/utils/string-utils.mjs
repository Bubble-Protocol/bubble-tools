
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

function urlToString(url) {
  return url.scheme + '//' + url.host + (url.port ? ':'+url.port : "");
}

function stringToUrl(urlStr) {
  try {
    if (!urlStr) throw new Error("url is empty");
    const urlArray = urlStr.charAt(urlStr.length-1) === '/' ? urlStr.substr(0, urlStr.length-1).split(':') : urlStr.split(':');
    if (urlArray.length<2 || urlArray.length > 3) {
      throw new Error("Invalid url '"+urlStr+"'.  Must be of the form <protocol>://<host>[:<port>]");
    }
    const port = (urlArray.length === 2) ? undefined : parseInt(urlArray[2]);
    return {
      scheme: urlArray[0],
      host: urlArray[1].match(/\/\/(.*)/)[1],
      port: port
    };
  }
  catch(err) {
    alert(err.message);
    throw err;
  }
}

function capitalise(str) {
  return str[0].toUpperCase() + str.substring(1);
}

function capitaliseAllWords(str) {
  return str.split(' ')
    .map(a => a.trim())
    .map(a => a[0].toUpperCase() + a.substring(1))
    .join(" ")
}

function pluralise(str, value, includeValue = false) {
  const pluralisedStr = value === 1 ? str : str+"s";
  return includeValue ? value + " " +pluralisedStr : pluralisedStr;
}

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

//
// Cryptographic Utils
//


function textToByteArray(val, length) {
  const arr = new Uint8Array(length);
  let arrIndex = length - val.length;
  for (let i=0; i<val.length; i++) {
    arr[arrIndex++] = val.charCodeAt(i);
  }
  return arr;
}

function hexToByteArray(val, length) {
  if (val.startsWith("0x")) val = val.substr(2);
  const arr = new Uint8Array(length);
  const valArr = Buffer.from(val, 'hex');
  let arrIndex = length - valArr.length;
  for (let i=0; i<valArr.length; i++) {
    arr[arrIndex++] = valArr[i];
  }
  return arr;
}

function uintToByteArray(val, length) {
  const arr = new Uint8Array(length);
  let i = arr.length-1;
  while (val > 0) {
    arr[i--] = (val & 0xFF);
    val = val >> 8;
  }
  return arr;
}

function stringToBase58(str) { 
  if (str === undefined) return undefined; 
  return bs58.encode(Buffer.from(str)) 
}

function base58ToString(str) { 
  if (str === undefined) return undefined; 
  return bs58.decode(str).toString() 
}

function uintToBase58(int) { 
  const size = int/256 + 1;
  if (int === undefined) return undefined; 
  return bs58.encode(uintToByteArray(int, size))
}

function base58ToUint(str) { 
  if (str === undefined) return undefined; 
  return parseInt(bs58.decode(str).toString('hex'), 16); 
}

function hexToBase58(address) { 
  if (address === undefined) return undefined; 
  if (address.startsWith("0x")) address = address.substr(2); 
  return bs58.encode(Buffer.from(address, 'hex')) 
}

function base58ToHex(address) { 
  if (address === undefined) return undefined; 
  return "0x"+bs58.decode(address).toString('hex') 
}

//
// Exports
//

const StringUtils = {
  copyStringToClipboard: copyStringToClipboard,
  stringToUrl: stringToUrl,
  urlToString: urlToString,
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
  textToByteArray: textToByteArray,
  hexToByteArray: hexToByteArray,
  uintToByteArray: uintToByteArray
};

export default StringUtils;