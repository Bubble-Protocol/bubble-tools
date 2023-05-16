import addressBook from "./address-book.mjs";

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
    .command('servers')
    .description("view and manage your bubble servers" );

  // SERVERS Command
  servers
    .command('list')
    .description('lists the vault servers that can be used with the --server option')
    .action(function(){
      try{ 
        const servers = addressBook.getServers();
        const colWidth = servers.reduce((max,s) => s.label.length > max ? s.label.length : max, 0);
        servers.forEach(s => {
          console.log(s.label+' '.repeat(colWidth-s.label.length)+'\t'+s.id+'\t'+s.url);
        })
      }
      catch(error) { errorHandler(error) }
    });

  // ADDSERVER Command
  servers
    .command('add <label> <url>')
    .summary('adds a server to the address book')
    .description('adds the given server so that it can be used with the --server option.  Label must be unique.')
    .action(function(label, url, id){
      try{
        addressBook.addServer(label, url)
      }
      catch(error) { errorHandler(error) }
    });

  // REMOVESERVER Command
  servers
    .command('remove <label>')
    .description('removes the given server from the address book')
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

