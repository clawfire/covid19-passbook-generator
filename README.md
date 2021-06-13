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