const { Octokit } = require("octokit");

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
// Only the public_repo scope is needed when creating the token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

exports.handler = async function(event, context) {
    await octokit.rest.issues.create({
        owner: "clawfire",
        repo: "covid19-passbook-generator",
        title: "Semi-automated report from the app",
        body: event.body,
        labels: ['user-feedback', 'bug']
      });
}

