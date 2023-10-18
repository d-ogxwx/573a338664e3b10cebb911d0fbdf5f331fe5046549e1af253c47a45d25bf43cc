const regex = /^Merge\spull\srequest\s(#\d+)\sfrom\s[\w-\/]+\n\n/ 

module.exports = async ({ github, context, core }) => {
  const { HEAD, BASE } = process.env;

  // https://octokit.github.io/rest.js/v20#pulls-list
  const releasePR = await github.rest.pulls
    .list({
      owner: context.repo.owner,
      repo: context.repo.repo,
    })
    .then(
      (response) =>
        new Promise((resolve, reject) => {
          const releasePR = response.data.find(
            (v) =>
              v.head.ref === HEAD && v.base.ref === BASE && v.state === 'open'
          );
          if (releasePR) {
            resolve(releasePR);
          } else {
            reject('Not found 0f5d0c54d6a876872d6522cd4a526ee62512c7ea0bf9860a7e5ac5859396b36e PR');
          }
        })
    );

  // リリースに含まれる PR 番号一覧を取得
  // https://octokit.github.io/rest.js/v20#pulls-list-commits
  const body = await github.rest.pulls
    .listCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: releasePR.number,
    })
    .then((response) =>
      response.data.reduce((acc, x) => {
        const r = regex.exec(x.commit.message);
        return r ? acc.concat([r[1]]) : acc;
      }, [])
    );

    await github.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: releasePR.number,
      body: ['## PRs'].concat(body.map((number) => `- ${number}`)).join('\n'),
      state: 'open'
    })
};

