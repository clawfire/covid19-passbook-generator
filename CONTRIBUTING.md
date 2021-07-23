# How to contribute to this project?
You want to contribute to this project and that's awesome! Below, you'll find some rules for contributing code to the repository, but remember it's not just about code. Some of you already helped opening a [feature request](https://github.com/clawfire/covid19-passbook-generator/issues/new?assignees=&labels=enhancement%2Ctriage&template=feature_request.yml&title=%5Bfeature+request%5D) or came to chat about the design, or just share this project on their network, making more people know about it 🥰. 

## How do we work all together?

- The `main` branch is for CI/CD. It's what's in production. So we never work here except for hotfixes.
- The `develop` branch is where everything happen mostly
- If you're doing a big project, please 
  - Create first a project in github repo
  - use a `feature` branch
- When you're submiting a PR, pay attention you have to submit on `clawfire:develop` not on `clawfire:main`

## Ground rules

1. Be sure to use our `.editorconfig` file with your IDE
2. Read the `CODE_OF_CONDUCT.md`
3. Read the `LICENSE.md`

## Release cycle

There's no definied release cycle. From time to time I'll make a new release on `main` from what's on develop after testing it locally.

## Branching model

I'm using git-flow but it's too overkill for a team of one + contribs so ... maybe I'll just stick with working on `develop` and do a merge onto `main` + tag later. We'll see. If you have an opinion, feel free to come and chat.
