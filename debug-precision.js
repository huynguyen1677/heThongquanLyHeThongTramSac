// Debug floating point precision issue
console.log('=== FLOATING POINT DEBUG ===\n');

const wh = 24;
const price = 2380;

console.log('Method 1 - Direct calculation:');
const kwh1 = wh / 1000;
const cost1 = kwh1 * price;
console.log(`${wh} Wh / 1000 = ${kwh1}`);
console.log(`${kwh1} * ${price} = ${cost1}`);
console.log(`Math.round(${cost1}) = ${Math.round(cost1)}`);

console.log('\nMethod 2 - More precise:');
const cost2 = (wh * price) / 1000;
console.log(`(${wh} * ${price}) / 1000 = ${cost2}`);
console.log(`Math.round(${cost2}) = ${Math.round(cost2)}`);

console.log('\nMethod 3 - Round at different stages:');
const kwh3 = Math.round((wh / 1000) * 10000) / 10000; // 4 decimal precision
const cost3 = kwh3 * price;
console.log(`Precise kWh: ${kwh3}`);
console.log(`${kwh3} * ${price} = ${cost3}`);
console.log(`Math.round(${cost3}) = ${Math.round(cost3)}`);

console.log('\nSimulator might be using different calculation or rounding...');
