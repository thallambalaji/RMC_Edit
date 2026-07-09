const Jimp = require('jimp');
const path = require('path');

const inputPath = "C:/Users/HP/.gemini/antigravity-ide/brain/26660229-28ca-4900-85f4-4dacea714900/media__1783401123490.png";
const outputPath = path.join(__dirname, 'public', 'fortune_concrete_logo.png');

async function cropLogo() {
  try {
    const image = await Jimp.read(inputPath);
    console.log(`Original image size: ${image.bitmap.width}x${image.bitmap.height}`);
    
    // We want the logo in the top left.
    // The image is probably ~1000px wide. 
    // The logo box is the left 25% of the screen.
    // Let's crop a rectangle from the top left corner roughly corresponding to the logo.
    // Looking at the image, x=15 to 200, y=30 to 180 seems about right.
    // I'll extract 180x150 pixels starting at x=15, y=30.
    
    // Let's do a slightly wider crop just to be safe, e.g. 250x250, then we'll see.
    // Actually, Jimp allows us to just crop it directly: .crop(x, y, w, h)
    
    const cropX = 15;
    const cropY = 35;
    const cropW = 200;
    const cropH = 170;
    
    image.crop(cropX, cropY, cropW, cropH);
    await image.writeAsync(outputPath);
    console.log(`Cropped image saved to ${outputPath}`);
  } catch (err) {
    console.error('Error cropping image:', err);
  }
}

cropLogo();
