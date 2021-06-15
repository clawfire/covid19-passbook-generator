import Handlebars from 'handlebars';
import QrScanner from 'qr-scanner';
const dcc = require('@pathcheck/dcc-sdk');

import template from './template.json';

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

        dcc.debug(data).then(obj => {
            console.log(obj);
            let certificate = obj.value[2].get(-260).get(1);
            console.log(certificate);

            if (certificate.v) {
                // COVID-19 Vaccine Certificate
            } else if (certificate.t) {
                // COVID-19 Test Certificate
            } else if (certificate.r) {
                // COVID-19 Recovery Certificate
            }
            console.log("Salut %s %s", certificate.nam.gn, certificate.nam.fn);
        })
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
