const sharp = require('sharp');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

async function testSharp() {
    await new Promise((resolve) => {
        ffmpeg()
            .input('color=c=blue:s=1080x1920:d=1').inputFormat('lavfi')
            .outputOptions(['-vframes 1'])
            .output('test_sharp_in.jpg')
            .on('end', resolve)
            .run();
    });

    const W = 400;
    const H = 300;
    const rot = -15;

    await sharp('test_sharp_in.jpg')
        .rotate(rot)
        .resize({
            width: W,
            height: H,
            fit: 'cover',
            position: 'center'
        })
        .toFile('test_sharp_out.jpg');

    console.log(`Sharp finished. Created test_sharp_out.jpg (${W}x${H}).`);
}

testSharp().catch(console.error);
