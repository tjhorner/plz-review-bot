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
  const stale = moment().subtract(2, "days").format("YYYY-MM-DD")
  const query = `created:<${stale} review:none sort:author-date org:makerbot -label:"Do Not Merge" -label:stale is:pr is:open ${config.authors.map(a => `author:${a}`).join(" ")}`
  
  const { search: { prs, issueCount } } = await github(`
    {
      search(
        last: 10,
        type: ISSUE,
        query: "${query.replace(/"/g, '\\"')}"
      ) {
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

        issueCount
      }
    }
  `)

  if(prs.length === 0) return

  const blocks = [
    {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Good morning, web team!* There are some PRs that are getting old and need to be reviewed. If you get a chance today, please take a look! I'm sure the authors will appreciate it."
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
					"text": "PS: If you don't want your PR to show up here, close it or add the label *Do Not Merge* or *stale*."
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