const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const fs = require('fs');
// Create two test videos
const v1 = 'test1.mp4';
const v2 = 'test2.mp4';

// Create a command to test identical inputs
const command = ffmpeg();
command.input('color=c=gray:s=800x1200:d=2').inputFormat('lavfi');
// Simulate inputs where [1:v] and [2:v] are EXACTLY the same file path
command.input('testsrc=size=400x300:rate=30:duration=2').inputFormat('lavfi'); // This is stream [1:v]
command.input('testsrc=size=400x300:rate=30:duration=2').inputFormat('lavfi'); // This is stream [2:v]

let fg = '';
// Let's see what happens when we use two identical lavfi test sources as inputs
fg += `[1:v]scale=200:200[v0];`;
fg += `[2:v]scale=200:200[v1];`;

fg += '[0:v][v0]overlay=0:0[bg0];'; // Top left
fg += '[bg0][v1]overlay=200:0[out]'; // Top right

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 2'])
    .output('test_dup_input.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished successfully!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
