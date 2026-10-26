# ClairoVid.ai — Project Status

**Updated:** October 26, 2026  
**Release:** V1 development  
**Overall:** Core app foundation is in place; V1 is not launch-ready.

## How to use this document

The PRD defines what V1 should do. Design and architecture documents describe intended behavior. This file tracks what is implemented and verified in the repository. A Stitch screen or a disabled UI control does not count as a working feature.

Statuses:

- **Implemented:** Code is present and the stated behavior has been checked.
- **Needs acceptance:** Code is present, but requires a real user or configured service to verify end-to-end.
- **Partial:** Some steps work; the complete V1 behavior is missing.
- **Not started:** No production implementation is present.
- **Blocked:** Work needs a decision, account, provider, or environment that is currently unavailable.

## Current feature register

| Feature | Status | Current implementation / remaining work |
|---|---|---|
| Public homepage and Cinema identity | Implemented | ClairoVid homepage uses the approved dark/orange direction. The same logo component is shared across public and signed-in screens. |
| Sign-up, sign-in, and MongoDB-backed sessions | Needs acceptance | Better Auth and MongoDB are wired. Sessions are configured to persist for 30 days and refresh during active use. Production email verification requires Resend. Verify the new login and logo navigation with a real account. |
| Signed-in logo navigation | Needs acceptance | Workspace logos go to `/dashboard`; the signed-in homepage logo and actions are session-aware. Existing sign-in/sign-up routes redirect an active session to the dashboard. Verify these paths with the user's account. |
| Personal dashboard and project library | Partial | Owner-scoped project list, status filters, responsive navigation, and empty state are present. API listing is limited to 50; cursor-based Load more is not implemented. |
| Project creation and private ownership | Implemented | Signed-in acceptance passed October 26: created one project, returned to My videos, and reopened it. Creation uses an authenticated idempotent POST. Repeated-request behavior was not fault-injected. |
| Idea editor and draft autosave | Implemented | Signed-in acceptance passed October 26: entered a topic, waited for Saved, refreshed, and reopened the project; the topic remained. Concurrent-edit and forced save-failure recovery paths still need dedicated checks. |
| Gemini brainstorming | Needs acceptance | Authenticated endpoint and three-angle UI are implemented. Provider access and output quality have not been verified in this pass. |
| Gemini storyboard generation | Partial | Generation endpoint, editable scene UI, and explicit approval are present. Quality, stale-result recovery, and the full revision workflow need acceptance. |
| Conversational storyboard/video revisions | Not started | The current editor supports direct scene edits; chat-based revision is not implemented. |
| ElevenLabs narration and timed caption cues | Partial | Generation route and synchronized audio/caption preview are present. Without R2, local preview is temporary and unsaved. A voice/caption preview is not a rendered video. |
| Editable captions | Not started | Captions can be previewed, but there is no caption editing or saved revised caption version. |
| Persistent generation jobs and recovery | Partial | Job records are written, but the durable Inngest workflow, resumable stage runner, and full recovery experience are not wired. |
| Remotion render and 1080p MP4 download | Not started | No final MP4 renderer or downloadable video is available in the app. |
| Private R2 media storage | Partial | Storage adapters exist. Persistent audio/caption output requires R2 configuration; the current local fallback is temporary. |
| Instagram connection, publishing, and scheduling | Not started | Settings shows that publishing is unavailable; OAuth, publish intents, scheduling, and status reconciliation are not implemented. |
| Password recovery, production email, and launch operations | Partial | Verification email code exists, but provider configuration, recovery flow, abuse controls, tested backups/restore, and production launch checks remain. |

## Active milestone

**M2 — Create a private project and persist its idea: accepted October 26, 2026**

The signed-in happy path passed in the user's browser. One private project was created, its topic autosaved, and the same topic remained after refresh and reopening from My videos. The browser showed three drafts afterward (two existing plus the new test project).

Acceptance checklist:

1. **Passed:** Clicked **New explainer** and confirmed one private project opened at the Idea step.
2. **Passed:** Entered a topic and waited for the editor to say **Saved**.
3. **Passed:** Refreshed, reopened the project from My videos, and confirmed the topic remained.
4. **Not fault-injected:** Repeated/uncertain create requests should reuse the idempotency key and avoid a duplicate.
5. **Not fault-injected:** Save failure retry and the browser leave warning remain to be checked.

Responsive follow-up: the narrow Edge workspace viewport used for this check showed horizontal overflow on the dashboard. Check the responsive layout separately before mobile acceptance.

**Previous milestone M1 — Session and logo navigation:** The signed-in session is confirmed through this acceptance run. Logo navigation itself was not part of this check and remains to be rechecked.

## Next milestones (one at a time)

After M2 is accepted, take the next item only when the previous one is accepted:

1. Storyboard generation/edit/approval acceptance.
2. One reliable, persistent narration-and-caption output path.
3. MP4 rendering and download.
4. Caption editing and conversational revisions.
5. Instagram OAuth, publishing, and scheduling.
6. Production recovery, abuse controls, backups, and release verification.

Each milestone should have one bounded behavior, a written acceptance checklist, implementation, and verification. Record blockers here before expanding scope. Ask the founder only when a product choice or external account is actually needed.

## Latest checks and limits

- TypeScript check (`npx tsc --noEmit`): passed October 26, 2026.
- ESLint (`eslint src --no-cache`): passed October 26, 2026.
- Browser smoke check: public homepage loaded. Signed-out visits to `/dashboard` and `/projects/new` redirected to `/sign-in`; unauthenticated `GET /api/projects` returned 401.
- Signed-in M2 acceptance: project creation, autosave, refresh, and reopen passed in the user's browser on October 26, 2026.
- A direct read-only MongoDB ping from the command runner did not complete; however, authenticated create/save/reload/reopen succeeded through the app, exercising the configured database path.
- Project creation uses an idempotent POST; `/projects/new` no longer writes to MongoDB during a GET/prefetch.
- Draft writes now drain edits that arrive during an active request instead of leaving the newest text unsaved.
- Account-based creation, reload, and save-failure acceptance remain unverified because there is no active signed-in browser session.
- Local homepage and sign-in pages load on `http://127.0.0.1:4173/`.
- The signed-in dashboard was visually inspected in the available Edge viewport; horizontal overflow was visible, so responsive layout still needs follow-up.
- Production build has not been verified; do not run it concurrently with the active dev server because both use the configured `.next-build` directory.
- Stitch's existing project opened but returned “Sorry, we hit a snag.” The dashboard implementation follows the approved Cinema references and [dashboard design handoff](./ClairoVid.ai%20-%20Dashboard%20Design.md); a new generated Stitch dashboard screen was not available to inspect.

## Product and design references

- [Final V1 PRD](./Product%20Requirements%20Document%20-%20AI%20Educational%20Video%20Generation%20SaaS.md)
- [Application System Design](./ClairoVid.ai%20-%20Application%20System%20Design.md)
- [Pipeline Technical Design](./ClairoVid.ai%20-%20Pipeline%20Technical%20Design.md)
- [Public Homepage Design](./ClairoVid.ai%20-%20Public%20Homepage%20DESIGN.md)
- [Dashboard Design Handoff](./ClairoVid.ai%20-%20Dashboard%20Design.md)
