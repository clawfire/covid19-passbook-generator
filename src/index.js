import Handlebars from 'handlebars';
import QrScanner from 'qr-scanner';
import {
    saveAs
} from 'file-saver';
const dcc = require('@pathcheck/dcc-sdk');
const iso = require('iso-3166-1');
const JSZIP = require("jszip");


function shaOne(str) {
    const buffer = new TextEncoder("utf-8").encode(str);
    return crypto.subtle.digest("SHA-1", buffer);
}

function hex(buffer) {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Let's import all the references needed
const targetAgent = require('/valuesets/disease-agent-targeted.json');
const vaccineProphylaxis = require('/valuesets/vaccine-prophylaxis.json');
const vaccineProduct = require('/valuesets/vaccine-medicinal-product.json');
const vaccineManf = require('/valuesets/vaccine-mah-manf.json');
const testType = require('/valuesets/test-type.json');
const testResult = require('/valuesets/test-result.json');

import iconUrl from "/graphics/icon.png";
import icon2xUrl from "/graphics/icon@2x.png";
import thumbnailUrl from "/graphics/thumbnail.png";
import thumbnailx2Url from "/graphics/thumbnail@2x.png";

let scanner;

// Tests results manufacturers are available online,
// but we need an offline fallback
fetch('/api/test-results-manufacturers').then(response => {
    response.json().then(json => {
        const testManf = json;
    }).catch(() => {
        const testManf = require('/valuesets/hsc-common-recognition-rat.json');
    })
}).catch(() => {
    const testManf = require('/valuesets/hsc-common-recognition-rat.json');
});

const sampleOrigin = {
    "258500001": "Nasopharyngeal swab",
    "461911000124106": "Oropharyngeal swab",
    "472881004": "Pharyngeal swab",
    "472901003": "Swab from nasal sinus",
    "119342007": "Saliva specimen",
    "119297000": "Blood specimen",
    "119361006": "Plasma specimen",
    "119364003": "Serum specimen",
    "122592007": "Acellular blood (serum or plasma) specimen"
};

let template = require('./template.json');

window.addEventListener('load', function() {
    console.log('init')

    // Message closing function
    // Will be used for all the messages
    $('.message .close').on('click', function() {
        $(this).closest('.message').transition('fade');
    });

    $('button[name="startScanning"]').on('click', () => {
        $('#intro').transition('fade');
        $("#video").transition('fade');
        initScanner();
    })


    function initScanner() {
        QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
        //QrScanner.hasCamera().then(function() {
        const flashlight_btn = document.getElementsByClassName('button')[0];
        // we select the video element, which will provide the user feedback
        const video = document.getElementById('scanner');

        QrScanner.hasCamera().then(hasCamera => {
            if (!hasCamera) {
                window.alert("You need a camera to use this tool");
            }
        })
        // we create a new scanner
        scanner = new QrScanner(video, result => decode(result));

        // we start scanning
        scanner.start().then(() => {
            scanner.hasFlash().then(hasFlash => {
                if (hasFlash) {
                    flashlight_btn.classList.remove('disabled')
                    flashlight_btn.addEventListener('click', () => {
                        scanner.toggleFlash();
                    })
                }
            });
        })
    }

    function decode(data) {
        // destroy the scanner, we gonna need memory
        scanner.destroy();
        // Add it as a QRcode in the template
        template.barcode.message = data;

        dcc.debug(data).then(obj => {
            let certificate = obj.value[2].get(-260).get(1);
            template.serialNumber = certificate.v[0].ci;
            template.generic.primaryFields[0].value = certificate.nam.gn + " " + certificate.nam.fn.toUpperCase();
            template.generic.secondaryFields[0].value = certificate.dob + "T00:00Z";
            if (certificate.v) {
                // COVID-19 Vaccine Certificate
                template.generic.secondaryFields[1].value = certificate.v[0].ci;
                template.generic.backFields[0].value = targetAgent.valueSetValues[certificate.v[0].tg].display;
                template.generic.backFields[1].value = vaccineProphylaxis.valueSetValues[certificate.v[0].vp].display;
                template.generic.backFields[2].value = vaccineProduct.valueSetValues[certificate.v[0].mp].display;
                template.generic.backFields[3].value = vaccineManf.valueSetValues[certificate.v[0].ma].display;
                template.generic.backFields[4].value = certificate.v[0].dn + "/" + certificate.v[0].sd;
                template.generic.backFields[5].value = certificate.v[0].dt + "T00:00Z";
                template.generic.backFields[6].value = iso.whereAlpha2(certificate.v[0].co).country.toUpperCase();
                template.generic.backFields[7].value = certificate.v[0].is;
            } else if (certificate.t) {
                // COVID-19 Test Certificate
            } else if (certificate.r) {
                // COVID-19 Recovery Certificate
            } else {
                window.alert('Your scanned QRCode isn\'t a valid EU COVID certificate');
                exit();
            }
            console.log('passbook template filled %o', template);


            // generate manifest file.template file
            let manifest = {
                "icon.png": "6af7196ef20b26ed4d84a233ab1bc23c8bca15a7",
                "icon@2x.png": "0bf60c38223505d69caba04cdec23431972c761f",
                "thumbnail.png": "5d509a5f70fc415ec952a02a08c3e22c584b77f6",
                "thumbnail@2x.png": "1d8c15c638a8cc19c09372faea60d40e10873f6d"
            };
            const passJson = JSON.stringify(template);
            // Get the SHA1 of the pass JSON
            shaOne(passJson).then((sha) => {
                manifest['pass.json'] = hex(sha);
                // Create the ZIP instance
                let passbook = new JSZIP();
                // Add files into it
                passbook.file("pass.json", passJson);
                passbook.file("manifest.json", JSON.stringify(manifest));

                // Add the static ressources
                let icon = fetch(iconUrl).then((response) => {
                    passbook.file("icon.png", response.blob());
                });
                let icon2x = fetch(icon2xUrl).then((response) => {
                    passbook.file("icon@2x.png", response.blob());
                });
                let thumbnail = fetch(thumbnailUrl).then((response) => {
                    passbook.file("thumbnail.png", response.blob());
                });
                let thumbnailx2 = fetch(thumbnailx2Url).then((response) => {
                    passbook.file("thumbnail@2x.png", response.blob());
                });

                // Call for signature file
                let signature = fetch(process.env.API_SIGNATURE_URL, {
                    method: "POST",
                    body: JSON.stringify(manifest)
                }).then((response) => {
                    if (response.status == 200 && response.body != null && response.body != "") {
                        // Add the signature to the file
                        passbook.file('signature', response.text(), {
                            base64: true,
                            binary: true
                        });
                    } else {
                        window.alert("Error while signing your passbook. Please try again later");
                    }
                }).catch((error) => {
                    console.error("Error while calling λ", error);
                    window.alert("Error while signing your passbook. Please refresh & try again");
                })

                Promise.all([icon, icon2x, thumbnail, thumbnailx2, signature]).then(() => {
                    passbook.generateAsync({
                        type: "blob",
                        mimeType: "application/vnd.apple.pkpass"
                    }).then(blob => {
                        saveAs(blob, "certificate.pkpass");
                    })
                })
            });
        })
    }
}, false)
