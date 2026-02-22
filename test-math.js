const W = 400;
const H = 300;
const angle = 20 * Math.PI / 180;

const actualBoundingWidth = W * Math.abs(Math.cos(angle)) + H * Math.abs(Math.sin(angle));
const hypotFormulaWidth = Math.hypot(W * Math.cos(angle), H * Math.sin(angle));

console.log("Actual BB Width:", actualBoundingWidth);
console.log("Hypot  BB Width:", hypotFormulaWidth);
