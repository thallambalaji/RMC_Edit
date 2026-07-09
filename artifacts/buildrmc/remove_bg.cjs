const Jimp = require('jimp');
const path = require('path');

const imgPath = path.join(__dirname, 'public', 'fortune_concrete_stamp.png');
const outPath = path.join(__dirname, 'public', 'fortune_concrete_stamp.png'); // overwrite

Jimp.read(imgPath)
  .then(image => {
    const threshold = 220; // 0-255, pixels brighter than this will be removed
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is close to white, make it transparent
      if (red > threshold && green > threshold && blue > threshold) {
        this.bitmap.data[idx + 3] = 0; // alpha
      }
    });
    
    return image.writeAsync(outPath);
  })
  .then(() => {
    console.log("Background removed successfully!");
  })
  .catch(err => {
    console.error("Error removing background:", err);
  });
