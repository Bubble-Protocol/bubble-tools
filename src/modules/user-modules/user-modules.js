import {existsSync} from 'fs';
import {APP_DIR} from "../../config.js";

import * as bubbleCore from '@bubble-protocol/core';
import * as bubbleClient from '@bubble-protocol/client';
import blockchain from '../blockchain/blockchain.js';
import wallet from "../wallet/wallet.js";
import addressBook from "../address-book/address-book.js";
import BubbleTools from '../bubble/bubble-tools.js';
import CryptoTools from '../crypto/crypto-tools.js';
import ImageTools from '../image/image-tools.js';
import ImageUtils from "../../utils/image-utils.js";
import StringUtils from "../../utils/string-utils.js";
import TimeUtils from "../../utils/time-utils.js";

const USER_MODULE_FILE = APP_DIR+'/modules.js';

// Imports for passing to any user modules
const imports = {
	bubbleSDK: {
		core: bubbleCore,
		client: bubbleClient
	},
	wallet: wallet,
	addressBook: addressBook,
	blockchain: blockchain,
	content: BubbleTools,
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