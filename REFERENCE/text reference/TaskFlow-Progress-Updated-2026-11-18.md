# TaskFlow --- Development Handoff / Progress Checkpoint

**Checkpoint date:** 16 November 2026\
**Git branch/workflow:** Work directly on `main`; user no longer wants a separate feature-branch workflow.\
**Repository/workspace:** `/workspaces/TaskFlow`\
**Framework:** Next.js 16.4.0 (App Router, Turbopack)\
**Database:** MongoDB Atlas, database `taskflow`\
**Language/style:** JavaScript, Tailwind CSS; user prefers relative
imports and learning-oriented, step-by-step guidance.

------------------------------------------------------------------------

## 1. What we are building

TaskFlow is being redesigned around **multiple workspaces per user**.

A user should be able to: - Own more than one workspace. - Join
workspaces owned by other users. - Switch between workspaces. - Have
workspace-level roles (`owner`, `admin`, `member`). - Have project-level
membership/permissions separately from workspace membership.

Planned data model: - `users`: existing authentication/account records;
preserve these. - `workspaces`: workspace metadata, `ownerId`, plan,
default flag. - `workspaceMembers`: workspace membership and role. -
`projects`: each project will eventually have a `workspaceId`. -
`projectMembers`: project-specific membership, separate from workspace
membership. - `tasks`: personal tasks remain independent; project tasks
belong to projects. - `invitations`: workspace invitations with
expiry/status (no tokens or external links; existing users only).

Free plan requirement: **maximum 4 workspace members, including the
owner**. This is not yet enforced; it must be enforced when implementing
invitations and membership changes.

------------------------------------------------------------------------

## 2. Important safety and database decisions

The user explicitly chose to: - Reset TaskFlow application data while
preserving authentication accounts. - Preserve the `visitor_logs`
collection. - Skip a backup. - Delete the old `user` (singular),
`projects`, and `tasks` collections.

Do not delete or overwrite `users` or `visitor_logs`. Existing auth
information is stored in `users`, including fields such as `_id`,
`googleId`, `githubId`, `passwordHash`, and other account fields.

The user deleted `projects` and `tasks`. Do not assume `teams`,
`teamMemberships`, or `invitations` collections were deleted or even
existed; inventory them if/when needed.

**Do not begin project/task API migration until workspace foundation and
project association design are agreed and tested.**

------------------------------------------------------------------------

## 3. Git state

Use `main` only. The user explicitly requested a single-branch workflow and does not want feature branches.

At the last recorded `git status`, these files were modified and must be
preserved: - `app/page.js` - `app/tasks/referce.md`

This new file was untracked at that time: - `lib/workspace.js`

More files have since been created/modified: -
`app/api/auth/register/route.js` - `lib/authOptions.js` -
`app/api/workspaces/route.js` -
`app/api/workspaces/[workspaceId]/route.js`

No commits were made in the recorded work. Re-check `git status` before
staging or committing. Do not discard the two unrelated modifications.

------------------------------------------------------------------------

## 4. Workspace utility: `lib/workspace.js`

The file currently contains these exported functions:

### `ensureWorkspaceIndexes(db)`

Creates: - A unique partial index on `workspaces.ownerId` for documents
where `isDefault: true`, named `unique_default_workspace_per_owner`. - A
unique compound index on `workspaceMembers.workspaceId` + `userId`,
named `unique_workspace_membership`. - Supporting indexes on
`workspaceMembers.userId/joinedAt` and
`workspaceMembers.workspaceId/role`.

### `createWorkspace({ db, user, name, isDefault = false })`

-   Requires a valid MongoDB user `_id` and non-empty workspace name.
-   Creates a workspace with `ownerId`, `plan: "free"`, `isDefault`,
    timestamps.
-   Creates an owner membership in `workspaceMembers`.
-   If membership insertion fails, attempts to delete the newly created
    workspace as compensation.
-   Returns workspace details with `memberCount: 1` and `role: "owner"`.

### `ensureDefaultWorkspace(db, userId)`

-   Finds the user in `users`.
-   Checks `users.defaultWorkspaceId`.
-   If necessary, finds an existing default workspace by owner.
-   Ensures owner membership exists using an upsert.
-   Otherwise creates a default workspace and stores its ID on
    `users.defaultWorkspaceId`.
-   Handles a concurrent creation race by looking up the default
    workspace after an error.

### `getUserWorkspaces(db, userId)`

-   Finds the user's workspace memberships.
-   Loads those workspaces.
-   Adds the user's membership role to each returned workspace.

**Known caveat:** This implementation is not a full MongoDB transaction.
The concurrent default workspace path is protected by the unique partial
index, but consistency around multi-document writes still deserves
review before production.

------------------------------------------------------------------------

## 5. Authentication integration completed

### `lib/auth.js`

Existing helper returns:

``` js
{
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
}
```

Use `currentUser.id` (not `_id`) when working with `getCurrentUser()`.

### `app/api/auth/register/route.js`

Updated to: - Preserve existing validation and password hashing. -
Insert the new user into `users`. - Run `ensureWorkspaceIndexes(db)`. -
Call `ensureDefaultWorkspace(db, result.insertedId.toString())`.

### `lib/authOptions.js`

Updated to: - Preserve Credentials, Google, and GitHub providers. -
Preserve the rule: **do not automatically link a social login to an
existing account merely because the email matches**. - Credentials
sign-in initializes a default workspace. - Google/GitHub sign-in finds
the linked user or creates a new TaskFlow user, then initializes a
default workspace. - Existing Google/GitHub users without a default
workspace receive one on next sign-in. - JWT/session continues to use
MongoDB user ID as `session.user.id`.

The user ran `npm run build` successfully after these changes.

------------------------------------------------------------------------

## 6. Workspace collection test completed

The user registered a new test account and inspected MongoDB Atlas.

Verified documents: - `users` document had `defaultWorkspaceId`. -
`workspaceMembers` document had matching `userId`, matching
`workspaceId`, and `role: "owner"`. - `workspaces` document had matching
`ownerId`, `plan: "free"`, and `isDefault: true`.

A later GET request returned a default workspace for the logged-in
account: - Name: `damanstudyonly's Workspace` - Workspace ID:
`6af8aed641bf311e9cac3d40` (from API response) - Owner ID:
`6add440d7e92c2e8c70d289d` - `plan: "free"` - `isDefault: true` -
`role: "owner"`

A second workspace was created: - Original name: `My Second Workspace` -
Workspace ID: `6af8af5941bf311e9cac3d42` - Same owner ID:
`6add440d7e92c2e8c70d289d` - `plan: "free"` - `isDefault: false` -
`memberCount: 1` - `role: "owner"`

It was successfully renamed to: - `TaskFlow Development`

Do not assume these test IDs belong to the user's long-term production
account; they are test data from this development session.

------------------------------------------------------------------------

## 7. Workspace API routes completed and tested

### `app/api/workspaces/route.js`

Supports: - `GET`: authenticates with `getCurrentUser()`, ensures
default workspace exists, returns `getUserWorkspaces()`. - `POST`:
authenticates, validates workspace name (1--50 chars), loads user by
ObjectId, calls `createWorkspace()` with `isDefault: false`.

Both were tested successfully: - GET returned the default workspace. -
POST returned `201` and created `My Second Workspace`. - A subsequent
GET confirmed two workspaces.

### `app/api/workspaces/[workspaceId]/route.js`

Supports: - `GET`: checks membership, returns workspace details, member
count, and role. - `PATCH`: only a workspace owner can rename; validates
name (1--50 chars). - `DELETE`: only owner; blocks default workspace;
blocks deletion if projects exist; blocks deletion if pending
invitations exist; then deletes memberships, invitations, and workspace.

Tests completed: - GET second workspace: passed (`200`), returned
`TaskFlow Development`, role owner, memberCount 1. - PATCH rename:
passed (`200`), updated `updatedAt`. - DELETE default workspace:
correctly rejected with `400`,
`"The default workspace cannot be deleted"`.

**Important unresolved issue:** DELETE currently performs multiple
separate writes without a transaction. It is not production-safe against
partial failure. Also the project guard queries
`{ workspaceId: workspaceObjectId }`, but project APIs have not yet been
migrated to write `workspaceId`. The current project collection was
deleted during the reset, so there are no legacy project records to
protect now, but project association must be implemented before
production use. The invitation collection/schema also has not yet been
verified.

------------------------------------------------------------------------

## 8. Build status

`npm run build` passed repeatedly after: - Creating
`lib/workspace.js`. - Integrating workspace initialization into
registration and auth callbacks. - Creating
`app/api/workspaces/route.js`. - Creating
`app/api/workspaces/[workspaceId]/route.js`.

The last build output recognized: - `ƒ /api/workspaces` -
`ƒ /api/workspaces/[workspaceId]`

No build errors were reported.

------------------------------------------------------------------------

## 9. Earlier checkpoint (14 November)

The previous checkpoint's immediate next action was to inspect project API data before finalizing workspace deletion safety. That investigation was deferred while the workspace invitation system was implemented. The original notes about project/task migration and workspace deletion remain relevant, but invitation work is now substantially further along.

--------------------------------------------------------------------------

## 10. Invitation system progress (16 November 2026)

### Decisions and rules

- Invitations are only for existing TaskFlow accounts; no email invitations, email delivery, invitation tokens, or external invite links.
- User discovery is global across the TaskFlow `users` collection by username, but invitations are always scoped to the workspace ID in the route.
- Search results exclude the current user, existing members of that workspace, and users with a pending invitation to that workspace.
- Search returns safe profile fields only (`_id`, `username`, `name`, `image`); it must not expose email, password hashes, or provider credentials.
- Workspace owner can invite `admin` or `member`; workspace admin can invite `member` only; members cannot invite.
- One pending invitation per user per workspace.
- Invitations expire after 7 days. Statuses include `pending`, `accepted`, `declined`, `revoked`, and `expired`.
- Free workspace capacity is 4 members including the owner. Pending invitations reserve seats.
- Invitation records use `workspaceId`, `invitedUserId`, `invitedBy`, `role`, `status`, `createdAt`, `expiresAt`, and `respondedAt`.
- MongoDB transactions are used for invitation creation and acceptance. The helper increments `seatVersion` on the workspace document to serialize concurrent seat operations.

### Files implemented

- `lib/invitations.js`
  - `InvitationError`
  - `expireWorkspaceInvitations()`
  - `expireUserInvitations()`
  - `createWorkspaceInvitation()`
  - `getWorkspaceInvitations()`
  - `getUserInvitations()`
  - `acceptWorkspaceInvitation()`
  - Invitation creation checks workspace role, existing TaskFlow user, duplicate membership/invitation, and capacity.
  - Acceptance verifies recipient identity, pending status, expiry, existing membership, and capacity; it inserts membership and marks invitation accepted in one transaction.
- `app/api/workspaces/[workspaceId]/users/search/route.js`
  - `GET` username-prefix search across all TaskFlow users, scoped to the target workspace for permission and exclusion checks.
  - Only workspace owners/admins can search.
- `app/api/workspaces/[workspaceId]/invitations/route.js`
  - `POST` creates an invitation.
  - `GET` lists sent invitations for workspace owners/admins.
- `app/api/invitations/route.js`
  - `GET` lists invitations received by the logged-in user.
- `app/api/invitations/[invitationId]/accept/route.js`
  - `POST` accepts an invitation.

### Tests completed

- Username search tested successfully.
- Invitation creation returned HTTP `201` for user `takhideepu1`, role `member`.
  - Workspace ID: `6afae40e9e14a7d83b62e229`
  - Invited user ID: `6afae2a29e14a7d83b62e225`
  - Inviter ID: `6afae40d9e14a7d83b62e228`
  - Invitation ID: `6afae66210a088054aecb9f1`
  - Created: `2026-11-16T11:17:54.688Z`
  - Expires: `2026-11-23T11:17:54.688Z`
- Workspace sent-invitations GET returned the invitation with `invitedUsername: "takhideepu1"` and `inviterUsername: "yaman"`.
- Recipient inbox route was created and user reported it was done. The inbox GET itself has not been explicitly shown/tested in the conversation.
- Acceptance by `takhideepu1` returned HTTP `200` and status `accepted` for invitation `6afae66210a088054aecb9f1`.
- **Not yet verified:** membership document in `workspaceMembers` after acceptance. Next, while logged in as `takhideepu1`, GET `/api/workspaces/6afae40e9e14a7d83b62e229` and confirm `role: "member"` and expected `memberCount: 2` (assuming owner is the only other member).

### Build status and route cleanup note

- `npm run build` passed after invitation creation, sent-invitation listing, inbox route, and acceptance route were added.
- Latest route output included:
  - `/api/invitations`
  - `/api/invitations/[invitationId]/accept`
  - `/api/workspaces/[workspaceId]/invitations`
  - `/api/workspaces/[workspaceId]/users/search`
- The latest build output also still showed `/api/auth/invitations`. This appears to be an accidental old/duplicate route (possibly `app/api/auth/invitations/route.js`). Inspect it and remove it only if it is the unintended duplicate inbox route. The intended inbox route is `app/api/invitations/route.js`.
- An earlier build showed acceptance under `/api/workspaces/[workspaceId]/invitations/[invitationId]/accept`; the user moved it to the correct `/api/invitations/[invitationId]/accept` path, which appeared in the latest build.

--------------------------------------------------------------------------

## 11. Exact point where we left off

The assistant had just said:

> Before building the workspace switcher, let's strengthen workspace
> deletion so it cannot leave orphaned records. First inspect the
> current project data structure.

The user has **not yet run** the requested command.

### Immediate next action

1. Verify the accepted invitation created a `workspaceMembers` document for `takhideepu1` in workspace `6afae40e9e14a7d83b62e229` (GET `/api/workspaces/6afae40e9e14a7d83b62e229` while logged in as that user).
2. Implement `POST /api/invitations/[invitationId]/decline` using a transaction and recipient identity check; declining should mark the invitation `declined` and release its reserved seat.
3. Then implement safe invitation revocation, pending invitation/member listing as needed, and test owner/admin/member permission boundaries.
4. Inspect and resolve the unexpected `/api/auth/invitations` route before considering the route layout clean.
5. After invitation lifecycle is complete, return to project API inspection and workspace deletion safety.

Do not implement deletion transactions blindly. First determine whether
MongoDB Atlas deployment supports transactions (replica set/sharded
cluster generally required), inspect the project and invitation data
model, and decide a safe deletion strategy. Consider restricting
deletion to empty workspaces and using a transaction if supported, or
carefully ordered guarded writes with recovery strategy.

------------------------------------------------------------------------

## 12. Remaining plan (recommended order)

### Phase A --- Finish workspace API safety

1.  Inspect `app/api/projects/route.js` and
    `app/api/projects/[projectId]/route.js`.
2.  Confirm whether `invitations` exists and define its schema before
    relying on it.
3.  Improve DELETE safety:
    -   owner-only;
    -   default workspace protected;
    -   block deletion while projects or pending invitations exist;
    -   avoid orphaned records;
    -   use transactions if supported, or design a safe empty-workspace
        deletion strategy.
4.  Test deletion of the non-default test workspace only after safety
    checks are ready.

### Phase B --- Workspace selection and switching

5.  Design active workspace persistence (likely a user
    `activeWorkspaceId` field, with validation that user is a member).
6.  Add an endpoint to select/switch active workspace.
7.  Add workspace switcher UI.
8.  Ensure server APIs resolve the active workspace securely from the
    authenticated user's membership, never trusting a client-supplied
    workspace ID without authorization.

### Phase C --- Workspace membership and invitations

9.  Build real invitation collection/API with secure random tokens,
    expiration, pending/accepted/revoked states.
10. Enforce free plan maximum 4 members including owner.
11. Add invite acceptance and membership management.
12. Update Team page, which was previously demo-only, to use real API
    data.

### Phase D --- Project and task migration

13. Add `workspaceId` to projects and enforce workspace membership.
14. Add separate `projectMembers` collection for project-level
    membership.
15. Update project APIs and permissions.
16. Ensure tasks derive workspace through their project; personal tasks
    remain independent.
17. Preserve the user's previous business rules:
    -   Only project owner/admin can create project tasks.
    -   Only project owner/admin can delete project tasks.
    -   Members can update tasks assigned to them.
    -   Personal tasks can be moved into projects only by users with
        appropriate project permissions.
    -   Project status is derived from task completion as previously
        specified.

### Phase E --- Finish UI, tests, and release

18. Build workspace selector and workspace-aware dashboard/projects/team
    views.
19. Test owner/admin/member access boundaries, unauthorized workspace
    access, and cross-workspace data isolation.
20. Run build and API tests after each meaningful stage.
21. Commit changes only after reviewing `git status`; preserve unrelated
    modified files.

------------------------------------------------------------------------

## 13. Working preferences

-   User likes step-by-step guidance and wants to understand what each
    step does.
-   Give complete code when asked for complete code.
-   Avoid asking for code already provided in the conversation.
-   Use relative imports when practical, consistent with user's
    preference.
-   Keep instructions concise and provide exact file paths/commands.
-   User uses GitHub Codespaces and runs commands in `/workspaces/TaskFlow`.
-   Work directly on `main`; do not create or use feature branches.
-   The user makes all code changes. Give exact file paths and instructions; do not edit the repository or push code on the user's behalf.
-   Do not claim any code was executed or any database state changed unless the user reports it or a tool verifies it.
-   Continue one step at a time. Ask for build/test output before moving to the next implementation step.


------------------------------------------------------------------------

## 14. Latest progress update — 17 November 2026

**This section supersedes the older "Exact point where we left off" and
the older UI sequencing where they conflict.** The user and assistant
have since completed more workspace backend work and started the frontend.

### Current product/UI decision

The user decided that workspace operations should live on a dedicated
**Workspaces page**, not inside personal Account Settings.

- Account Settings should remain focused on personal profile, security,
  and connected sign-in accounts.
- The dedicated Workspaces area should handle workspace listing,
  switching, creation, members, invitations, workspace settings, and
  deletion.
- Keep the existing dashboard `WorkspaceSwitcher` for quick switching.
  The dedicated page is for full workspace management.
- Add a **Workspaces** item to the sidebar navigation when the page is
  ready.

### Database reset and current backend foundation

The user later chose to delete/reset application data collections and
build/test the frontend against the APIs. Preserve `users` and
`visitor_logs`; do not delete them. Application data such as workspaces,
workspace memberships, invitations, projects, project memberships, and
tasks was reset by the user. Do not assume old test IDs or records still
exist.

The intended workflow is now:

1. Build a frontend screen.
2. Connect it to the existing API.
3. Test actual UI interactions, loading, empty, error, and permission
   states.
4. Fix API issues revealed by the UI.
5. Finish the feature before moving to the next one.

Workspace foundation APIs and invitation/member APIs described in the
earlier sections were implemented before the reset. The user has since
confirmed workspace creation and switching work after restarting the
development server. Treat older invitation IDs and workspace IDs as
historical only.

### Workspace switcher status

- `app/component/WorkspaceSwitcher.js` was created by the user.
- It loads workspaces from `GET /api/workspaces`.
- It switches the active workspace using
  `POST /api/workspaces/[workspaceId]/active`.
- It can create a workspace using `POST /api/workspaces`.
- The user reported workspace creation and switching are working.
- A mobile visibility issue was fixed by moving the switcher out of a
  `hidden sm:block` wrapper and placing it beneath the dashboard title
  with a constrained mobile width.
- The user confirmed the mobile layout is now fine and working.
- Keep one shared switcher instance in the dashboard header; do not
  duplicate desktop/mobile switcher instances.

### Existing Account Settings page

The user shared the current `app/setting/page.js`. It is a Server
Component that:

- Authenticates with `getServerSession(authOptions)` and redirects
  unauthenticated users to `/login`.
- Loads the user record from MongoDB.
- Shows Profile Information (name, email, TaskFlow user ID).
- Shows Security & Connected Accounts (Google and GitHub connection
  status).
- Uses `Sidebar` and `Sidebarmob`.

A separate client component was created at
`app/component/settings/WorkspaceSettings.js`. The user reported it
compiled successfully, but then chose the dedicated Workspaces page
approach instead. **Do not integrate this component into Account
Settings.** It can remain unused for now or be removed later after
checking references. Account Settings should stay personal-account
focused.

### Dedicated Workspaces page — current frontend step

The user created the route file:

`app/workspaces/page.js`

The assistant provided an initial client-side listing page. Its current
intended behavior/UI:

- Fetches `GET /api/workspaces` on mount.
- Displays total workspace count.
- Displays the active workspace name.
- Lists workspace cards with name, role, member count, and Default/Custom
  label.
- Highlights the active workspace.
- Includes loading, error, empty, and refresh states.
- Includes a Create Workspace button that is deliberately disabled in
  this first UI-only step.
- Uses `Sidebar` and `Sidebarmob`.
- **Workspace switching from cards is not implemented yet.**
- **Workspace creation from this page is not implemented yet.**
- The user has pasted/saved this code, but has not yet reported whether
  `/workspaces` compiles or whether the page has been tested in the
  browser. Do not claim this page is working until the user confirms.

### Immediate next action

Ask the user to run/test the new page at `/workspaces` and share the
result or screenshot. Confirm:

1. The route compiles and loads.
2. The workspace list and roles render correctly.
3. The active workspace is correctly highlighted.
4. The layout works on mobile.

Only after this UI is confirmed should the next step be to implement
switching directly from each workspace card using the existing active
workspace API. Then implement workspace creation from this page.

### Next frontend sequence

1. Verify `/workspaces` listing UI.
2. Add card-based workspace switching and refresh active state after a
   successful switch.
3. Add workspace creation with validation and loading/error states.
4. Build `/workspaces/[workspaceId]` overview/details.
5. Build Members management.
6. Build Invitations management (sent and received).
7. Build workspace settings (rename) and Danger Zone (delete), respecting
   existing API permission and deletion restrictions.
8. Add Workspaces to desktop and mobile sidebar navigation.
9. Remove any unused WorkspaceSettings component only after checking
   imports/references.

### User workflow and preferences reaffirmed

- User works in `/workspaces/TaskFlow` using GitHub Codespaces.
- Use `main` only; no feature branches.
- User makes code changes. Give exact file paths and code; do not modify
  the repository or push code on the user's behalf.
- Proceed one step at a time and wait for build/test output before
  advancing.
- Explain important reasoning without overwhelming the user.
- Prefer relative imports.
- Do not claim the `/workspaces` page compiles or works until confirmed.

------------------------------------------------------------------------


------------------------------------------------------------------------

## 15. Latest progress update — 18 November 2026

**This section supersedes earlier invitation/frontend sequencing wherever
it conflicts.** The user has now completed and tested the workspace
invitation frontend.

### Subscription and workspace ownership limits

The agreed subscription model:

- Free users may own up to 4 workspaces.
- Pro users may own unlimited workspaces.
- Joining another user's workspace does not consume the joining user's
  owned-workspace allowance.
- The default workspace counts as one owned workspace.
- A Free user can therefore create 3 additional workspaces beyond the
  default.
- Transferring ownership should free one owned-workspace slot for the old
  owner and consume one for the new owner.
- Real billing integration will be added later. Pro access must only be
  granted from verified billing/webhook logic, never from client input.
- Keep `users.subscription` for the account subscription and
  `workspaces.plan` separate.
- Registration now stores:
  `subscription: { plan: "free", status: "active", createdAt: now }`.
- `getUserPlan(user)` should treat a user as Pro only when subscription
  plan is `"pro"` AND subscription status is `"active"`.

`lib/workspace.js` now includes the plan-limit helpers:

- `PLAN_LIMITS`
- `getUserPlan(user)`
- `getUserPlanLimits(user)`
- `ensureOwnedWorkspaceCount(db, userId)`
- `reserveOwnedWorkspaceSlot(db, userId)`
- `releaseOwnedWorkspaceSlot(db, userId)`

The user updated `app/api/workspaces/route.js` to reserve an owned
workspace slot before creation, return `403` with
`WORKSPACE_LIMIT_REACHED` when the Free limit is reached, and roll back
the reservation if creation fails. The user reported the registration
subscription change was done. Re-run build/tests if these helpers are
changed later.

### Workspace deletion

The user updated the workspace deletion API and most recently confirmed:
**"yes deletion works"**.

Do not assume the old project-deletion guard is fully reliable for
workspace-aware projects until project schemas/APIs are migrated and
inspected. Older project/task APIs are not yet properly workspace-aware.

### Invitation backend

The invitation helper file `lib/invitations.js` was read and reviewed.
It includes:

- `INVITATION_EXPIRY_DAYS = 7`
- `FREE_WORKSPACE_MEMBER_LIMIT = 4`
- `InvitationError`
- `expireWorkspaceInvitations(db, workspaceId, session = null)`
- `expireUserInvitations(db, userId, session = null)`
- `createWorkspaceInvitation(...)`
- `getWorkspaceInvitations(db, workspaceId)`
- `getUserInvitations(db, userId)`
- `acceptWorkspaceInvitation(...)`
- `declineWorkspaceInvitation(...)`
- `revokeWorkspaceInvitation(...)`

Important behavior:

- Existing TaskFlow accounts only; no email invitations or external
  invitation links.
- Workspace owner can invite admins or members.
- Workspace admin can invite members only.
- Regular members cannot invite.
- Pending invitations expire after 7 days.
- Pending invitations reserve a workspace seat.
- Free workspace capacity is 4 members including the owner.
- Creation and acceptance use MongoDB transactions and update
  `seatVersion` to serialize seat operations.
- `getUserInvitations()` returns received invitations with
  `workspaceName` and `inviterUsername`.
- Revoke permissions: owner can revoke any pending invitation; admin can
  revoke member invitations only.

### Invitation API routes currently implemented

- `GET/POST /api/invitations?workspaceId=...`
  - GET lists sent invitations for a workspace (owner/admin only).
  - POST sends an invitation with `{ invitedUserId, role }`.
- `GET /api/invitations/received`
  - Lists invitations received by the logged-in user.
- `POST /api/invitations/[invitationId]/accept`
- `POST /api/invitations/[invitationId]/decline`
- `POST /api/invitations/[invitationId]/revoke?workspaceId=...`
- `GET /api/workspaces/[workspaceId]/users/search?q=username`
  - Searches existing TaskFlow users and excludes the current user,
    existing workspace members, and users with a pending invitation.

The exact route files and helper imports should be inspected before
changing endpoints. Do not casually change the API URLs: the frontend
currently uses these contracts.

### Dashboard invitation notifications — completed and tested

The user updated the existing dashboard client file (filename in their
project was previously described as `dashbpardclient`; preserve the
actual project filename rather than renaming it without permission).

Changes added:

- React imports now include `useEffect`; `Link` is imported from
  `next/link`.
- State for `receivedInvitations` and `invitationLoading`.
- Derived `pendingInvitations` and `pendingInvitationCount`.
- A `useEffect` fetches `/api/invitations/received`.
- The dashboard bell displays a pending-invitation count badge.
- The dropdown shows loading, empty, or up to three pending invitations,
  including inviter username and workspace name.
- A link opens `/invitations`.

The user explicitly confirmed: **"okay its working"**.

### Dedicated received-invitations page — completed and reported done

The user created:

`app/invitations/page.js`

The page is a Client Component and includes:

- Fetching `/api/invitations/received`.
- Pending invitation cards with workspace name, inviter username, role,
  and expiry date.
- Accept action via
  `POST /api/invitations/[invitationId]/accept`.
- Decline action via
  `POST /api/invitations/[invitationId]/decline`.
- Previous invitation statuses.
- Refresh, loading, and error states.
- Link back to `/dashboard`.

The user said **"ok done"** after adding this page. The user has not
provided a separate build log in this latest sequence, so do not claim a
fresh production build was run unless confirmed.

### Workspace details page — invitation sending frontend completed and tested

The user uploaded their complete current file:

`app/workspaces/[workspaceId]/page.js`

The file already contained a full Invitations tab. We reviewed it and
confirmed the implementation includes:

- Workspace navigation tabs: Overview, Members, Invitations, Settings.
- Workspace role checks (`owner`, `admin`, `member`).
- Username search using
  `/api/workspaces/${workspaceId}/users/search?q=...`.
- Invitation role selection.
  - Owner can select Admin or Member.
  - Admin can select Member only.
- Sending invitations with:
  `POST /api/invitations?workspaceId=...`
  and JSON body `{ invitedUserId, role }`.
- Refreshing the sent invitation list after sending.
- Sent invitation list with invited username, role, created date,
  expiry date, and status.
- Revoke action using:
  `POST /api/invitations/[invitationId]/revoke?workspaceId=...`.
- Owner/admin permission gating.
- Owner-only member role changes and workspace rename/delete controls
  elsewhere on the page.

The user confirmed: **"ok ity s working"** (the invitation frontend is
working). No replacement of this file is needed; preserve the existing
implementation unless a specific bug is reported.

### Current frontend status summary

| Feature | Status |
|---|---|
| Workspace list/create/switch | User previously confirmed working |
| Workspace details/overview | User previously confirmed working |
| Workspace members UI | Present in workspace details page |
| Send invitation UI | Implemented and user confirmed working |
| Sent invitations list | Implemented in workspace details page |
| Revoke invitation UI | Implemented in workspace details page |
| Dashboard invitation badge/dropdown | User confirmed working |
| Received invitations page | Added; user said done |
| Accept/decline controls | Present on received invitations page |
| Fresh full production build after latest UI changes | Not confirmed |

### Important implementation note from uploaded workspace details file

The uploaded `app/workspaces/[workspaceId]/page.js` uses relative imports:

- `../../component/Sidebar`
- `../../component/Sidebarmob`

It imports Lucide icons, including `UserPlus`, `Search`, `Send`, `Mail`,
and others. Keep the existing relative-import convention. The user does
not want code rewritten unnecessarily; they prefer step-by-step updates
and complete copyable code when a full replacement is requested.

### Next recommended action

The workspace invitation UI flow is now implemented. Before moving on:

1. Test the complete invitation lifecycle with two test accounts:
   - Owner sends invitation.
   - Recipient sees dashboard badge.
   - Recipient opens `/invitations`.
   - Recipient accepts or declines.
   - Owner sees updated sent-invitation status.
   - Owner/admin revokes a still-pending invitation.
2. Verify accepted invitation membership by logging in as the recipient
   and checking `GET /api/workspaces/[workspaceId]` returns the expected
   role and member count.
3. Run `npm run build` and fix any errors.
4. Then return to workspace/project integration:
   - Inspect current project/task APIs and schemas.
   - Agree on workspace association before migrating projects/tasks.
   - Ensure all project/task reads and writes enforce workspace membership
     and prevent cross-workspace data access.
   - Revisit workspace deletion safety after project migration.

Do not claim any lifecycle step or build passed until the user confirms
it. Continue working on `main` only, one step at a time.

------------------------------------------------------------------------
