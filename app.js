const moment = require('moment')
const config = require('config')
const prToSlackBlocks = require('./helpers/prToSlackBlocks')
const axios = require('axios').default

const github = require('@octokit/graphql').graphql.defaults({
  headers: {
    authorization: `token ${config.githubAccessToken}`
  }
})

async function main() {
  const stale = moment().subtract(parseInt(config.stale.split(" ")[0]), config.stale.split(" ")[1]).format("YYYY-MM-DD")
  const query = `${config.searchQuery} created:<${stale} ${config.authors.map(a => `author:${a}`).join(" ")}`
  
  const { search: { prs, issueCount } } = await github(`
    {
      search(
        last: 10,
        type: ISSUE,
        query: "${query.replace(/"/g, '\\"')}"
      ) {
        issueCount
        prs: nodes {
          ...on PullRequest {
            url
            number
            title
            createdAt
            additions, deletions, changedFiles
            author { login }
            baseRef { name }
            headRef { name }
            repository { nameWithOwner }
          }
        }
      }
    }
  `)

  if(prs.length === 0) return

  const blocks = [
    {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": config.message
			}
    },
    {
			"type": "divider"
		},
    ...prs.slice(0, 3).map(prToSlackBlocks),
    {
			"type": "divider"
		},
    {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `<https://github.com/search?q=${encodeURIComponent(query)}&o=asc&s=created|See all old PRs (${issueCount}) →>`
			}
		},
    {
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": config.context
				}
			]
		}
  ]

  axios.post(config.slackWebhook, {
    text: "There are PRs that need reviewing.",
    blocks
  })
}

main()