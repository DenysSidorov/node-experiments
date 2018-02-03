'use strict';
const { Readable } = require('stream');
/**
 * чтобы реализовать свой класс Readable потока, необходимо имплементировать метод _read().
 * именно с нижним подчеркиванием перед именем
 * сравните состояние потока (_readableState) во время инициализации, и по окончании чтения данных (on('end', ()=>{}))
 */
class Source extends Readable
{
    constructor(array_of_data = [], opt = {})
    {
        super(opt);
        this._array_of_data = array_of_data;
        console.log('objectMode ',    this._readableState.objectMode);//false по умолчанию, если не задано явно другое
        console.log('highWaterMark ',  this._readableState.highWaterMark);//16384
        console.log('buffer ',       this._readableState.buffer);//[] - пустой массив
        console.log('length ', this._readableState.length);//0 - кол-во буфер объектов
        console.log('flowing ', this._readableState.flowing);//null

        //для краткости примеров, добавим обработчики событий в конструкторе
        this.on('data', (chunk)=>
        {
            //при обработке события 'data' - данные считываются из буфера и удаляются из него
            console.log('\n---');
            console.log('Readable on data ');
            //здесь chunk данные в виде буфера
            console.log(`chunk = ${chunk} chunk isBuffer ${Buffer.isBuffer(chunk)} and chunk.length is ${chunk.length}`);
            //кол-во данных в текущем буфере (кол-во буфер объектов)
            console.log('buffer.length ', this._readableState.buffer.length);
            console.log('данные: ', chunk.toString(), ' buffer of chunk ', this._readableState.buffer, ' buffer of chunk как строка ', this._readableState.buffer.toString());
        })
          .on('error',(err)=>
          {
              console.log('Readable on error ', err);
          })
          .on('end',()=>
          {
              console.log('Readable on end ');
              console.log('objectMode ', this._readableState.objectMode);//false
              console.log('highWaterMark ', this._readableState.highWaterMark);//16384
              console.log('buffer ', this._readableState.buffer);//[] - пустой массив
              console.log('buffer.length ', this._readableState.buffer.length);//0
              console.log('flowing ', this._readableState.flowing);//true !!!так как у нас есть обработчик события 'data'
          })
          .on('close',()=>
          {
              console.log('Readable on close не все реализации генерируют это событие');
          });
    }
    _read()
    {
        let data = this._array_of_data.shift()
        if (!data) {
            //сообщаем, что данные закончились
            this.push(null);
        } else {
            this.push(data);
        }
    }
}

module.exports = Source;
/*значение именно как строки, т.к. по умолчанию потоки работают либо со строками, либо с буфером. иначе будет выброшено сообщение об ошибке по время this.push(data) Readable on error  TypeError: Invalid non-string/buffer chunk */
let array_of_data = ['1', '2', '3', '4', '5'];
let opts = {/* значения свойств по умолчанию */};
const R = new Source(array_of_data, opts);

array_of_data = ['1', '2', '3', '4', '5'];
opts = {
    objectMode: false,
    highWaterMark: 1//1 байт лимит для буферизации данных _readableState.buffer.length будет === 1
};
// const R2 = new Source(array_of_data, opts);
//
// array_of_data = ['1', '2', '3', '4', '5'];
// opts = {
//     objectMode: false
//     , encoding: 'utf8'//если задать кодировку (поддерживаемую NodeJS), то поток будет работать с данными как со строками, а не как с буфером
// };
// const R3 = new Source(array_of_data, opts);//кодировку так же можно задать с помощью метода .setEncoding('utf8')
//
// array_of_data = [1, 2, 3, 4, 5];
// /*при таких "настройках" потока будет ошибка. если objectMode: true то не надо указывать кодировку - ни в параметрах, ни через метод Readable.setEncoding('utf8')*/
// opts = {
//     objectMode: true
//     , encoding: 'utf8'
// };
// const R4 = new Source(array_of_data, opts);
//
// //при objectMode: true можно передать как строки, или как числа (Number)
// array_of_data = [1, 2, 3, 4, 5];
// opts = {
//     objectMode: true
// };
// const R5 = new Source(array_of_data, opts); //highWaterMark  16 - значение по умолчанию для объектов
// /*имитируем задержку при чтении данных (подобное может происходить при Writable.write(someData) === false). пример ниже взят из документации Node.JS.
// выполните код, и увидите как данные прекращаются считываться, они накапливаются в буфере, а потом продолжают считываться*/
// array_of_data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// opts = {
//     objectMode: true
// };
//
// const R6 = new Source(array_of_data, opts);
// R6.on('data', (chunk) => {
//     //приостанавливаем передачу данных на 1 секунду
//     R6.pause();
//     setTimeout(() => {
//         R6.resume();//возобновим работу потока
//     }, 1000);
// });