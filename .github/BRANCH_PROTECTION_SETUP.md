# GitHub branch protection — `main`

**TSC:** CC8.1 (change management)  
**Target:** 2026-06-21

Configure in **Settings → Branches → Branch protection rules → main**:

| Setting | Value |
|---------|-------|
| Require pull request before merging | Yes |
| Required approvals | **1** |
| Dismiss stale reviews | Yes |
| Require status checks | **Lint & Type Check**, **Production test gate** |
| Require branches up to date | Yes |
| Do not allow bypassing | Admins included |
| Restrict force pushes | Enabled |
| Restrict deletions | Enabled |

**Emergency hotfix:** Document in `CHANGE_MANAGEMENT_POLICY.md` — CTO may merge with post-hoc review within 24h; record in `compliance/evidence/2026-MM/git-activity.csv`.

**Evidence:** Screenshot → `compliance/evidence/2026-06/access/github-branch-protection.png`
