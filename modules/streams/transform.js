'use strict';
const Readable = require('./readable.js');
const Writable = require('./writable.js');
const {Transform} = require('stream');
/*для примера того, что можем передавать не только строки, буфер, простые JS объекты,
но и экземпляры классов*/
class Chunk
{
    constructor(chunk)
    {
        this.set(chunk);
    }
    set(chunk)
    {
        this._chunk = chunk;
    }
    get()
    {
        return this._chunk;
    }
    inPow(pow = 2)
    {
        return Math.pow(this.get(), pow);
    }
}
class Transformer extends Transform
{
    constructor(opt = {})
    {
        super(opt);
        console.log('\n -------- Transform in constructor');
        console.log('objectMode ', this._writableState.objectMode); //false по умолчанию, если не задано явно true
        console.log('highWaterMark ', this._writableState.highWaterMark); //16384
        console.log('decodeStrings ', this._writableState.decodeStrings); //true по умолчанию; преобразовывать ли в Buffer данные, до их передачи в метод _write()
        console.log('buffer ', this._writableState.getBuffer()); //[] - пустой массив

        this.on('close', ()=>
        {
            console.log('\n------ Transform on close');
        })
          .on('drain', ()=>
          {
              console.log('\n------ Transform on drain');
          })
          .on('error', (err)=>
          {
              console.log('\n------ Transform on error', err);
          })
          .on('finish', ()=>
          {
              console.log('\n------ Transform on finish');
          })
          .on('end', ()=>
          {
              console.log('\n------ Transform on end');
          })
          .on('pipe', ()=>
          {
              console.log('\n------ Transform on pipe');
          });
    }
    /**
     * метод, реализующий в себе запись данных (chunk поступают в поток Transform),
     * и чтение данных - когда другой поток читает из Transform
     * @param chunk
     * @param encoding
     * @param done - в общем случае done(err, chunk)
     * @private
     */
    _transform(chunk, encoding, done)
    {
        /*завершить обработку текущих данных chunk, и передать дальше на чтение можно двумя вариантами
        done(null, chunk);
        done(err, chunk); - в этом случае будет вызвано событие error
        или так, что то же самое:
        this.push(chunk);
        done();

        this.push(chunk);
        done(err);*/
        //преобразовали выходные данные в экземпляр класса Chunk (см. пример writable.js)
        this.push(new Chunk(chunk));
        done();
    }
    /**
     * Кастомные transform потоки могут реализовать метод _flush.
     Он будет вызван, когда нет больше данных на запись, но перед событием 'end' потока Readable (имеется ввиду Transform, так как это поток и на запись, и на чтение данных).
     * @param done - done(err) можно передать объект ошибки Error
     * @private
     */
    _flush(done)
    {
        //TODO ... что-нибудь сделали дополнительно перед завершением работы потока

        done();
    }
}
let array_of_data = ['1', '2', '3', '4', '5'];
let r_opts = {
    encoding: 'utf8'
};
const R = new Readable(array_of_data, r_opts);

let t_opts = {
    readableObjectMode: true //читать из потока Transform будут объекты
    , writableObjectMode: false //записывать в поток Transform можно либо строки или буфер
    , decodeStrings: false
};
const T = new Transformer(t_opts);

let w_opts = {
    objectMode: true //если false, будет выброшена ошибка
};
const W = new Writable(w_opts);
R.pipe(T).pipe(W);