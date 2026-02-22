const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
command.input('color=c=black@0.0:s=800x1200').inputFormat('lavfi');
command.input('color=c=red:s=400x300:d=2').inputFormat('lavfi');
command.input('color=c=blue:s=400x300:d=2').inputFormat('lavfi');
command.input('color=c=green:s=800x1200:d=2').inputFormat('lavfi');

let fg = '[1:v]scale=400:300[v0];[2:v]scale=400:300[v1];';
fg += '[0:v][v0]overlay=0:0:shortest=1[bg0];';
fg += '[bg0][v1]overlay=0:400:shortest=0[bg1];';
fg += '[bg1][3:v]overlay=0:0[out]';

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 5'])
    .output('test_output.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished successfully!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
