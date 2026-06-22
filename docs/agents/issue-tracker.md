# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- Create issues with `gh issue create`.
- Read issues and comments with `gh issue view`.
- List and filter issues with `gh issue list`.
- Comment with `gh issue comment`.
- Apply or remove labels with `gh issue edit`.
- Close issues with `gh issue close`.
- Infer `JonathanYcWang/Recess` from the repository remote.

## Completing issues

When an issue's acceptance criteria are met in a pull request:

1. Post a completion comment with `gh issue comment` that records exactly what was done.
2. Link the pull request in that comment.
3. Close the issue with `gh issue close` only after the pull request is merged.

The completion comment must include:

- Files added or changed, with a short purpose for each.
- Commands or checks run and their result.
- Any deliberate scope limits, follow-ups left to other issues, or human-only steps not performed.
- How each acceptance criterion was satisfied.
- The pull request URL that contains the change.

Do not close an issue before its pull request is merged. Do not close an issue without the completion comment. Do not close an issue when criteria are only partially met unless the issue body explicitly allows splitting remaining work.

## Pull requests as a triage surface

PRs as a request surface: no.

External PRs do not enter the issue-triage state machine. Use PR-specific workflows when pull request work is explicitly requested.

## Skill routing

When a skill says “publish to the issue tracker,” create a GitHub issue.

When a skill says “fetch the relevant ticket,” read the GitHub issue and its comments.
