/**
 * General Image utility functions
 */

import fs from 'fs';
import mime from 'mime-types';

/**
 * Returns a string containing the base64 representation of the given image file.  String includes 'data' uri header.
 */
export function imageFileToBase64(file) {
  return new Promise( (resolve, reject) => {
    fs.readFile(file, {}, (error, data) => {
      if (error) reject(error);
      const mimeType = mime.lookup(file) || 'image/unknown';
      resolve("data:"+mimeType+";base64,"+data.toString('base64'));
    })
  })
}

const ImageUtils = {
  imageFileToBase64: imageFileToBase64
}


export default ImageUtils;