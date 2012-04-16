#!/usr/bin/env node
var JSON2 = require('./');
var jsondata = '{"sample": "data", "is": "great", "data": [1, 2, 3, 4]}';
var obj = JSON.parse(jsondata);
jsondata2 = JSON2.stringify(obj);
jsondata2p = JSON2.stringify(obj, null, '  ');
console.log("object: ", obj);
console.log("JSON: ", jsondata2);
console.log("JSON(pretty): ", jsondata2p);



var data = {x: "hello world", y: [1, 2, 3, 4]};
data.self = data;
var str = JSON2.stringify(JSON2.decycle(data));
console.log("Decycled: ", str);

var str = JSON2.stringify(JSON2.decycle(data), null, '  ');
console.log("Decycled(pretty): ", str);

