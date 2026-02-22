const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
// Frame canvas
command.input('color=c=gray:s=800x1200').inputFormat('lavfi');
// Simulate 16:9 vertical video (e.g. 720x1280) with a test pattern
command.input('testsrc=size=720x1280:rate=30:duration=2').inputFormat('lavfi'); // [1:v]

let fg = '';
const w = 400;
const h = 300;
const rot = -90; // Test 90 deg OR small angles like 15
const rotRad = `(${rot}*PI/180)`;

// We must allow the rotate filter bounding box to grow to hypot dimensions, otherwise it clips the original image.
// Then we scale & crop strictly to W x H, mimicking Sharp.
const rotateFilter = `rotate=${rotRad}:ow='hypot(iw*cos(${rotRad}),ih*sin(${rotRad}))':oh='hypot(iw*sin(${rotRad}),ih*cos(${rotRad}))':c=black@0.0`;

fg += `[1:v]format=yuva420p,${rotateFilter},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[v0];`;

fg += '[0:v][v0]overlay=200:200:shortest=1[out]';

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 2'])
    .output('test_rotate_perfect.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished perfectly!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
