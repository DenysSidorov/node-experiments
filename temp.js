var http = require('http');

var count = 0;
var server = http.createServer(function(req, resp){
    console.log(req.method, req.url);
    resp.end('Hello world'+ ++count);
})

server.listen(1337, ()=>{
    console.log('Conneted');
})