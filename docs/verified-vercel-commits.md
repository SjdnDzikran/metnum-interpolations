# Verified Vercel deployment commits

After a push to `master` whose latest commit author is not `SjdnDzikran`,
`.github/workflows/trigger-vercel-deployment.yml` appends an empty deployment
commit. GitHub creates and signs it through the `createCommitOnBranch` API,
so its author is `SjdnDzikran` and its signature appears as **Verified**.
The workflow uses `DEPLOY_COMMIT_TOKEN` to authenticate as that account.

## Token setup

Store a fine-grained personal access token owned by `SjdnDzikran` as the
repository Actions secret `DEPLOY_COMMIT_TOKEN`. Limit its access to the
selected deployment repositories with **Contents: Read and write**.
To save or renew the secret using the CLI:

```sh
gh secret set DEPLOY_COMMIT_TOKEN --repo SjdnDzikran/metnum-interpolations
```

Renew the token before its expiration. The built-in `GITHUB_TOKEN` would
make the commit author the Actions bot instead of the Vercel project owner.

## Behavior

Owner-authored commits, including the generated commit, skip the job to
prevent a loop. The job rejects missing tokens, tokens belonging to another
account, and commits without a valid GitHub signature. It skips older pushes
when the branch has advanced and supplies the expected branch tip to the
API, preventing conflicting updates. The empty commit changes no files.
Existing unsigned commits keep their verification status.

See [GitHub's commit API documentation](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch)
and [Vercel's collaboration rules](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#hobby-teams).
