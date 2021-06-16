# COVID-19 passbook Generator

The aim of this project is to let a user scan a EU Digital COVID Certificate with them smartphone, and generate a passbook, without data to be stored on a remote server. Everything possible had to be done on the device itself, including especially:

- Reading the QRCode & decode it
- Extracting informations from it
- Put the user data into the passbook template
- Create the passbook archive ready to be signed

Due to how Apple degigned their passbook, they need to be signed to be display in the wallet app. At the moment I didn't find a way of doing this on the user's device without compromising the signing key. That's why I though about a small web service who do all of this in-memory:

- get the passbook archive and open it
- perform signature of the content
- place the signature file in the archive
- package the archive as a passbook and return it


## Contributors & open-source
This work could never been done without the support of the opensource community.

- [EHN DCC Schema](https://github.com/ehn-dcc-development/ehn-dcc-schema) for the JSON schema of the code content AND the list of manufacturers, tests, prophylaxis, vaccines, ...
- [Path Check DCC JS SDK](https://github.com/Path-Check/dcc-sdk.js) for the content extraction from the QR Code since the one offered by the EHN DCC Dev team requires the pubkeys of each countries (which are undisclosed by choice)
- [Path Check debug tool](https://github.pathcheck.org/debug.html) to help explore the QR code content
- [Nimiq JS QR Scanner](https://github.com/nimiq/qr-scanner/)
