const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const imgPath = path.join(__dirname, 'public', 'fortune_concrete_stamp.png');

fs.createReadStream(imgPath)
  .pipe(new PNG({
      filterType: 4
  }))
  .on('parsed', function() {
      for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
              let idx = (this.width * y + x) << 2;
              
              const r = this.data[idx];
              const g = this.data[idx+1];
              const b = this.data[idx+2];
              
              // If the pixel is light colored (near white/grey), set alpha to 0
              if (r > 200 && g > 200 && b > 200) {
                  this.data[idx+3] = 0; // Transparent
              } else {
                  // Make the non-white pixels slightly darker just in case
                  this.data[idx+3] = 255;
              }
          }
      }
      this.pack().pipe(fs.createWriteStream(imgPath)).on('finish', () => {
          console.log('Background removed successfully!');
      });
  });
