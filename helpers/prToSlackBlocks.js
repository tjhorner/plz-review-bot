const moment = require('moment')

module.exports = pr => (
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `:octocat: *<${pr.url}|${pr.repository.nameWithOwner}#${pr.number}>* (\`${pr.baseRef.name}\` ← \`${pr.headRef.name}\`)\n${pr.title}`
    },
    "fields": [
      {
        "type": "mrkdwn",
        "text": `*PR Opened*\n${moment(pr.createdAt).fromNow()}`
      },
      {
        "type": "mrkdwn",
        "text": `*Changes*\n${pr.changedFiles} files (+${pr.additions} / -${pr.deletions})`
      },
      {
        "type": "mrkdwn",
        "text": `*Author*\n${pr.author.login}`
      }
    ]
  }
)