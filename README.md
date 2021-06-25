# COVID-19 passbook Generator

The aim of this project is to let a user scan a EU Digital COVID Certificate with their smartphone, and generate a passbook, without any data stored on a remote server.

## Test it
[![Netlify Status](https://api.netlify.com/api/v1/badges/fabf8679-02a3-4108-b51e-fea63abafff6/deploy-status)](https://app.netlify.com/sites/covid19passbook/deploys)

We are deploying a stable-ish version online [so you can try it out](https://covid19passbook.netlify.app/). Better used on your iPhone but also works on Android and your mac. If you spot any bugs, please reach us here or on social media 😃 . You can also browse the opened issues to see if we already spotted that bug. And if you have any improvement idea, that's also possible to send us your feature requests.

## Background story
Since EU Digital COVID certificates launched in Luxembourg, there's no application to store your certificate digitally. You can go online and download a PDF or use the grayscale version you got by mail.

Using an application to store those sensitives information can also be an obstacle to some people, and we understand why. Even government application can be questioned, like "tous anticovid" in France, which collect a lot of extra data, including Google pieces of software and usage trackers, especially when you can't look at the source code of those applications.

That's why I came off with the idea of simply using something that does not require installing another piece of software and already handles my credit cards securely: Apple Wallet.

Ok, so, how to do that correctly? Since I don't like spying or fear of it from users, everything possible had to occur on the device itself, including especially:

- [x] Reading the QRCode & decoding it
- [x] Extracting information from it
- [x] Put the user data into the passbook template
- [x] Call the server for manifest signature
- [x] Create the passbook archive with the signature

Apple has designed their passbook (the format of the little card you put in your wallet) in a way to be very secure. So they need to be signed to be visible in the Apple Wallet app. ~~At the moment, I didn't find a way of doing this on the user's device without compromising the signing key.~~ However, we need to sign the manifest which contains `SHA-1` of your data, not the data itself. That's why we thought about a small web service, which does all of this in-memory:

- [x] [perform signature of the manifest](https://github.com/clawfire/covid19-passbook-signature)

That's where @biou jumped into the project and helped me to design the lambda required for this and stick with me on several other tasks since.

## Contributors & open-source

[![](https://contrib.rocks/image?repo=clawfire/covid19-passbook-generator)](https://github.com/clawfire/covid19-passbook-generator/graphs/contributors)

This work could never have been done without the support of the open source community.

- [EHN DCC Schema](https://github.com/ehn-dcc-development/ehn-dcc-schema) for the JSON schema of the code content AND the list of manufacturers, tests, prophylaxis, vaccines, ...
- [Path Check DCC JS SDK](https://github.com/Path-Check/dcc-sdk.js) for the content extraction from the QR Code, since the one offered by the EHN DCC Dev team requires the pubkeys of each countries (which are undisclosed by choice)
- [Path Check debug tool](https://github.pathcheck.org/debug.html) to help explore the QR code content
- [Nimiq JS QR Scanner](https://github.com/nimiq/qr-scanner/)
- [JSZIP](https://stuk.github.io/jszip/)
