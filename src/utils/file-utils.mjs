/**
 * General File utility functions
 */

import fs from 'fs';
 
/**
 * Synchronous function that returns the contents of the given file.  Throws if the file
 * does not exist or cannot be read.  If the descriptiveName is given it will be inserted
 * into any error messages.
 * 
 * Options:
 *   - encoding: string giving the file encoding.  Defaults to utf8.
 */
 export function readFile(filename, descriptiveName='file', options={}) {
  console.trace("reading file "+filename);
  if (!fs.existsSync(filename)) throw new Error(descriptiveName+' does not exist');
  try {
    fs.readFileSync(filename, {encoding: options.encoding || 'utf8'});
  }
  catch(error) {
    console.trace(error);
    throw new Error(descriptiveName+' could not be read: '+error.message);
  }
}

