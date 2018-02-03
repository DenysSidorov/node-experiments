'use strict';
const Source = require('./readable.js');
const { Writable } = require('stream');
  class Writer extends Writable
{
    constructor(opt = {})
    {
        super(opt);
        console.log('objectMode ',    this._writableState.objectMode); //false по умолчанию, если не задано явно true
        console.log('highWaterMark ',  this._writableState.highWaterMark); //16384
        console.log('decodeStrings ',  this._writableState.decodeStrings); //true по умолчанию; преобразовывать ли в Buffer данные, до их передачи в метод _write()
        console.log('buffer ',       this._writableState.getBuffer()); //[] - пустой массив

        this.on('drain', ()=>
        {
            console.log('\n------ writable on drain');
        })
          .on('error', (err)=>
          {
              console.log('\n------ writable on error', err);
          })
          .on('finish', ()=>
          {
              console.log('\n------ writable on finish');
              console.log('_writableState.getBuffer()', this._writableState.getBuffer());
          });
    }
    /**
     * @param chunk - строка|буфер|объект
     * @param encoding - кодировка поступающих данных. если objectMode === true, значение encoding будет игнорироваться
     * @param done - callback ф-ция. ее удобнее именовать именно так, потому что вы ее вызываете, когда по логике
     * вашего метода _write, нужно сообщить, что завершили запись текущей части данных chunk, и готовы принять на запись
     * следующую часть: done(err) - можно передать объект ошибки new Error(...)
     * @private
     */
    _write(chunk, encoding, done)
    {
        console.log('_writableState.getBuffer()', this._writableState.getBuffer());
        console.log(typeof chunk );

        //для пример с потоком Transform см ниже
        if (typeof chunk === 'object') {
            // console.log('chunk = ', chunk.get(), chunk.get() +' in pow '+ chunk.get() +' = '+ chunk.inPow(chunk.get()));
        } else {
            console.log(`chunk = ${chunk}; isBuffer ${Buffer.isBuffer(chunk)}; chunk.length is ${chunk.length}; encoding = ${encoding}`);
        }
        /* Пример с ошибкой оставим закомментированным.
        Добавим, что:
        1) всегда добавляйте обработчик ошибок on('error', (err)=>{...})
        2) если выбрасывается ошибка, то поток данных Readable не прекращает свою работу.
        в этом случае вам надо обрабатывать эту ситуацию - например, вызывать Readable.emit('error', err);
        и прекращать читать данные Readable.puse(), после обработки ошибки продолжить работу Readable.remuse().
        Это в общем случае, и все зависит от ваших задач при работе с потоками
        //if (chunk > 3) return done(new Error('chunk > 3'));*/

        done();
    }
}
module.exports = Writer;
let array_of_data = ['1', '2', '3', '4', '5'];
let r_opts = {/* значения по умолчанию */};
const R = new Source(array_of_data, r_opts);

let w_opts = {/* значения по умолчанию */};
const W = new Writer(w_opts);
R.pipe(W);

array_of_data = ['1', '2', '3', '4', '5'];
r_opts = {encoding: 'utf8'};
const R1 = new Source(array_of_data, r_opts);

w_opts = {
    decodeStrings: false //данные в _write будут строками в кодировке 'utf8', так как данные из источника - строки ( см r_opts),
};
const W1 = new Writer(w_opts);
R1.pipe(W1);

array_of_data = [1, 2, 3, 4, 5];
r_opts = {objectMode: true};
const R2 = new Source(array_of_data, r_opts);

w_opts = {
    objectMode: true //если false, то при записи данных как объектов (см r_opts), будет ошибка "TypeError: Invalid non-string/buffer chunk"
};
const W2 = new Writer(w_opts);
R2.pipe(W2);

array_of_data = [1, 2, 3, 4, 5];
r_opts = {objectMode: true};
const R3 = new Source(array_of_data, r_opts);

w_opts = {
    objectMode: true //если false, то при записи данных как объектов (см r_opts), будет ошибка "TypeError: Invalid non-string/buffer chunk"
    , highWaterMark: 1 //ограничем буфер; при таком маленьком значении каждый раз будет вызываться событие 'drain'
};
const W3 = new Writer(w_opts);
R3.pipe(W3);

//Вариант без pipe()
const R3_1 = new Source(array_of_data, r_opts);
const W3_1 = new Writer(w_opts);
R3_1.on('data', (chunk)=> {
    //R3_1._readableState.flowing === true
    console.log('R3_1 in flowing mode', R3_1._readableState.flowing, 'R3_1 _readableState.buffer', R3_1._readableState.buffer);
    toWriteOrNotToWriteThatIsTheQuestion(chunk, onDrain);
});
function onDrain() {
    //R3_1._readableState.flowing === false, так как был вызван метод R3_1.pause() см toWriteOrNotToWriteThatIsTheQuestion
    console.log('R3_1 in flowing mode', R3_1._readableState.flowing);
    R3_1.resume();
}
/**
 * если на данный момент не можем больше писать в поток Writable, нужно остановить и получение данных из Readable (R3_1.pause())
 * как только буфер очистится (событие 'drain'), мы продолжаем читать данные из источника Readable (см cb R3_1.resume(); ), и записывать в Writable
 * @param data
 * @param cb
 */
function toWriteOrNotToWriteThatIsTheQuestion(data, cb)
{
    //во "внешнем коде" записывать данные через метод write(...), а не через _write(...)
    if (!W3_1.write(data)) {
        R3_1.pause();
        W3_1.once('drain', cb);
    }  else {
        process.nextTick(cb);
    }
}
