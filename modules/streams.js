const {Readable, Writable} = require('stream');


class MyWritable extends Writable {
    _write(data, encode, cb) {
        console.log('_write', data);

        cb();
    }
}

let count = 0;

class MyReadable extends Readable {
    _read() {


        setTimeout(() => {
            console.log('START READ');
            if (count > 4) {
                console.log('END! COUNT > 12');
                this.push(null);
            } else {
                count++;
                const buf = Buffer.from('1111111111');
                this.push(buf);
            }
        }, 1000);
    }
}

const writable = new MyWritable();
// writable.write('some string');

let counter2 = 0;
const myReadable = new MyReadable();

myReadable.on('readable', () => {
    const a = myReadable.read(10);
console.log(a, 'a');
    if (!a) {
        console.log(counter2);
        counter2++;
    } else {
        counter2 = 0;
        console.log('a comes', a);
    }
});

myReadable.on('end', () => {
    console.log('STREAM END');
});

myReadable.on('error', error => {
    console.log('STREAM ERROR', error);
});

myReadable.pipe(writable);

// myReadable.on('data', (data) => {
//   console.log('readed data', data);
// }) // -> flowing mode