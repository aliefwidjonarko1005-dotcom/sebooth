const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.path);

const command = ffmpeg();
// Frame canvas
command.input('color=c=gray:s=800x1200').inputFormat('lavfi');
// Simulate 16:9 vertical video (e.g. 720x1280) with a test pattern
command.input('testsrc=size=720x1280:rate=30:duration=2').inputFormat('lavfi');
// Overlay placeholder
command.input('color=c=black@0.0:s=800x1200:d=2').inputFormat('lavfi');

const w = 400;
const h = 300;

let fg = '';
const rot = -90; // User examples often have rotated right/left (-90 or 90)
let targetW = w;
let targetH = h;
// Flip dimensions for scaling/cropping if rotating 90 or 270 degrees
if (Math.abs(rot) === 90 || Math.abs(rot) === 270) {
    targetW = h;
    targetH = w;
}

const rotRad = `(${rot}*PI/180)`;
// Important: Use ow='hypot...' to automatically bounds-check the rotated box, or just swap w/h if it's strictly 90.
// For purely 90 degree orthogonal rotations, ow/oh swapping is easier and exact to the pixel.
const rotFilter = Math.abs(rot) === 90 || Math.abs(rot) === 270
    ? `rotate=${rotRad}:ow=ih:oh=iw:c=black@0.0`
    : `rotate=${rotRad}:ow='hypot(iw*cos(${rotRad}),ih*sin(${rotRad}))':oh='hypot(iw*sin(${rotRad}),ih*cos(${rotRad}))':c=black@0.0`;

// 1. Format to yuva420p for alpha transparency, Scale & Crop to the "pre-rotated" geometry.
// 2. Rotate.
fg += `[1:v]format=yuva420p,scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`;
if (rot) {
    fg += `,${rotFilter}`; // rotate AFTER scale+crop
}
fg += `[v0];`;

fg += '[0:v][v0]overlay=200:200:shortest=1[bg0];'; // Overlay at x,y
fg += '[bg0][2:v]overlay=0:0[out]';

command.complexFilter(fg, 'out')
    .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 28', '-pix_fmt yuv420p', '-t 2'])
    .output('test_rotate_geom_test.mp4')
    .on('start', (cmd) => console.log('Command:', cmd))
    .on('end', () => console.log('FFmpeg finished successfully!'))
    .on('error', (err) => console.error('FFmpeg failed:', err.message))
    .run();
