# Cursor + GitHub setup for Pulsar

This repo is set up to use **Cursor’s GitHub integration** and **automated code review** on pull requests. Follow these steps once to enable everything.

---

## 1. Cursor GitHub App (issues + PRs, agent from comments)

Lets you trigger Cursor’s cloud agent from **issues and pull requests** by commenting (e.g. `@cursor fix` or `@cursor implement the login flow`). The agent can read the issue/PR, make changes, and push commits.

**Steps:**

1. Open [Cursor Dashboard → Integrations](https://cursor.com/dashboard?tab=integrations).
2. Under **GitHub**, click **Connect**.
3. Choose **All repositories** or **Selected repositories** and include `marymaggee/pulsar`.
4. Approve the GitHub App (clone, PRs, issues, etc.).

**Usage:**

- On an **issue**: comment `@cursor fix` (or a custom prompt). Cursor will create a branch, make changes, and push. The workflow below can then open a PR and link the issue.
- On a **PR**: comment `@cursor address the review comments` (or any prompt) to have the agent apply fixes and push.

---

## 2. GitHub Actions: code review on every PR

The workflow **`.github/workflows/cursor-code-review.yml`** runs on every pull request (open / push) and posts a **Cursor-generated code review** as a PR comment.

**Required:**

1. Get a **Cursor API key**: [Cursor Dashboard](https://cursor.com/settings) → **API keys** → Create.
2. In GitHub: **pulsar** repo → **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret**: name `CURSOR_API_KEY`, value = your Cursor API key.

After that, every new or updated PR will get a “Cursor code review” comment. No other config needed.

**Optional:** To use a different model for reviews, add a **Variable**: name `CURSOR_REVIEW_MODEL`, value e.g. `gpt-4o` (default is `gpt-4o-mini`).

---

## 3. GitHub Actions: open PR from Cursor/issue branches

The workflow **`.github/workflows/cursor-pr-from-branch.yml`** opens a **pull request** when you push a branch whose name includes an issue number, and sets the PR description so it **links (and can close) the issue**.

**Branch name patterns that are detected:**

- `cursor-42`, `fix-42`, `issue-42`
- `fix/42`, `issue/42`
- `42-some-description`

Example: push a branch named `fix-17` or `cursor-17-add-login`; the workflow will create a PR with description “Fixes #17”.

**No extra setup** beyond the Cursor GitHub App (so Cursor can push branches). If you use Cursor to fix an issue and it creates a branch like `cursor-17-...`, push that branch (or let Cursor push it); the Action will create the PR and link the issue.

---

## Summary

| What you want | What to do |
|---------------|------------|
| Trigger Cursor from an issue or PR | Install Cursor GitHub App (step 1), then comment `@cursor &lt;prompt&gt;` on the issue/PR. |
| Automatic code review on every PR | Add `CURSOR_API_KEY` in repo Actions secrets (step 2). |
| PRs created and linked to issues from branches | Use branch names like `fix-17` or `cursor-17-title` and push; workflow (step 3) opens the PR with “Fixes #17”. |
| Apply fixes from review comments | On the PR, comment `@cursor address the review comments` (or similar); Cursor will push updates. |

---

## Troubleshooting

- **“Cursor code review” comment not appearing:**  
  Check that `CURSOR_API_KEY` is set in **Settings → Secrets and variables → Actions** and that the workflow run for that PR didn’t fail (see **Actions** tab).

- **Agent can’t push / no PR from branch:**  
  Ensure the Cursor GitHub App is installed on this repo and has access to create branches and open PRs. Re-run the workflow from the **Actions** tab if needed.

- **Different Cursor CLI version in CI:**  
  The workflow installs the latest Cursor CLI from `cursor.com/install`. To pin a version, you’d need to adjust the install step (see Cursor CLI docs).
