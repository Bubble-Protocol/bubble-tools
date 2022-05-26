import ImageUtils from "../../utils/image-utils.mjs";

function registerCommands(program, errorHandler) {

  // IMAGETOBASE64 Command
  program
    .command('imageToBase64 <file>')
    .description('returns the base-64 encoded representation of the given image file')
    .action(function(file){
      ImageUtils.imageFileToBase64(file)
        .then(result => {
          console.log(result);
        })
        .catch(errorHandler)
    });

}

const ImageTools = {
  registerCommands: registerCommands,
  imageFileToBase64: ImageUtils.imageFileToBase64
}

export default ImageTools;


//
// Internal Functions
//

