# Waifu binary publication bridge

This document defines the approved bridge for publishing generated Waifu raster artwork when the scheduled executor can create local files but the connected GitHub write interface cannot accept a local binary file parameter.

It supplements `automation/daily-waifu.md`; it never relaxes that contract. The Daily Waifu guardrails, adult-character rule, research standard, image resolution and byte-size requirements, validation, build, deployment, and production verification all remain mandatory.

## Why this exists

Generated artwork is a real binary file. GitHub's ordinary text-file write actions are intentionally unsuitable for it. The bridge transports the exact bytes as small base64 text chunks on a disposable staging branch, reconstructs the original files inside GitHub Actions, verifies their hashes, runs the full Waifu validator and production build, and produces a single candidate commit containing the edition and all artwork together.

The candidate is **not** published automatically. The scheduled executor must verify it and then fast-forward `main` to that exact commit using the connected GitHub write tool. This keeps publication under the scheduled task's explicit control and lets the normal `main` push trigger downstream checks and deployment.

## Repository components

- `scripts/waifu-publication-bridge.mjs` prepares and consumes bridge payloads and includes a self-test.
- `.github/workflows/waifu-publication-bridge.yml` reconstructs and validates a candidate.
- `waifu-publication-staging` is a disposable transport branch. Reset it to current `main` before every bridge run.
- `waifu-publication-ready` is the workflow's candidate-output branch. Never treat this branch as publication.

## Exact scheduled-run protocol

1. Finish the complete edition and every final WebP locally. Do not stage placeholders or low-resolution substitutes.
2. Verify the files locally, including real WebP headers, file dimensions, aspect ratio, and byte size.
3. Give the bridge a unique run id, normally the Arizona edition date plus a short nonce.
4. Prepare a text-only payload. When the helper script is available locally, use:

   `node scripts/waifu-publication-bridge.mjs prepare --output <payload-dir> --run-id <run-id> --file <repo-path>=<local-path> [--file ...]`

   Every intended new edition file and every generated Waifu WebP must be included in the same payload. The helper writes `.waifu-publication-bridge/runs/<run-id>/...` plus `.waifu-publication-bridge/READY.json`.
5. Read current `main` and record its head SHA.
6. Force-reset **only** `waifu-publication-staging` to that current `main` SHA. Never force-update `main`.
7. Upload all generated payload files to `waifu-publication-staging` as UTF-8 text using the GitHub text-file write actions. Upload `READY.json` **last**. Its creation is the trigger; do not create it until every manifest and chunk file is present.
8. Wait for the `Waifu publication bridge` workflow triggered by that staging commit. A failed, cancelled, or missing run is a publication failure.
9. After the bridge succeeds, read `waifu-publication-ready`. The ready commit must have exactly one parent and that parent must equal the current `main` head. If `main` moved while the bridge was building, do not force anything; reset staging to the new `main` and rebuild the candidate.
10. Compare `main...waifu-publication-ready`. The candidate must contain only the intended Waifu edition and its intended WebP artwork. No homepage change or unrelated file may be present.
11. Fast-forward `main` to the exact ready commit SHA using the connected GitHub `update_ref`/equivalent action with force disabled. Never merge an unverified candidate and never force `main`.
12. Wait for the normal `Waifu guardrails` workflow on the resulting `main` commit and require it to pass.
13. Wait for the production Vercel deployment, then inspect the production edition and the actual image asset URLs exactly as required by `automation/daily-waifu.md`.
14. Only after production verification may the run report publication success.

## Transport and integrity rules

The payload is data, not executable code. The consumer accepts only new files under `src/content/waifu/` and `public/images/waifu/`, only `create` mode, and only `.md`/`.mdx` content plus `.webp` artwork. It refuses overwrites, path traversal, malformed manifests, malformed base64, byte-length mismatches, SHA-256 mismatches, and non-WebP data masquerading as `.webp`.

Base64 chunking is transport only. The published Git object contains the reconstructed binary WebP bytes, not base64 text. The bridge workflow runs `node scripts/validate-waifu.mjs` and `npm run build` before it creates the candidate commit.

## Fail closed

If any chunk cannot be uploaded, if `READY.json` was triggered too early, if the bridge workflow fails, if hashes do not match, if validation/build fails, if the candidate parent is stale, if the diff contains unrelated changes, if `main` cannot be fast-forwarded, or if downstream deployment/production verification fails, stop. Preserve the local work and report the exact failure. Never substitute an SVG, placeholder, tiny emergency export, stretched image, or article-only commit.
