import Handlebars from 'handlebars';
import QrScanner from 'qr-scanner';

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

    function decode(result) {
        scanner.destroy();
        template.barcode.message = result;
        console.log(template);
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
