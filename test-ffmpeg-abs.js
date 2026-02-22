const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
command.input('color=c=gray:s=800x1200:d=2').inputFormat('lavfi');
// Simulate 16:9 vertical video
command.input('testsrc=size=720x1280:rate=30:duration=2').inputFormat('lavfi');

let fg = '';
const w = 400;
const h = 300;
const rot = -15; // 15 deg tilt
const rotRad = `(${rot}*PI/180)`;

// The CORRECT mathematically sound bounding box rotation logic:
// ow = W * |cos(A)| + H * |sin(A)|
// oh = W * |sin(A)| + H * |cos(A)|
const rotateFilter = `rotate=${rotRad}:ow='iw*abs(cos(${rotRad}))+ih*abs(sin(${rotRad}))':oh='iw*abs(sin(${rotRad}))+ih*abs(cos(${rotRad}))':c=black@0.0`;

fg += `[1:v]format=yuva420p,${rotateFilter},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[v0];`;

fg += '[0:v][v0]overlay=200:200:shortest=1[out]';

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 2'])
    .output('test_rotate_abs.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished perfectly!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
