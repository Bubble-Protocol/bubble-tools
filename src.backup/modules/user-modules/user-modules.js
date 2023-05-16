import {existsSync} from 'fs';
import {APP_DIR} from "../../config.mjs";

import blockchain from '../blockchain/blockchain.mjs';
import wallet from "../wallet/wallet.mjs";
import addressBook from "../address-book/address-book.mjs";
import BubbleTools from '../bubble/bubble-tools.mjs';
import CryptoTools from '../crypto/crypto-tools.mjs';
import ImageTools from '../image/image-tools.mjs';
import ImageUtils from "../../utils/image-utils.mjs";
import StringUtils from "../../utils/string-utils.mjs";
import TimeUtils from "../../utils/time-utils.mjs";

const USER_MODULE_FILE = APP_DIR+'/modules.mjs';

// Imports for passing to any user modules
const imports = {
	wallet: wallet,
	addressBook: addressBook,
	blockchain: blockchain,
	vault: BubbleTools,
	CryptoTools: CryptoTools,
	ImageTools: ImageTools,
	ImageUtils: ImageUtils,
	StringUtils: StringUtils,
	TimeUtils: TimeUtils
}

async function registerCommands(program, errorHandler) {
  if (existsSync(USER_MODULE_FILE)) {
    return import(USER_MODULE_FILE)
    .then( (userModules) => {
      if (!userModules.registerCommands) errorHandler(new Error('registerCommands function is missing from '+USER_MODULE_FILE));
      else userModules.registerCommands(program, errorHandler, imports);
    })
  }
}

const UserModules = {
  registerCommands: registerCommands
}

export default UserModules;