const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
command.input('color=c=black@0.0:s=800x1200').inputFormat('lavfi');
// Simulate 16:9 vertical video (e.g. 720x1280)
command.input('testsrc=size=720x1280:rate=30:duration=2').inputFormat('lavfi');
// Simulate another 16:9 video
command.input('testsrc=size=1080x1920:rate=30:duration=2').inputFormat('lavfi');
command.input('color=c=green:s=800x1200:d=2').inputFormat('lavfi');

// Slot 1: 400x300 (Wider than video, should crop top/bottom)
// Slot 2: 200x600 (Taller than video, should crop left/right)

let fg = '';
// Scale to cover, then crop to exact slot size
fg += '[1:v]scale=400:300:force_original_aspect_ratio=increase,crop=400:300[v0];';
fg += '[2:v]scale=200:600:force_original_aspect_ratio=increase,crop=200:600[v1];';

fg += '[0:v][v0]overlay=0:0:shortest=1[bg0];';
fg += '[bg0][v1]overlay=0:400:shortest=0[bg1];';
fg += '[bg1][3:v]overlay=0:0[out]';

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 5'])
    .output('test_crop_output.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished successfully!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
