const fs = require('fs');
const glob = require('glob');

const bdfFiles = glob.sync('circuit_python/bitmap-fonts/*/*.bdf');

const sizes = bdfFiles.map((fn) => {
    const str = fs.readFileSync(fn, 'utf-8');
    const match = str.match(/^DWIDTH ([ \d]+)$/m);
    if (!match) return;

    const size = match[1].split(' ')[0];
    return {fn, size};
});

sizes.filter((s) => s);
sizes.sort((a, b) => parseInt(b.size) - parseInt(a.size));

sizes.forEach(({fn, size}) => {
    console.log(fn);
    console.log(size);
    console.log('');
});
