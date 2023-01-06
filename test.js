
const { sendData } = require("./index.js");
const data = require("../drakor/serialData-page-40.json");
//console.log(sendData(data))
console.log(data.length)

//sendData(require('../drakor/serialData-page-9.json'))

 

// Output:
// Mulai memproses item: 1
// Selesai memproses item: 1
// Mulai memproses item: 2
// Selesai memproses item: 2
// Mulai memproses item: 3
// Selesai memproses item: 3
// Mulai memproses item: 4
// Selesai memproses item: 4
// Mulai memproses item: 5
// Selesai memproses item: 5
// Semua item telah diproses

