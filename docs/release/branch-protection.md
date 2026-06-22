# Branch protection and milestone artifacts

Human-owned release controls for Recess. Agents document the required settings; repository admins apply them in GitHub.

## Required branch protection for `main`

Configure in GitHub → Settings → Branches → Branch protection rules for `main`:

1. Require a pull request before merging.
2. Require status checks to pass:
   - `verify`
   - `package-chromium`
   - `package-safari`
3. Require conversation resolution before merging.
4. Disable force pushes to `main`.
5. Do not allow bypassing the above settings for administrators during normal release work.

Stable check names are defined in `.github/workflows/ci.yml`.

## Pull request policy

- Maximum three disjoint implementation pull requests may be open for the same issue scope without a fresh review request.
- After that limit, close or merge existing work before opening another implementation path.
- Disputed review findings require human resolution before merge.

## Epic milestone artifacts

Store milestone artifacts outside the repository in the team release workspace:

- Location: `Recess/milestones/<epic-issue-number>/`
- Owner: repository maintainer (human release approver)
- Required contents:
  - Epic summary and linked merged pull requests
  - Verification evidence (`npm run verify` result or CI run URL)
  - Packaging smoke checklist results for Chromium and Safari
  - Known limitations and follow-up issues
  - Human sign-off name and date

Agents may prepare draft artifact contents in pull request or issue comments, but only a human approver may mark a milestone complete.

## Human-only actions

- Merge approval for high-risk changes
- Branch protection and ruleset changes
- Development signing credentials and Safari release signing
- Final milestone approval and release tagging
