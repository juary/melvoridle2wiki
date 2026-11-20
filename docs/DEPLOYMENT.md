# GitHub Pages deployment

Repository: [juary/melvoridle2wiki](https://github.com/juary/melvoridle2wiki)

Deployment target: [https://juary.github.io/melvoridle2wiki/](https://juary.github.io/melvoridle2wiki/)

## First-time setup

1. Push the source to the public repository's `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open **Actions → Build and deploy Melvor Idle 2 Wiki**. If no run starts automatically, choose **Run workflow** and select `main`.
5. Wait for the build and deploy jobs to finish, then open the Pages URL from the deployment job or Pages settings.

## Automatic publishing

The workflow is [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

- Runs when code is pushed to `main` or when started manually.
- Uses Ubuntu and Node.js 22.
- Runs `npm run build` and writes the static site to `dist/`.
- Uploads `dist/` as the GitHub Pages artifact and publishes it with the official Pages deploy action.
- Serializes Pages deployments so concurrent runs do not publish at the same time.

The project has no third-party npm dependencies or external service secrets. The workflow uses GitHub's short-lived token with `contents: read`, `pages: write`, and `id-token: write` permissions.

Repository or organization policy may require approval for the `github-pages` environment. If a deployment waits for approval, a repository administrator can review the run in Actions.

## Project path

This is a GitHub Pages project site under `/melvoridle2wiki/`. The build uses the URL in `src/data/site.json` to generate links, canonical URLs, and the sitemap. If the repository name or deployment address changes, update that configuration and the README together.

The default `juary.github.io` address does not require a `CNAME` file or custom DNS.

## Local preview

```sh
npm run build
npm run dev
```

The preview server uses port `4173` by default. Set the `PORT` environment variable to choose another port. `dist/` is generated output and is not committed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Home page returns 404 | Confirm Pages uses GitHub Actions, the deploy job succeeded, and the URL includes `/melvoridle2wiki/`. |
| Styles or images are missing | Confirm the configured site URL has the `/melvoridle2wiki/` project path and that the latest build uploaded `dist/`. |
| A push does not publish | Check that the push reached `main` and inspect its Actions run. |
| Deployment is waiting | Check whether the `github-pages` environment requires approval. |
| Local content looks old | Run `npm run build` again, then refresh the preview. |

## References

- [GitHub: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [actions/configure-pages](https://github.com/actions/configure-pages)
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)
