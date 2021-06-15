import Handlebars from 'handlebars';
import QrScanner from 'qr-scanner';
const b45 = require('base45-js');
const zlib = require('pako');
import cbor from 'cbor-js';

import template from './template.json';


// function decodeToUtf8String(utf8StringArg) {
//
//     let data = b45.decode(utf8StringArg);
//
//     var str = "";
//     var count = data.length;
//     for (let i = 0; i < count; ++i)
//         str += String.fromCharCode(data[i]);
//
//     return str;
// }

window.addEventListener('load', function() {

    QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
    //QrScanner.hasCamera().then(function() {
    const flashlight_btn = document.getElementsByClassName('button')[0];
    // on localise l'element video qui va servir à donner le feedback client
    const video = document.getElementById('scanner');

    QrScanner.hasCamera().then(hasCamera => {
        if (!hasCamera) {
            window.alert("You need a camera to use this tool");
        }
    })
    // on créé un element de scanner
    const scanner = new QrScanner(video, result => decode(result));

    function decode(data) {
        // destroy the scanner, we gonna need memory
        scanner.destroy();
        // What we read
        console.log("Data from the qr code %o", data);
        // Add it as a QRcode in the template
        template.barcode.message = data;
        // Strip off the HC1 header if present
        if (data.startsWith("HC1")) {
            data = data.substring(3)
            if (data.startsWith(':')) {
                data = data.substring(1);
            } else {
                console.warn("Warning: unsafe HC1: header");
            }
        } else {
            console.warn("Warning: no HC1: header");
        }
        // Now decoding
        data = b45.decode(data);
        // Zlib magic headers:
        // 78 01 - No Compression/low
        // 78 9C - Default Compression
        // 78 DA - Best Compression
        //
        if (data[0] == 0x78) {
            console.info("Deflating ...")
            data = zlib.inflate(data)
        }
        console.log("Decoded Uint8Array data %o", data);
        data = String.fromCharCode.apply(null, data);
        console.log("Decoded string data %o", data);
        console.log(cbor.encode({
            Hello: "World"
        }));
        data = cbor.decode(data);
    }

    // on démarre le scan
    scanner.start().then(() => {
        scanner.hasFlash().then(hasFlash => {
            if (hasFlash) {
                flashlight_btn.classList.remove('disabled')
                flashlight_btn.addEventListener('clic', () => {
                    scanner.toggleFlash();
                })
            }
        });
    })

    // }).catch(function() {
    // })
}, false)
