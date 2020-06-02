/* eslint-env jest */
const https = require('https');
const yaml = require('js-yaml');

const {BUILDKITE_TOKEN: token} = process.env;

async function callBuildkiteApi(url) {
  return new Promise(resolve => {
    https.get(
      url,
      {
        headers: {
          Authorization: ` Bearer ${token}`,
        },
      },
      res => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', data => {
          body += data;
        });
        res.on('end', () => {
          body = JSON.parse(body);
          resolve(body);
        });
      },
    );
  });
}

test('Buildkite Pipeline Settings', async () => {
  const pipelinesUrl =
    'https://api.buildkite.com/v2/organizations/uberopensource/pipelines?per_page=500';
  const pipelines = await callBuildkiteApi(pipelinesUrl);
  console.log(`Found ${pipelines.length} pipelines`);
  expect(pipelines.length).toBeGreaterThan(0);
  for (let i = 0; i < pipelines.length; i++) {
    const pipeline = pipelines[i];
    console.log(`${pipeline.name}`);
    expect(pipeline.provider.id).toEqual('github');
    expect(pipeline.provider.settings.publish_blocked_as_pending).toEqual(true);

    const {steps} = yaml.safeLoad(pipeline.configuration);
    expect(steps[0].block).toEqual('Code Reviewed');

    const gating = /!\(build\.author\.teams\sincludes\s".*?"\)\s&&\n\s+build\.pull_request\.id\s!=\snull/;
    expect(steps[0].if).toMatch(gating);
  }
}, 60000);
