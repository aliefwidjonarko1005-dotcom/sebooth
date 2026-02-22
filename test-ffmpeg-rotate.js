const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
command.input('color=c=black@0.0:s=800x1200').inputFormat('lavfi');
// Simulate 16:9 vertical video (e.g. 720x1280)
command.input('testsrc=size=720x1280:rate=30:duration=2').inputFormat('lavfi');
command.input('color=c=green:s=800x1200:d=2').inputFormat('lavfi');

// Slot: 400x300 slot, rotated 90 degrees.
// If the slot is drawn rotated, its bounding box width and height might be different. 
// A 400x300 slot rotated 90deg becomes 300x400 visually.
// To fill it, we first scale the video to cover 400x300, crop it to 400x300, and then rotate it 90 degrees.
// But wait, the standard rotation filter `rotate=90*PI/180:ow='rot=0?w:h':oh='rot=0?h:w'`

let fg = '';
// First scale and crop to the slot's original width/height.
const w = 400;
const h = 300;
const rot = 90;
const rotRad = `(${rot}*PI/180)`;
// Scale to cover slot dims, crop, then rotate. The output width/height of rotate depends on angle. 
// If multiples of 90:
fg += `[1:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},rotate=${rotRad}:ow='hypot(iw*cos(${rotRad}),ih*sin(${rotRad}))':oh='hypot(iw*sin(${rotRad}),ih*cos(${rotRad}))':c=none[v0];`;

fg += '[0:v][v0]overlay=200:200:shortest=1[bg0];'; // Overlay at x,y
fg += '[bg0][2:v]overlay=0:0[out]'; // Overlay the frame

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 2'])
    .output('test_rotate_output.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished successfully!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
