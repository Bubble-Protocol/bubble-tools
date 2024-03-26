import addressBook from "./address-book.js";

function registerCommands(program, errorHandler) {

  const addresses = program
    .command('addresses')
    .description("view and manage your address book" );

  // ADDRESSES Command
  addresses
    .command('list')
    .description('displays the address book')
    .action(function(){
      try{ 
        const addresses = addressBook.getAddressBook();
        const colWidth = addresses.reduce((max,a) => a.label.length > max ? a.label.length : max, 0);
        addresses.forEach(a => {
          console.log(a.label+' '.repeat(colWidth-a.label.length)+'\t'+a.address+'\t'+(a.memo || ''));
        })
      }
      catch(error) { errorHandler(error) }
    });

  // ADDADDRESS Command
  addresses
    .command('add <label> <address> [memo]')
    .description('adds the given address to the address book.  Label must be unique')
    .option('-l, --toLowerCase', 'make address lowercase')
    .action(function(label, address, memo, options){
      try{
        addressBook.addAddress(label, address, memo, options)
      }
      catch(error) { errorHandler(error) }
    });

  // REMOVEADDRESS Command
  addresses
    .command('remove <label>')
    .description('removes the given address from the address book')
    .action(function(label){
      try{
        addressBook.removeAddress(label)
      }
      catch(error) { errorHandler(error) }
    });


  const servers = program
    .command('providers')
    .description("view and manage your bubble providers" );

  // PROVIDERS Command
  servers
    .command('list')
    .description('lists the off-chain storage providers that can be used with the --provider option')
    .action(function(){
      try{ 
        const servers = addressBook.getServers();
        const colWidth = servers.reduce((max,s) => s.label.length > max ? s.label.length : max, 0);
        servers.forEach(s => {
          console.log(s.label+' '.repeat(colWidth-s.label.length)+'\t'+s.url);
        })
      }
      catch(error) { errorHandler(error) }
    });

  // ADDPROVIDER Command
  servers
    .command('add <label> <url>')
    .summary('adds a provider to the address book')
    .description('adds the given provider so that it can be used with the --provider option.  Label must be unique.')
    .action(function(label, url, id){
      try{
        addressBook.addServer(label, url)
      }
      catch(error) { errorHandler(error) }
    });

  // REMOVEPROVIDER Command
  servers
    .command('remove <label>')
    .description('removes the given provider from the address book')
    .action(function(label){
      try{
        addressBook.removeServer(label)
      }
      catch(error) { errorHandler(error) }
    });

}

const AddressTools = {
  registerCommands: registerCommands,
  addressBook: addressBook
}

export default AddressTools;

