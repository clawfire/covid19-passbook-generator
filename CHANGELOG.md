## [Unrealeased]

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
