# TaskFlow --- Development Handoff / Progress Checkpoint

**Checkpoint date:** 14 November 2026\
**Git branch:** `feature/workspace-foundation`\
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
token/expiry/status.

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

Current branch: `feature/workspace-foundation`.

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

## 9. Exact point where we left off

The assistant had just said:

> Before building the workspace switcher, let's strengthen workspace
> deletion so it cannot leave orphaned records. First inspect the
> current project data structure.

The user has **not yet run** the requested command.

### Immediate next action

Ask the user to run this in Codespaces and paste the output:

``` bash
cat app/api/projects/route.js
```

Inspect the existing project API to understand its current data shape
and permissions before changing deletion behavior.

Do not implement deletion transactions blindly. First determine whether
MongoDB Atlas deployment supports transactions (replica set/sharded
cluster generally required), inspect the project and invitation data
model, and decide a safe deletion strategy. Consider restricting
deletion to empty workspaces and using a transaction if supported, or
carefully ordered guarded writes with recovery strategy.

------------------------------------------------------------------------

## 10. Remaining plan (recommended order)

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

## 11. Working preferences

-   User likes step-by-step guidance and wants to understand what each
    step does.
-   Give complete code when asked for complete code.
-   Avoid asking for code already provided in the conversation.
-   Use relative imports when practical, consistent with user's
    preference.
-   Keep instructions concise and provide exact file paths/commands.
-   User uses GitHub Codespaces and runs commands in
    `/workspaces/TaskFlow`.
-   Do not claim any code was executed or any database state changed
    unless the user reports it or a tool verifies it.
