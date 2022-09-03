# Bubble Tools

[![NPM](https://img.shields.io/npm/v/@bubble-protocol/bubble-tools)](https://www.npmjs.org/package/@bubble-protocol/bubble-tools)

Command line developer tools for [Bubble Protocol](https://bubbleprotocol.com). Lets you use your [Bubble ID](https://datonavault.com/bubble) on the command line to create and manage bubbles, read and write bubble content, interact with access control smart contracts (ACCs), and other utility functions.  

# Installation

```
npm install -g @bubble-protocol/bubble-tools
```
# Usage

## Initialise Your Local Wallet

To initialise your wallet and connect it to your Bubble ID, use the following command.

```
bubble wallet connectToBubble
```
### Connect To Your Bubble ID

The output of the `connectToBubble` command above includes a request code to paste into your [Bubble Dashboard](https://datonavault.com/bubble).  This will connect bubble tools to your Bubble ID letting you transact as your personas using the application's local private key.

**NB: Bubble Tools requests admin rights over your personas.  For security, it is recommended you disable it in your dashboard when not using it and enable it only when you need it.**

## List All Commands

```
$ bubble
```

This will display a list of commands.  Each command has subcommands.  Use the following to list the subcommands for a command:

```
$ bubble <command>
```


## Configuration

All your addresses, your wallet (including local private keys) and any configuration files are held in the `~/.bubble-tools` directory.

### Change Blockchain Provider

Create or edit the `~/.bubble-tools/provider` file and give your provider url and blockchain in JSON format.  E.g.:

```
{
  "blockchain": "ropsten",
  "blockchainUrl": "https://ropsten.infura.io/v3/YOUR_PROJECT_ID"
}
```

### Extend With Your Own Commands

Extend the CLI with your own commands.  Copy [src/modules/user-modules/user-module-template.mjs](./src/modules/user-modules/user-module-template.mjs) to `~/.bubble-tools/modules.mjs` and add your commands.  See the template for more details.

# Credits

Powered by [Bubble Protocol](https://bubbleprotocol.com)