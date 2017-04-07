const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

fs.createReadStream('goku.png')
    .pipe(new PNG())
    .on('parsed', function () {
        split(this);
    });

function split(img) {
    const paletteImage = new PNG({ width: 256, height: 1 });
    const colors = {};
    let xCoord = 0;
    let yCoord = 0;

    for (let y = 0; y < img.height; ++y) {
        for (let x = 0; x < img.width; ++x) {
            const idx = (img.width * y + x) << 2;
            const color = (img.data[idx] << 16) + (img.data[idx+1] << 8) + img.data[idx+2];

            // If this is a new color store the index and write it to the palette image.
            if (colors[color] === undefined) {
                if (xCoord === paletteImage.width) {
                    const tmp = paletteImage;

                    xCoord = 0;
                    yCoord += 1;
                    paletteImage = new PNG({ width: paletteImage.width, height: yCoord });

                    tmp.bitblt(paletteImage, 0, 0, tmp.width, tmp.height, 0, 0);
                }

                const pidx = xCoord << 2;
                colors[color] = { x: xCoord, y: yCoord };

                ++xCoord;

                paletteImage.data[pidx] = img.data[idx];
                paletteImage.data[pidx+1] = img.data[idx+1];
                paletteImage.data[pidx+2] = img.data[idx+2];
                paletteImage.data[pidx+3] = 255;
            }

            img.data[idx] = colors[color].x;
            img.data[idx+1] = colors[color].y;
            img.data[idx+2] = 0;
            img.data[idx+3] = img.data[idx+3];
        }
    }

    // clear the rest of the data of the palette
    for (let y = yCoord; y < paletteImage.height; ++y) {
        for (let x = xCoord; x < paletteImage.width; ++x) {
            const idx = (paletteImage.width * y + x) << 2;
            paletteImage.data[idx] = 0;
            paletteImage.data[idx+1] = 0;
            paletteImage.data[idx+2] = 0;
            paletteImage.data[idx+3] = 0;
        }
    }

    paletteImage.pack().pipe(fs.createWriteStream('palette.png'));
    img.pack().pipe(fs.createWriteStream('map.png'));
}