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

function newPassbookItem(passbook, field, key, label, value, dateStyle) {
    // check if we have the required parameters
    if (passbook === undefined || field === undefined || key === undefined || value === undefined) {
        console.error('Required parameters are missing');
        return null;
    }
    // Test if fields is one allowed
    if (!['primaryFields', 'secondaryFields', 'backFields'].includes(field)) {
        console.error('The supplied field "%s" isn\'t not allowed', field);
        return null;
    }

    let newObject = {
        "key": key,
        "label": label,
        "value": value
    };
    if (dateStyle) {
        newObject.dateStyle = dateStyle
    };
    passbook.generic[field].push(newObject);
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
fetch('/.netlify/functions/test-results-manufacturers').then(response => {
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
        const flashlight_btn = document.getElementsByClassName('button')[1];
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
                if (process.env.NODE_ENV === 'development') {
                    console.group("\u{1F4A1} Testing flash support")
                }
                if (hasFlash) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log("This device support it");
                    }
                    flashlight_btn.classList.remove('disabled')
                    flashlight_btn.addEventListener('click', () => {
                        scanner.toggleFlash();
                    })
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.log("This device don't support it");
                    }
                    flashlight_btn.remove();
                }
                if (process.env.NODE_ENV === 'development') {
                    console.groupEnd()
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
            // Use the UCI for passboook serial number
            let certificateContent;
            if (certificate.v) {
                certificateContent = certificate.v[0];
            } else if (certificate.r) {
                certificateContent = certificate.r[0];
            } else if (certificate.t) {
                certificateContent = certificate.t[0];
            } else {
                console.error("Cannot read your unique certificate identifier. Aborting");
                exit();
            }
            if (process.env.NODE_ENV === 'development') {
                console.log('Data read from QRcode %o', certificate);
            }
            template.serialNumber = certificateContent.ci;
            // Surname(s) and Forename(s)
            newPassbookItem(template, "primaryFields", "surnames", "Surnames & Forenames", certificate.nam.gn + " " + certificate.nam.fn.toUpperCase());
            // Date of birth
            newPassbookItem(template, "secondaryFields", "dob", "Date of Birth", certificate.dob + "T00:00Z", "PKDateStyleShort");
            // Unique Certificate Identifier
            newPassbookItem(template, "secondaryFields", "uci", "Unique Certificate Identifier", certificateContent.ci);

            if (certificate.v) {
                // COVID-19 Vaccine Certificate
                // ----------------------------
                // Dissease or Agent
                newPassbookItem(template, "backFields", "disease-or-agent", "Disease or agent targeted", targetAgent.valueSetValues[certificateContent.tg].display);
                // Vaccine / Prophylaxis
                newPassbookItem(template, "backFields", "vaccine-or-prophylaxis", "Vaccine / Prophylaxis", vaccineProphylaxis.valueSetValues[certificateContent.vp].display);
                // Vaccine medicinal product
                newPassbookItem(template, "backFields", "vaccine-medial-product", "Vaccine medicinal product", vaccineProduct.valueSetValues[certificateContent.mp].display);
                // Vaccine marketing authorisation holder or manufacturer
                newPassbookItem(template, "backFields", "vaccine-marketing-auth-holder", "Vaccine Marketing Authorisation holder or manufacturer", vaccineManf.valueSetValues[certificateContent.ma].display);
                // Numnber in a series of vaccination / doses and the overall
                newPassbookItem(template, "backFields", "doses", "Number in a series of vaccination / doses and the overall", certificateContent.dn + "/" + certificateContent.sd);
                // Date of vaccination
                newPassbookItem(template, "backFields", "vaccination-date", "Date of vaccination", certificateContent.dt + "T00:00Z", "PKDateStyleShort");
            } else if (certificate.t) {
                // COVID-19 Test Certificate
                // -------------------------
                // Dissease or Agent
                newPassbookItem(template, "backFields", "disease-or-agent", "Disease or agent tested for", targetAgent.valueSetValues[certificateContent.tg].display);
                // Type of test
                newPassbookItem(template, "backFields", "type-of-test", "Type of test", testType.valueSetValues[certificateContent.tt].display);
                // Name of test
                // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
                if (certificateContent.nm) {
                    newPassbookItem(template, "backFields", "name-of-test", "Name of test", testType.certificateContent.nm);
                }
                // Test Manufacturer
                // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
                if (certificateContent.ma) {
                    newPassbookItem(template, "backFields", "manufacturer-of-test", "Manufacturer of test", testType.certificateContent.ma);
                }
                // Sample collection time
                newPassbookItem(template, "backFields", "collection-time", "Sample Collection Time", testType.certificateContent.sc, "PKDateStyleShort");
                // test result date time
                // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
                if (certificateContent.dr) {
                    newPassbookItem(template, "backFields", "test-result-Time", "Test Result date time", testType.certificateContent.dr, "PKDateStyleShort");
                }
                // test result
                newPassbookItem(template, "backFields", "test-result", "Test Result", testResult.valueSetValues[certificateContent.tr].display);
                // test center
                newPassbookItem(template, "backFields", "test-center", "Test Center", certificateContent.tc);

            } else if (certificate.r) {
                // COVID-19 Recovery Certificate
                // -----------------------------
                // Dissease or Agent
                newPassbookItem(template, "backFields", "disease-or-agent", "Disease or agent the citizen has recovered from", targetAgent.valueSetValues[certificateContent.tg].display);
                // Date of first positive test result
                newPassbookItem(template, "backFields", "date-of-first-positive-test-result", "Date of first positive test result", certificateContent.fr + "T00:00Z", "PKDateStyleShort");
                // Certificate valid from
                newPassbookItem(template, "backFields", "valid-from", "Certificate valid from", certificateContent.df + "T00:00Z", "PKDateStyleShort");
                // Certificate valid until
                newPassbookItem(template, "backFields", "valid-until", "Certificate valid until", certificateContent.du + "T00:00Z", "PKDateStyleShort");
                template.expirationDate = certificateContent.du + "T00:00:00Z";
            } else {
                window.alert('Your scanned QRCode isn\'t a valid EU COVID certificate');
                exit();
            }
            // Member State
            newPassbookItem(template, "backFields", "state-member", "Member State", iso.whereAlpha2(certificateContent.co).country.toUpperCase());
            // Certificate Issuer
            newPassbookItem(template, "backFields", "certificate-issuer", "Certificate issuer", certificateContent.is);

            if (process.env.NODE_ENV === 'development') {
                console.log('passbook template filled %o', template);
            }

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
