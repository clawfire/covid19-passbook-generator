/**
 * 1. Imports
 */
const jquery = require('./vendor/jquery.min.js');
window.$ = window.jQuery = jquery;
require('./vendor/semantic.min.js');

import Handlebars from 'handlebars';
import QrScanner from 'qr-scanner';
import debounce from 'lodash.debounce';

import {
  saveAs
} from 'file-saver';

var parser = require('ua-parser-js');

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

/**
 * 2. Variable definition
 */

let successfulGeneration = false;

let navigationHandlerInit = false;
let currentRoute = getCurrentRoute();


let scanner;
let qrcode;


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

// Some national services endpoint.
// See https://github.com/clawfire/covid19-passbook-generator/issues/126
const nationalServices = [
  {
    url: "https://ekosova.rks-gov.net/SubService/285?code=",
    message: "Σφάλμα. Ο σαρωμένος κωδικός QR δεν αντιστοιχεί σε αυτόν που παρέχει η Ευρωπαϊκή Ένωση. Διαβάστε στο FAS πώς να το κατεβάσετε."
  },{
    url: "https://dilosi.services.gov.gr/show/",
    message: "Извињавам се. Још не подржавамо косовске КР кодове. Надамо се да ћемо то ускоро учинити. Me falni. Ne ende nuk i mbështesim kodet QR të Kosovës. Shpresojmë të jemi në gjendje ta bëjmë këtë shumë shpejt."
  }
]

const sourceTpl = require('./template.json');

let passbookBlob;

/**
 * 3. Function definitions
 */

if (process.env.NODE_ENV !== 'development') {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const stack = (error !== undefined && error.stack !== undefined)?error.stack:''
    const extra = `File: ${url}\nLine: ${lineNo}\nColumn: ${columnNo}\nStack: ${stack}\nCurrentRoute: ${currentRoute}\n`;
    manageError(msg, extra)
    return false;
  }
}

/**
 * Trigger the popup display for the error feedback form (which will post on github as issue)
 * @param {string} msg Error message you want to display and include in the log
 * @param {*} extra information you want to add to the log
 */
function manageError(msg, extra = '') {
  $('#error-modal').modal('show');
  const message = `What happened?\n\n[please describe]\n\n<details><summary>Technical details</summary>Error message: ${msg}\n\nPage: ${window.location.hash}\n\nBrowser:\n\`\`\`json\n${JSON.stringify($.ua)}\n\`\`\`\n\n${extra}</details>`;
  const container = $('#error-msg');
  container.val(container.val() + message);
}

/**
 * Return SHA-1 value from a string.
 * @param {string} String you want to get SHA-1
 * @returns string
 */
function shaOne(str) {
  const buffer = new TextEncoder("utf-8").encode(str);
  return crypto.subtle.digest("SHA-1", buffer);
}

function hex(buffer) {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns you the current route (URL fragment)
 * @returns string
 */
function getCurrentRoute() {
  let route = window.location.hash.split('#').pop();
  route = (route == "") ? "intro" : route;
  return route;
}

/**
 * Handle the navigation and the associated states
 * @param {function} callback function you want to execture as a callback. Will receive oldroute, newroute
 */
function navigationHandler(callback) {
  const routes = ['intro', 'scan', 'preview'];
  const titles = ['Keep your COVID certificate in your iPhone’s wallet.', 'Scan your QR code.', 'Your certificate is ready!'];


  function changeState(oldRoute, newRoute, callback) {
    if ((oldRoute != newRoute) && (routes.includes(newRoute))) {
      console.log('changeState', oldRoute, newRoute);
      // hide all pages
      document.querySelectorAll('section.page').forEach(e => { e.style.visibility = 'hidden'; e.style.display = 'none'})

      // display the page
      document.getElementById(newRoute).style.visibility = 'visible';
      document.getElementById(newRoute).style.display = 'block';
      document.title = titles[routes.indexOf(newRoute)] + ' - Covid19-Passbook';
      document.getElementById('mainTitle').innerText = titles[routes.indexOf(newRoute)];
      callback(oldRoute, newRoute);
      document.getElementById('mainTitle').focus();
      document.querySelector('a.skip-link').setAttribute('href', '#'+newRoute);
      currentRoute = newRoute;
    }
  }

  // if the user refreshes the page...
  if (navigationHandlerInit == false) {
    if (!routes.includes(currentRoute) || currentRoute == 'preview') {
      //console.log('this route does not exist:', currentRoute)
      window.location.hash = 'intro';
      currentRoute = 'intro';
    } else {
      //console.log('route found:', currentRoute);
      changeState('intro', currentRoute, callback);
    }
    navigationHandlerInit = true;
  }

  window.addEventListener("popstate", () => {
    const newRoute = getCurrentRoute();
    changeState(currentRoute, newRoute, callback);
  });
}

/**
 * Change the URL to the route fragment specified
 * @param {string} route the route you want to go to
 */
function navigateTo(route) {
  window.location.hash = route;
}

/**
 * Return date formated as YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS
 * @param {string} string
 * @param {boolean} withseconds
 */
function formatDate(string, withseconds = false) {
  switch (string.length) {
    case 10:
      // Just the date
      return withseconds ? string + "T00:00:00" : string + "T00:00";
      break;
    case 16:
      // Date + time but no seconds
      return withseconds ? string + ":00" : string;
      break;
    case 19:
      // Date + time + seconds
      return withseconds ? string : string.substring(0, 16);
      break;
    default:
      console.error("The provided string \"%s\” isn't compatible with what was espected for the formatDate function",string);
      break;
  }
}

/**
 * Handle the addition in a passbook object of a new "item" or "line"
 * @param {object} passbook the passbook object you want to manipulate
 * @param {string} field can be primadyFields, secondaryFields, auxiliaryFields or backFields
 * @param {string} key the key you want to use for the item you're adding
 * @param {string} label the lavel displayed to the user on the passbook
 * @param {string} value the value you want to use
 * @param {string} dateStyle format: 'PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull'
 */
function newPassbookItem(passbook, field, key, label, value = "", dateStyle) {
  // check if we have the required parameters
  if (passbook === undefined || field === undefined || key === undefined) {
    console.error('Required parameters are missing');
    return null;
  }
  // Test if fields is one allowed
  if (!['primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields'].includes(field)) {
    console.error('The supplied field "%s" is not allowed', field);
    return null;
  }

  let newObject = {
    "key": key,
    "label": label,
    "value": value
  };
  // if there's a dataStyle passed, check it against the possible values
  if (dateStyle) {
    if (['PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull'].includes(dateStyle)){
      newObject.dateStyle = dateStyle
      newObject.ignoresTimeZone = true
    }else{
      console.error('The supplied dateStyle "%s" is not allowed', dateStyle);
    }
  };
  passbook.generic[field].push(newObject);
}

/**
 * renderTpl - render template and push it in DOM
 *
 * @param {String} id ID selector of the Template
 * @param {String} target ID selector where inject code
 * @param {Object} data data to use to populate the template
 */
function renderTpl(id, target, data) {
  let source = document.getElementById(id).innerHTML;
  let template = Handlebars.compile(source);
  let rendered = template(data);
  document.getElementById(target).innerHTML = rendered
}

function adaptPreview() {
  const container = document.getElementById('scannerContainer');
  const video = document.getElementById('scanner');
  const mask = document.getElementById('mask');
  let width = 0;
  let marginLeft = 0;
  const orientation = window.matchMedia("(orientation: portrait)");
  if (orientation !== undefined && orientation.matches) {
    width = $(container).width();
  } else {
    width = $(container).width() / 2;
    marginLeft = '25%';
  }
  $(video).width(width);
  $(mask).width(width);
  $(video).height(width);
  $(mask).height(width);
  $(video).css('margin-left', marginLeft);
  $(mask).css('margin-left', marginLeft);
}

/**
 * 4. Event binding
 */
window.addEventListener('offline', () => {
  $('#modal-offline').modal('show');
})
window.addEventListener('online', () => {
  $('#modal-offline').modal('hide');
})


/**
 * PAGE LOAD EVENT (MAIN)
 */
window.addEventListener('load', function() {

  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed('🕵🏻‍♂️ Inspecting your browser')
    console.log("OS: %s",$.ua.os.name);
    console.log("Browser: %s",$.ua.browser.name);
    console.log("Device type: %s",$.ua.device.type);
  }

  if($.ua.device.type == 'mobile'){
    if (["Facebook","Instagram"].includes($.ua.browser.name)){
      $('#modal-unsupported-browser-facebook').modal("show");
    } else if ($.ua.os.name == "iOS" && $.ua.browser.name != "Mobile Safari"){
      $('#modal-unsupported-browser-safari').modal("show");
    } else if ($.ua.os.name == "iOS" && $.ua.browser.name == "Mobile Safari" && $.ua.browser.version < 14) {
      $('#modal-unsupported-old-browser').modal({ "closable": false}).modal('show');
    } else {
      if (process.env.NODE_ENV === 'development') {console.log("✅ preflight check OK. You can use the app")}
    }
  } else {
    if (process.env.NODE_ENV === 'development') {console.log("✅ preflight check OK. You can use the app")}
  }
  if (process.env.NODE_ENV === 'development') {console.groupEnd()}

  navigationHandler((oldRoute, newRoute) => {
    if (newRoute == 'scan') {
      initScanner();
    }

    if (oldRoute == 'scan') {
      scanner.destroy();
    }

    if (newRoute == 'preview' && successfulGeneration) {
      document.getElementById('feedbackMsg').innerText = 'Your pass has been successfully generated!';
    }

    if (oldRoute == 'preview') {
      successfulGeneration = false;
      document.getElementById('feedbackMsg').innerText = '';
    }

  });

  // Dropdown handling function
  // --------------------------
  // First, which language we are using now
  let currentLanguage = window.location.pathname == "/" ? "en" : window.location.pathname.substring(1);
  // Then activate this language as the currently selected language
  $("#language-selector").find("[value='"+currentLanguage+"']").prop({selected: true});
  // Add some log infos
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed('💬 Language selection');
    console.log('URL PATH : %s', window.location.pathname);
    console.log('Language is %s', currentLanguage);
    console.groupEnd();
  }
  // init the dropdown and bind page change to it
  $('#language-selector').on('change',(event)=>{
    let value= $(event.target).val();
      if(value == "en"){value=""}
      let path = "/"+value
      if(window.location.pathname !== path){
        window.location.href=path
      }
  });
  // Message closing function
  // Will be used for all the messages
  $('.message .close').on('click', function() {
    $(this).closest('.message').transition('fade');
  });

  $('button[name="startScanning"]').on('click', () => {
    navigateTo('scan');
  })

  $('button[name="scanImage"]').on('click', () => {
    $('#qrfile').trigger("click");
  });

  $('#saveInWallet').on('click', () => {
    if (passbookBlob !== undefined) {
      saveAs(passbookBlob, "certificate.pkpass");
    }
  });

  $('#error-close').on('click', () => {
      $('#error-msg').val('');
      $('#error-modal').addClass('hidden');
  });

  $('#error-send').on('click', () => {
      let signature = fetch('/.netlify/functions/create-issue', {
          method: "POST",
          body: $('#error-msg').val()
      }).then((response) => {
          if (response.status == 200) {
              $('#error-msg').val('');
          } else {
              window.alert("Error while sending your feedback. Please refresh & try again");
          }
      }).catch((error) => {
          console.error("Error while calling λ", error);
          window.alert("Error while sending your feedback. Please refresh & try again");
      })
      $('#error-modal').addClass('hidden');
  });

  $(window).on('resize', debounce(function() {
    adaptPreview();
  }, 400));

  $('#scanAnother').on('click', () => {
    navigateTo('scan');
  });

  $('#qrfile').on('change', (e) => {
    const file = e.target.files[0]
    if (!file) {
      return;
    }

    if (['image/jpeg', 'image/png'].includes(file.type)) {
      QrScanner.scanImage(file)
      .then(result => decode(result))
      .catch((error) => {
        console.error("Error while decoding QR code", error);
        window.alert("No QR code found in image");
      });
    } else {
      window.alert('Image type not supported. Try again with a valid JPG, JPEG, or PNG image');
    }
  });

  function initScanner() {
    QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
    //QrScanner.hasCamera().then(function() {
    const flashlight_btn = document.getElementById('flashlight_btn');
    // we select the video element, which will provide the user feedback
    const video = document.getElementById('scanner');
    adaptPreview();

    QrScanner.hasCamera().then(hasCamera => {
      if (!hasCamera) {
        window.alert("You need a camera to use this tool. Please allow access to your camera if you have one.");
      }
    })
    // we create a new scanner
    scanner = new QrScanner(video, result => decode(result));

    // we start scanning
    scanner.start().then(() => {
      QrScanner.listCameras(true).then(camerasList =>{
        if (process.env.NODE_ENV === 'development') {
          console.groupCollapsed("📷 Listing cameras available")
          console.table(camerasList)
          console.groupEnd()
        }
      })
      scanner.setCamera('environment').then(bidule => {
        console.log("✅ Asked the device to use the environment camera")
      })
      scanner.hasFlash().then(hasFlash => {
        if (process.env.NODE_ENV === 'development') {
          console.groupCollapsed("💡 Testing flash support")
        }
        if (hasFlash) {
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ This device supports it");
          }
          flashlight_btn.getElementsByTagName("span")[0].innerHTML = "Toggle Flashlight";
          flashlight_btn.classList.remove('disabled')
          flashlight_btn.addEventListener('click', () => {
            if (process.env.NODE_ENV === 'development') {
              console.log("\u{1F4A1} btn clicked");
            }
            scanner.toggleFlash();
          })
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log("❌ This device doesn't support it");
          }
        }
        if (process.env.NODE_ENV === 'development') {
          console.groupEnd()
        }
      });
    })
  }

  function decode(data) {

    if(data.startsWith("http")){
      console.warn("⚠️ It's not a digitaly signed covid certificate. Let's compare to our known services");
      let wasNationalService = false;
      nationalServices.forEach((value) => {
        if(data.startsWith(value.url)){ window.alert(value.message); wasNationalService=true; return}
      })
      if (!wasNationalService){window.alert("Sorry, you are trying to scan a code which is an internet address but not a supported QR code. Please read the FAQ.")}
      return;
    };

    // destroy the scanner, we gonna need memory
    if (scanner) {
      scanner.destroy();
    }

    const template = JSON.parse(JSON.stringify(sourceTpl));
    const dcc = require('@pathcheck/dcc-sdk');
    const iso = require('iso-3166-1');


    // Add it as a QRcode in the template
    template.barcode.message = data;

    dcc.debug(data).then(obj => {
      let certificate = obj.value[2].get(-260).get(1);
      let certificateContent;
      let certificateType;
      let nbCertificates = 1;
      if (certificate.v) {
        // This is a Vaccination certificate
        certificateType = "Vaccination";
        // Load the first (maybe only) certificate
        certificateContent = certificate.v[0];
      } else if (certificate.r) {
        // This is a Recovery certificate
        certificateType = "Recovery";
        // Load the first (maybe only) certificate
        certificateContent = certificate.r[0];
      } else if (certificate.t) {
        // This is a Test certificate
        certificateType = "Test Result";
        // Load the first (maybe only) certificate
        certificateContent = certificate.t[0];
      } else {
        console.error("Cannot read your unique certificate identifier. Aborting");
        exit();
      }
      if (process.env.NODE_ENV === 'development') {
        console.group('\u{1F6C2} Passport data');
        console.log('Data read from QRcode %o', certificate);
      }
      // Filling Passbook Template from here
      // -----------------------------------
      // Use the UCI for passboook serial number
      if (certificateContent.ci.startsWith('URN:UVCI:') || certificateContent.ci.startsWith('urn:uvci:')){
        template.serialNumber = certificateContent.ci.substring(9)
      }else{
        template.serialNumber = certificateContent.ci
      }
      // Surname(s) and Forename(s)
      const isNonLatin = (certificate.nam.gn.toUpperCase() != certificate.nam.gnt.replaceAll("<", ' ') || certificate.nam.fn.toUpperCase() != certificate.nam.fnt.replaceAll("<", ' '));

      if (process.env.NODE_ENV === 'development') {
        console.group('💬 Handling non-latin alphabets');
        if(isNonLatin){
          console.warn("❌ non-latin char detected, will add international variation");
        }else{
          console.log("✅ Pass is using latin char, no need to change anything");
        }
        console.groupEnd();
      }
      if (isNonLatin){
        newPassbookItem(template,"primaryFields", "intl-surnames", "Surnames & Forenames", certificate.nam.fnt.replaceAll("<", ' ') + " " + certificate.nam.gnt.replaceAll("<", ' '));
        newPassbookItem(template, "backFields", "surnames", "Surnames & Forenames", certificate.nam.fn.toUpperCase() + " " + certificate.nam.gn);
      }else{
        newPassbookItem(template, "primaryFields", "surnames", "Surnames & Forenames", certificate.nam.fn.toUpperCase() + " " + certificate.nam.gn);
      }
      // Type of certificate
      newPassbookItem(template, "secondaryFields", "certificate-type", "Certificate Type", certificateType);
      // Date of birth
      newPassbookItem(template, "secondaryFields", "dob", "Date of Birth", formatDate(certificate.dob), "PKDateStyleShort");
      // Unique Certificate Identifier
      newPassbookItem(template, "auxiliaryFields", "uci", "Unique Certificate Identifier", template.serialNumber);

      if (certificate.v) {
        // COVID-19 Vaccine Certificate
        // ----------------------------
        certificate.v.forEach((certificateContent, i) => {
          if (certificate.v.length > 1) {
            let n = i + 1;
            newPassbookItem(template, "backFields", "header" + n, "--- Vaccine #" + n + " ---");
          }
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
          newPassbookItem(template, "backFields", "vaccination-date", "Date of vaccination", formatDate(certificateContent.dt), "PKDateStyleShort");
        });

      } else if (certificate.t) {
        // COVID-19 Test Certificate
        // -------------------------
        certificate.t.forEach((certificateContent, i) => {
          if (certificate.t.length > 1) {
            let n = i + 1;
            newPassbookItem(template, "backFields", "header" + n, "--- Test #" + n + " ---");
          }
          // Dissease or Agent
          newPassbookItem(template, "backFields", "disease-or-agent", "Disease or agent tested for", targetAgent.valueSetValues[certificateContent.tg].display);
          // Type of test
          newPassbookItem(template, "backFields", "type-of-test", "Type of test", testType.valueSetValues[certificateContent.tt].display);
          // Name of test
          // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
          if (certificateContent.nm) {
            newPassbookItem(template, "backFields", "name-of-test", "Name of test", certificateContent.nm);
          }
          // Test Manufacturer
          // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
          if (certificateContent.ma) {
            newPassbookItem(template, "backFields", "manufacturer-of-test", "Manufacturer of test", certificateContent.ma);
          }
          // Sample collection time
          newPassbookItem(template, "backFields", "collection-time", "Sample Collection Time", certificateContent.sc, "PKDateStyleShort");
          // test result date time
          // Since at least LU don't generate it in their code, it's safe to assume other countries wouldn't
          if (certificateContent.dr) {
            newPassbookItem(template, "backFields", "test-result-Time", "Test Result date time", certificateContent.dr, "PKDateStyleShort");
          }
          // test result
          newPassbookItem(template, "backFields", "test-result", "Test Result", testResult.valueSetValues[certificateContent.tr].display);
          // test center
          newPassbookItem(template, "backFields", "test-center", "Test Center", certificateContent.tc);
        });

      } else if (certificate.r) {
        // COVID-19 Recovery Certificate
        // -----------------------------
        certificate.r.forEach((certificateContent, i) => {
          if (certificate.r.length > 1) {
            let n = i + 1;
            newPassbookItem(template, "backFields", "header" + n, "--- Recovery #" + n + " ---");
          }
          // Dissease or Agent
          newPassbookItem(template, "backFields", "disease-or-agent", "Disease or agent the citizen has recovered from", targetAgent.valueSetValues[certificateContent.tg].display);
          // Date of first positive test result
          newPassbookItem(template, "backFields", "date-of-first-positive-test-result", "Date of first positive test result", formatDate(certificateContent.fr), "PKDateStyleShort");
          // Certificate valid from
          newPassbookItem(template, "auxiliaryFields", "valid-from", "Valid from", formatDate(certificateContent.df), "PKDateStyleShort");
          // Certificate valid until
          newPassbookItem(template, "auxiliaryFields", "valid-until", "Valid until", formatDate(certificateContent.du), "PKDateStyleShort");
          template.expirationDate = formatDate(certificateContent.du, true) + "Z";
        });

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
        console.groupEnd();
      }

      // generate manifest file.template file
      let manifest = {
        "icon.png": "b372117f003fbc0673e9befd9b8f2812a07e1f17",
        "icon@2x.png": "e77d741df2738a6be8e3324e85833f67f2210c2a",
        "thumbnail.png": "3f88d2819090a31881244e1d8fbcc00f1c192149",
        "thumbnail@2x.png": "f1fc4ceb0852fd7e18c2e94b02ceac17f975744e"
      };
      const passJson = JSON.stringify(template);
      // Get the SHA1 of the pass JSON
      shaOne(passJson).then((sha) => {
        manifest['pass.json'] = hex(sha);
        // Create the ZIP instance
        const JSZIP = require("jszip");
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
            passbookBlob = blob;
            $('#saveInWallet').removeClass('disabled');

            var canvas = document.getElementById('qrcode');
            if (process.env.NODE_ENV === 'development') {
              console.group("\u{1F5BC} QrCode Generation");
              console.log("message to encode : %s", template.barcode.message);
              console.log("will be generated here %o", canvas);
            }
            canvas.innerHTML = "";
            qrcode = new window.QRCode(canvas, {
              text: template.barcode.message,
              width: 375,
              height: 375,
              level: window.QRCode.CorrectLevel.M
            });
            if (process.env.NODE_ENV === 'development') {
              console.groupEnd();
              console.group('\u{1F4C7} Pass preview');
              console.table({
                "name": certificate.nam.gn + " " + certificate.nam.fn.toUpperCase(),
                "name intl": certificate.nam.fnt.replaceAll("<", ' ') + " " + certificate.nam.gnt.replaceAll("<", ' '),
                "dob": certificate.dob,
                "uci": certificateContent.ci,
                "type": certificateType,
                "validuntil": certificate.r ? certificate.r[0].du : null
              })
            }
            renderTpl("card-content-tpl", "cardContent", {
              "name": certificate.nam.fn + " " + certificate.nam.gn.toUpperCase(),
              "name-intl": certificate.nam.fnt.replaceAll("<", ' ') + " " + certificate.nam.gnt.replaceAll("<", ' '),
              "dob": certificate.dob,
              "uci": certificateContent.ci.startsWith('URN:UVCI:') || certificateContent.ci.startsWith('urn:uvci:') ? certificateContent.ci.substring(9) : certificateContent.ci
            });
            renderTpl("card-extra-content-tpl", "cardExtraContent", {
              "type": certificateType,
              "validuntil": certificate.r ? certificate.r[0].du : null
            })
            successfulGeneration = true;
            navigateTo('preview');
          })
        })
      });
    })
  }
}, false)

