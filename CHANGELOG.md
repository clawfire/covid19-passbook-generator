## [Unrealeased]

## [2.1.1] - 2021-10-06
### Changed
- Fix the camera instanciation on IOS. 

## [2.1.0] - 2021-10-06
### Added
- Date string management function for passbook fixing #152 and #125
- Add basic error message when user scan an URL instead of a supported QR code
- Implement basic pattern detection in order to try to handle #126 one day. So far it gives instructions in the different languages to the users
- Add basic error message when a code is detected but nothing can be done with it

### Changed
- updating libraries
- Implement Apple's ignore timeZone flag to fix #125
- urn:uvci is now correctly detected if lowercase
- Router behavior changed slightly to handle previous url scheme and not trigger JS error if visitor coming from a link with an older fragment pattern
- Sort out a bit of the JS code to get some clarity (lot of comments and function documentation)

### Deleted
- Some dead code there and here

## [2.0.1] - 2021-09-26
### Added
- Router debug information when submitting an issue on github from the app

## [2.0] - 2021-09-07
### Added
- netlify dev is working
- Main region on the code (A11y)
- visible focus indicator on buttons
- alternate text on the scanner preview
- Rendering for non-lating names on preview
- skip to content link
- Sweden way of getting EUDCC
- Componed first names and last names supported no matter how many you have
- Internationalization ! [Help us translate in your language](https://crowdin.com/project/covid19-passbook/invite)

### Changed
- Using local instance of openSans (bye bye Google fonts)
- Review color a11y
- New theme from Laurence & geoffrey
- Move all the modals code at the end of the index file
- New header
- better routing accessibility
- better button contrasts & text contrats
- text alignments

### Removed
- unnecessary title on links
- inline styles

## [1.7] - 2021-08-06
### Added
- Add CovidShield vaccine to the list of accepted vaccine
- Netlify dev pipleline is working
- Add IT way of getting EUDCC
- Add DK way of getting EUDCC
- Add BG way of getting EUDCC
- Render latin and non-latin name on the preview
- Filter out the URN:UVCI: for countried using it in the Unique Certificate Number
- Version number and build date appears on the bottom of the page now
- Add "old browser" modal for ios < 14 (lack of support for bigInt and no polyfill available)

### Changed
- Card is now displaying latin name on the front and non-latin name if applicable on the back
- Move Unique Certificate Number as an aux. field on the front of the pass
- Certificate type (vaccine, recovery, test) is now in front of the pass
- Sort alphabeticaly the FAQ section with all the countries method to get EUDCC

## [1.6.1] - 2021-07-22
### Removed
- test that breaks the app :D 

## [1.6] - 2021-07-22
### Added
- Financing FAQ
- Offline detection (since you cannot generate offline)
- Support button on the github repo
- Unsupported browser detection (facebook webview and everything but Safari on iOS)
- Portugal information thanks to @webdados

### Changed
- A11Y by @geoffreycrofte
- Fixes non Latin name handling
- Wording edits here and there, thanks to @grischard

## [1.5.1] - 2021-07-15
### Changed
- Check non-latin firstname and not just names
- Fix a small ui big on desktop

## [1.5] - 2021-07-15
### Added
- Editor config for working in harmony all togethers
- Desktop version of the app !
- Semi-automatic feedback when having errors
- Add lating version for names for non-latin alphabet

### Changed
- feedback page use different technical name to evade some false positive detection as ads by ad blockers like Hush
- Base font size is bigger

## [1.4] - 2021-07-04
### Added
- Picture upload feature to select a screenshot of the qrcode

### Changed
- If you're coming to /#feedback you're moved to the start of the workflow now #22
- Assets for the passbook should have the good colors now
- FAQ improvment #24

## [1.3] - 2021-06-29
### Added
- ProductHunt logo at the bottom of the FAQ

### Changed
- All ressources (jQuery, SemanticUI, etc) are now served localy

### Removed
- All call to 3rd party scripts have been removed. No more external library
- Remove Google Fonts from Semantic UI #19

## [1.2.2] - 2021-06-28
### Changed
- Fixes #17 which caused duplicate data in passbook when using the scan again feature
- Move the FAQ to the bottom in a dedicated space, always visible
- Better preview rendering when resizing the window (or changing orientation)

## [1.2] - 2021-06-27
### Added
- There's an FAQ
- support for auxiliary fields in passbook
- Opengraph / Twitter cards
- Meta tags for SEO
- Add history navigation support
- Support for multiple certificate in a same passport #16
- Mask to aim more easily #8
- Add new open-source projects to the list
### Changed
- certificate type is now an auxiliary field for better visibility
- CTA button to start is now in the center of the page #13
### Removed
- Cleanup dependencies

## [1.1.1] - 2021-06-25
### Changed
- Typo fix on the test certificates

## [1.1] - 2021-06-25
### Added
- Test data are now supported #7
- Deploy preview context has been added to help us test the next release (and stop releasing 15 times a night)
- Certificate type is now displayed in the wallet card
### Changed
- Torch butotn diseapears if not supported #9
- Console log are only on development environment (should) or for error reporting details
- README has the backstory now
### Removed
