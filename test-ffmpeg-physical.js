const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);
const fs = require('fs');

// Create test physical file
if (!fs.existsSync('test_dummy.mp4')) {
    ffmpeg().input('color=c=blue:s=100x100:d=1').inputFormat('lavfi')
        .output('test_dummy.mp4').on('end', runDupTest).run();
} else {
    runDupTest();
}

function runDupTest() {
    const command = ffmpeg();
    command.input('color=c=gray:s=400x400:d=2').inputFormat('lavfi');

    // Pass the exact same physical file 3 times
    command.input('test_dummy.mp4').inputOption('-stream_loop -1');
    command.input('test_dummy.mp4').inputOption('-stream_loop -1');
    command.input('test_dummy.mp4').inputOption('-stream_loop -1');

    // If fluent-ffmpeg collapsing is true, it only generates -i test_dummy.mp4 ONCE
    // And [1:v] [2:v] [3:v] will fail. 
    // OR what if fluent-ffmpeg generates the inputs but FFmpeg maps stream indices weirdly?
    let fg = '';
    fg += `[1:v]scale=100:100[v1];`
    fg += `[2:v]scale=100:100[v2];`
    fg += `[3:v]scale=100:100[v3];`

    fg += '[0:v][v1]overlay=0:0[bg1];';
    fg += '[bg1][v2]overlay=100:100[bg2];';
    fg += '[bg2][v3]overlay=200:200[out]';

    command.complexFilter(fg, 'out')
        .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 1'])
        .output('test_dup_physical.mp4')
        .on('start', (cmd) => {
            console.log('Command executed:', cmd);
            fs.writeFileSync('test_dup_cmd.txt', cmd);
        })
        .on('end', () => console.log('FFmpeg finished successfully!'))
        .on('error', (err) => console.error('FFmpeg failed:', err.message))
        .run();
}
