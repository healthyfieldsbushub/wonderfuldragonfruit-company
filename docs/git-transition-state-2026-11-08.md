# Git repository transition state — 2026-11-08 11:16

## Situation
- Old canonical binding: `healthyfieldsbushub/wonderful-dragon-fruit-south-africa` (DELETED by owner request at ~09:44).
- New clean mirror repo created + pushed via owner PAT: `healthyfieldsbushub/wonderfuldragonfruit-company` (single commit cb4d3df, branch main). PAT stored as GITHUB_PAT in runtime env file; never echoed in chat.
- Platform binding cannot be changed via API alone: PUT config/git for github → `canonical_changed` error (retried twice, even with fresh name `wonderfuldragonfruit-company-live`). PUT config/git for manus → required owner confirmation card (`confirmation_required`), operation `wdo_1d2c02449a03930605c8b2c5`.
- Owner said "authorized" but transfer stayed `awaiting_confirmation`; card click did not register.
- to_manus route was blocked anyway: source repo (old GitHub) is deleted → snapshot recovery impossible. Operation was ABORTED (POST config/git/abort) at 11:16 — status: aborted, original binding preserved.
- Retried PUT config/git to_github with new name → `canonical_changed` again. Binding unchanged (revision 26, git_repository still old deleted repo).

## What still works
- Local server healthy on :3000; WhatsApp webhook handshake OK; PUDO webhook 401 w/o secret; CG webhook 200; Courier Guy LIVE RATES work (3 rates, R129.95 Economy).
- PUDO live rates blocked at PUDO API: rotated key `64247020|1swu…` → "Unauthenticated" on api-pudo.co.za and 403 on api-tcg proxy; old key times out/500. Owner must check PUDO dashboard (account 64247020) — API key active? v1 product enabled?
- Production https://wonderfuldragonfruit.company serves HTTP 200 (old build; publish pending).

## Required next steps
1. Owner must click the Git confirmation card in Manus Dashboard (may need to cancel any stale card first). The card is the ONLY way to switch the canonical binding — PAT cannot do it.
2. Preferred flow once card works: PUT config/git {"git":{"canonical":{"provider":"github","owner":"healthyfieldsbushub","name":"<new private repo name>"}}} → platform creates NEW private repo, transfers checkpoint, complete → auto_publish works.
3. Then keep `wonderfuldragonfruit-company` synced via PAT pushes as mirror.
4. Publish (Dashboard) → verify WhatsApp webhook live on production.
5. Fix PUDO key with owner.

## Platform contract facts (git-canonical.md)
- Existing-repo adoption / rebind is UNSUPPORTED — only NEW private repo creation via owner card.
- Complete verify: target main must equal/descend from latest accepted checkpoint.
- github connector errors: github_repository_detached etc. — resolve access to confirmed repo.
