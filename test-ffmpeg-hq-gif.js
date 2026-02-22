const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath.path);

const delayMs = 500;
const fps = 1000 / delayMs;

// Let's create dummy frames
const tempPath = path.join(__dirname, 'temp_gif_test');
if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

async function run() {
    // Generate valid dummy jpegs using ffmpeg
    for (let i = 0; i < 3; i++) {
        await new Promise((res) => {
            const color = i === 0 ? 'red' : i === 1 ? 'green' : 'blue';
            ffmpeg()
                .input(`color=c=${color}:s=400x400:d=1`)
                .inputFormat('lavfi')
                .frames(1)
                .save(path.join(tempPath, `frame_${i}.jpg`))
                .on('end', res);
        });
    }

    const outputPath = path.join(tempPath, 'output.gif');

    // NEW APPROACH: Image Demuxer
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(path.join(tempPath, 'frame_%d.jpg'))
            .inputOptions([`-framerate ${fps}`])
            .complexFilter([
                '[0:v]split[v1][v2]',
                '[v1]palettegen=stats_mode=diff[pal]',
                '[v2][pal]paletteuse=dither=bayer:bayer_scale=5[outv]'
            ].join(';'))
            .outputOptions([
                '-map [outv]',
                '-loop 0'
            ])
            .save(outputPath)
            .on('end', () => {
                console.log('SUCCESS!');
                resolve();
            })
            .on('error', (err) => {
                console.error('FAILED!', err.message);
                reject(err);
            });
    });
}

run().catch(console.error);
