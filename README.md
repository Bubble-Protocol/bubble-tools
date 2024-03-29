# Bubble Tools

[![NPM](https://img.shields.io/npm/v/@bubble-protocol/bubble-tools)](https://www.npmjs.org/package/@bubble-protocol/bubble-tools)

Command line developer tools for [Bubble Protocol](https://github.com/Bubble-Protocol/bubble-sdk).

Features: 
* deploy and manage smart contracts
* create and manage off-chain bubbles
* read, write, list and delete off-chain content
* cryptographic and bubble-related utility functions.  

# Installation

```
npm install -g @bubble-protocol/bubble-tools
```

# Usage

## Setup

### Initialise Your Wallet

```
bubble wallet create default-key
```
Replace `default-key` with a label of your choice.  This will generate a random private key and set it as the default key.

### Add An Off-Chain Storage Provider

For example, to add the Bubble Private Cloud use:

```
bubble providers add bubble-cloud https://vault.bubbleprotocol.com/v2/{nickname}
```

### Configure Your Blockchain Providers

*Note, you only need to configure blockchain providers if you want to manage smart contracts using the `contract` command.*

Create the file `~/.bubble-tools/providers` and paste the contents of [`providers.json`](./providers.json).  Edit to configure the url(s) of your Infura, QuickNode, Alchemy or other web3 provider.

OR

For personal development purposes you are free to use Bubble Protocol's providers:

```
curl https://vault.bubbleprotocol.com:8125/providers > ~/.bubble-tools/providers
```

By default the `contract` commands use the first chain listed in the file.  In all commands the default chain can be overridden with any other chain in the list using the `-c` option, which takes the chain id, name or nickname.
## Commands

Commands are organised in a hierarchy.  Use the following to list the top-level commands:
```
bubble
> Usage: cli <command> [options] [args]   # Try bubble <command> --help

  Options:
    -V, --version   output the version number
    -v, --verbose   trace and debug output
    -h, --help      display help for command

  Commands:
    wallet          view and manage your private keys
    addresses       view and manage your address book
    providers       view and manage your bubble providers
    content         create and manage off-chain content
    contract        deploy, terminate, transact and call smart contracts
    utils           general utility functions
    help [command]  display help for command
```

Use the following to list subcommands:

```
bubble <command>
```

Use `-h` with any command to obtain detailed help, parameters and options.

Use `-v` with any command to enable trace output and detailed errors.

### Wallet

The built-in wallet is not a crypto wallet but can be used to create and store private keys for simplifying commands when accessing bubble content and when interacting with on-chain contracts.

To list your keys use the `list` subcommand:
```
bubble wallet list
```

By default all commands will use the wallet's default key for signing transactions or accessing bubble content.  Use the `set-default` sub-command to switch the default key.

The default key can be overridden for any command with the `-k` option.  This option takes the key's label or a raw private key:
```
bubble contract deploy -f contract.json -k key-label
```

Just like an address from your address book, a key label can be used in place of a raw address in any command, whereby the label will be substituted with the key's account address.
 
### Address Book

The address book holds addresses of users and contracts.  Each address has a label and optional description.  Use the `list` command to view the address book.
```
bubble addresses list
```

An address label can be used in place of a raw address in any command:
```
bubble contract call address-label myMethod
``` 

An address label can be used in place of a filename or part of a filename.  It will be replaced with a 32-byte filename representation of the address (the address prefixed with 12 zero bytes):
```
bubble content read provider-label contract-label address-label/hello.txt -v
> [trace] read https://vault.bubbleprotocol.com/v2 0x574242BBAE5a46F444025b8596Cd70A8804ff9dc 0x0000000000000000000000009444C89bF13a5CEd4F4fF3d082e36f080c13F909/hello.txt {}
  hello world
```

### Provider Address Book

The provider address book holds the API URLs of off-chain storage providers.  A provider label can be used in place of a url in any command.
```
bubble providers list
```

To add the Bubble Private Cloud use:

```
bubble providers add bubble-cloud https://vault.bubbleprotocol.com/v2/{nickname}
```

The following variables can be used when adding a provider url:

- `{id}` : replaced with the chain's numeric id
- `{name}` : replaced with the chain's long-form name
- `{nickname}` : replaced with the chain's short-form name


### Contract

The `contract` command is used to deploy, call and transact with on-chain smart contracts:
```
bubble contract deploy --abi [...] --bytecode 0x123...456 arg1 arg2 --save 'test-contract'
```

### Content

The `content` command is used to access and manage off-chain storage.  Use it to:
* create and terminate bubbles
* read, write, append and delete content
* mkdir directories
* list content metadata

Example of creating, accessing and deleting an off-chain bubble:
```
bubble content create-bubble bubble-cloud test-contract

bubble content mkdir bubble-cloud test-contract 1

bubble content write bubble-cloud test-contract 1/test.txt --data 'hello world'

bubble content read bubble-cloud test-contract 1/test.txt
> hello world

bubble content list bubble-cloud test-contract 1 --long
> [
    {
      name: '0x0000000000000000000000000000000000000000000000000000000000000001',
      type: 'file',
      length: 11,
      created: 1684236707761,
      modified: 1684236707765
    }
  ]

bubble content delete-bubble bubble-cloud test-contract
```

### Utils

The `utils` command has various string, cryptographic and bubble related utilities commonly used in development.

```
bubble hash -f myFile.txt
> 0xc8db449763662266bc96d1ba27253e335bb0baf6128943403f2682fe7ae594b7
```

```
bubble utils id bubble-cloud test-contract 0x01/test.txt --did
> did:bubble:eyJjaGFpbiI6ODQ1MzEsImNvbnRyYWN0IjoiMHg1NzQyNDJCQkFFNWE0NkY0NDQwMjViODU5NkNkNzBBODgwNGZmOWRjIiwicHJvdmlkZXIiOiJodHRwczovL3ZhdWx0LmJ1YmJsZXByb3RvY29sLmNvbS92MiIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEvdGVzdC50eHQifQ
```

## Configuration

By default, all your addresses, your wallet (including local private keys) and any configuration files are held in the `~/.bubble-tools` directory.  You should not need to modify these files directly, except to add your own commands.

## Extend With Your Own Commands

Extend the CLI with your own commands.  Copy [src/modules/user-modules/user-module-template.mjs](./src/modules/user-modules/user-module-template.mjs) to `~/.bubble-tools/modules.mjs` and add your commands.  See the template for more details.

# Credits

Powered by [Bubble Protocol](https://bubbleprotocol.com)
