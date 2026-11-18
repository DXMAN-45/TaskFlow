
import { ObjectId } from "mongodb";

const INVITATION_EXPIRY_DAYS = 7;
const FREE_WORKSPACE_MEMBER_LIMIT = 4;

// Custom error for invitation operations.
export class InvitationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "InvitationError";
    this.status = status;
  }
}

// Validate and convert an ID into ObjectId.
function toObjectId(id, fieldName) {
  if (
    typeof id !== "string" ||
    !ObjectId.isValid(id)
  ) {
    throw new InvitationError(`Invalid ${fieldName}.`, 400);
  }

  return new ObjectId(id);
}

// Get the member limit for a workspace plan.
function getWorkspaceMemberLimit(plan) {
  // All currently implemented workspaces use the free plan.
  if (plan === "free") {
    return FREE_WORKSPACE_MEMBER_LIMIT;
  }

  // Unknown plans must not accidentally receive unlimited seats.
  return FREE_WORKSPACE_MEMBER_LIMIT;
}

// Mark expired workspace invitations.
export async function expireWorkspaceInvitations(
  db,
  workspaceId,
  session = null
) {
  const workspaceObjectId =
    workspaceId instanceof ObjectId
      ? workspaceId
      : toObjectId(workspaceId, "workspace ID");

  const now = new Date();

  return db.collection("invitations").updateMany(
    {
      workspaceId: workspaceObjectId,
      status: "pending",
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: "expired",
      },
    },
    session ? { session } : {}
  );
}

// Mark expired invitations received by a user.
export async function expireUserInvitations(
  db,
  userId,
  session = null
) {
  const userObjectId =
    userId instanceof ObjectId
      ? userId
      : toObjectId(userId, "user ID");

  const now = new Date();

  return db.collection("invitations").updateMany(
    {
      invitedUserId: userObjectId,
      status: "pending",
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: "expired",
      },
    },
    session ? { session } : {}
  );
}

// Create an invitation for an existing TaskFlow user.
export async function createWorkspaceInvitation({
  client,
  db,
  workspaceId,
  inviterId,
  invitedUserId,
  role,
}) {
  const workspaceObjectId = toObjectId(
    workspaceId,
    "workspace ID"
  );

  const inviterObjectId = toObjectId(
    inviterId,
    "inviter ID"
  );

  const invitedUserObjectId = toObjectId(
    invitedUserId,
    "invited user ID"
  );

  if (!["admin", "member"].includes(role)) {
    throw new InvitationError(
      "Invitation role must be admin or member.",
      400
    );
  }

  if (inviterObjectId.equals(invitedUserObjectId)) {
    throw new InvitationError(
      "You cannot invite yourself.",
      400
    );
  }

  const session = client.startSession();

  let createdInvitation = null;

  try {
    await session.withTransaction(async () => {
      const workspaces = db.collection("workspaces");
      const workspaceMembers =
        db.collection("workspaceMembers");
      const invitations = db.collection("invitations");
      const users = db.collection("users");

      // Serialize seat-reservation operations for this workspace.
      // Concurrent transactions writing this document will conflict
      // and MongoDB will retry the transaction.
      const lockResult = await workspaces.updateOne(
        { _id: workspaceObjectId },
        {
          $inc: {
            seatVersion: 1,
          },
        },
        { session }
      );

      if (lockResult.matchedCount === 0) {
        throw new InvitationError(
          "Workspace not found.",
          404
        );
      }

      const workspace = await workspaces.findOne(
        { _id: workspaceObjectId },
        { session }
      );

      // Verify the inviter's workspace membership.
      const inviterMembership =
        await workspaceMembers.findOne(
          {
            workspaceId: workspaceObjectId,
            userId: inviterObjectId,
          },
          { session }
        );

      if (!inviterMembership) {
        throw new InvitationError(
          "You do not have access to this workspace.",
          403
        );
      }

      // Owner can invite admins and members.
      // Admin can invite members only.
      const canInvite =
        inviterMembership.role === "owner" ||
        (
          inviterMembership.role === "admin" &&
          role === "member"
        );

      if (!canInvite) {
        throw new InvitationError(
          "You do not have permission to send this invitation.",
          403
        );
      }

      // Verify the recipient is an existing TaskFlow user.
      const invitedUser = await users.findOne(
        {
          _id: invitedUserObjectId,
        },
        {
          session,
          projection: {
            _id: 1,
            username: 1,
            name: 1,
          },
        }
      );

      if (!invitedUser) {
        throw new InvitationError(
          "TaskFlow user not found.",
          404
        );
      }

      // A workspace member cannot be invited again.
      const existingMembership =
        await workspaceMembers.findOne(
          {
            workspaceId: workspaceObjectId,
            userId: invitedUserObjectId,
          },
          { session }
        );

      if (existingMembership) {
        throw new InvitationError(
          "This user is already a workspace member.",
          409
        );
      }

      // Expire old invitations before checking duplicates and seats.
      const now = new Date();

      await expireWorkspaceInvitations(
        db,
        workspaceObjectId,
        session
      );

      const existingInvitation =
        await invitations.findOne(
          {
            workspaceId: workspaceObjectId,
            invitedUserId: invitedUserObjectId,
            status: "pending",
          },
          { session }
        );

      if (existingInvitation) {
        throw new InvitationError(
          "This user already has a pending invitation.",
          409
        );
      }

      // Count current members and pending seat reservations.
      const memberCount =
        await workspaceMembers.countDocuments(
          {
            workspaceId: workspaceObjectId,
          },
          { session }
        );

      const pendingInvitationCount =
        await invitations.countDocuments(
          {
            workspaceId: workspaceObjectId,
            status: "pending",
            expiresAt: { $gt: now },
          },
          { session }
        );

      const memberLimit = getWorkspaceMemberLimit(
        workspace.plan
      );

      if (
        memberCount + pendingInvitationCount >= memberLimit
      ) {
        throw new InvitationError(
          `Workspace member limit reached. Your plan allows ${memberLimit} members, including the owner.`,
          409
        );
      }

      const expiresAt = new Date(
        now.getTime() +
          INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );

      const invitation = {
        workspaceId: workspaceObjectId,
        invitedUserId: invitedUserObjectId,
        invitedBy: inviterObjectId,
        role,
        status: "pending",
        createdAt: now,
        expiresAt,
        respondedAt: null,
      };

      const result = await invitations.insertOne(
        invitation,
        { session }
      );

      createdInvitation = {
        ...invitation,
        _id: result.insertedId,
        invitedUsername: invitedUser.username,
      };
    });

    return createdInvitation;
  } catch (error) {
    if (error.code === 11000) {
      throw new InvitationError(
        "A pending invitation already exists for this user.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

// List invitations sent for a workspace.
export async function getWorkspaceInvitations(
  db,
  workspaceId
) {
  const workspaceObjectId = toObjectId(
    workspaceId,
    "workspace ID"
  );

  await expireWorkspaceInvitations(
    db,
    workspaceObjectId
  );

  return db.collection("invitations")
    .aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "invitedUserId",
          foreignField: "_id",
          as: "invitedUser",
        },
      },
      {
        $unwind: {
          path: "$invitedUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "invitedBy",
          foreignField: "_id",
          as: "inviter",
        },
      },
      {
        $unwind: {
          path: "$inviter",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          workspaceId: 1,
          invitedUserId: 1,
          invitedBy: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          expiresAt: 1,
          respondedAt: 1,
          invitedUsername: "$invitedUser.username",
          inviterUsername: "$inviter.username",
        },
      },
    ])
    .toArray();
}

// List invitations received by a user.
export async function getUserInvitations(
  db,
  userId
) {
  const userObjectId = toObjectId(
    userId,
    "user ID"
  );

  await expireUserInvitations(
    db,
    userObjectId
  );

  return db.collection("invitations")
    .aggregate([
      {
        $match: {
          invitedUserId: userObjectId,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "workspaces",
          localField: "workspaceId",
          foreignField: "_id",
          as: "workspace",
        },
      },
      {
        $unwind: {
          path: "$workspace",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "invitedBy",
          foreignField: "_id",
          as: "inviter",
        },
      },
      {
        $unwind: {
          path: "$inviter",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          workspaceId: 1,
          invitedUserId: 1,
          invitedBy: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          expiresAt: 1,
          respondedAt: 1,
          workspaceName: "$workspace.name",
          inviterUsername: "$inviter.username",
        },
      },
    ])
    .toArray();
}



export async function acceptWorkspaceInvitation({
  client,
  db,
  invitationId,
  userId,
}) {
  const invitationObjectId = toObjectId(
    invitationId,
    "invitation ID"
  );

  const userObjectId = toObjectId(
    userId,
    "user ID"
  );

  const session = client.startSession();

  let acceptedInvitation = null;
  let expired = false;

  try {
    await session.withTransaction(async () => {
      const invitations = db.collection("invitations");
      const workspaces = db.collection("workspaces");
      const workspaceMembers = db.collection("workspaceMembers");
      const users = db.collection("users");

      const invitation = await invitations.findOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
        },
        { session }
      );

      if (!invitation) {
        throw new InvitationError(
          "Invitation not found.",
          404
        );
      }

      if (invitation.status !== "pending") {
        throw new InvitationError(
          "This invitation is no longer pending.",
          409
        );
      }

      const now = new Date();

      if (invitation.expiresAt <= now) {
        await invitations.updateOne(
          {
            _id: invitationObjectId,
            status: "pending",
          },
          {
            $set: {
              status: "expired",
            },
          },
          { session }
        );

        expired = true;
        return;
      }

      // Serialize membership and invitation seat operations.
      const lockResult = await workspaces.updateOne(
        { _id: invitation.workspaceId },
        {
          $inc: {
            seatVersion: 1,
          },
        },
        { session }
      );

      if (lockResult.matchedCount === 0) {
        throw new InvitationError(
          "Workspace no longer exists.",
          404
        );
      }

      const workspace = await workspaces.findOne(
        { _id: invitation.workspaceId },
        { session }
      );

      // Expire any other old invitations before checking capacity.
      await expireWorkspaceInvitations(
        db,
        invitation.workspaceId,
        session
      );

      // Confirm the invitation is still pending.
      const currentInvitation = await invitations.findOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
          status: "pending",
          expiresAt: { $gt: now },
        },
        { session }
      );

      if (!currentInvitation) {
        throw new InvitationError(
          "This invitation is no longer available.",
          409
        );
      }

      // Prevent duplicate workspace membership.
      const existingMembership =
        await workspaceMembers.findOne(
          {
            workspaceId: invitation.workspaceId,
            userId: userObjectId,
          },
          { session }
        );

      if (existingMembership) {
        throw new InvitationError(
          "You are already a member of this workspace.",
          409
        );
      }

      const user = await users.findOne(
        { _id: userObjectId },
        {
          session,
          projection: {
            _id: 1,
            username: 1,
            name: 1,
            email: 1,
          },
        }
      );

      if (!user) {
        throw new InvitationError(
          "User account not found.",
          404
        );
      }

      // Pending invitations reserve seats.
      // Accepting changes a reserved seat into an occupied seat.
      const memberCount =
        await workspaceMembers.countDocuments(
          {
            workspaceId: invitation.workspaceId,
          },
          { session }
        );

      const pendingInvitationCount =
        await invitations.countDocuments(
          {
            workspaceId: invitation.workspaceId,
            status: "pending",
            expiresAt: { $gt: now },
          },
          { session }
        );

      const memberLimit = getWorkspaceMemberLimit(
        workspace.plan
      );

      if (
        memberCount + pendingInvitationCount > memberLimit
      ) {
        throw new InvitationError(
          "The workspace has exceeded its member limit. Contact the workspace owner.",
          409
        );
      }

      // Create workspace membership.
      await workspaceMembers.insertOne(
        {
          workspaceId: invitation.workspaceId,
          userId: userObjectId,
          role: invitation.role,
          name: user.name || user.username,
          email: user.email ?? null,
          joinedAt: now,
        },
        { session }
      );

      // Mark the invitation as accepted.
      const updateResult = await invitations.updateOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
          status: "pending",
          expiresAt: { $gt: now },
        },
        {
          $set: {
            status: "accepted",
            respondedAt: now,
          },
        },
        { session }
      );

      if (updateResult.modifiedCount !== 1) {
        throw new InvitationError(
          "Unable to accept this invitation.",
          409
        );
      }

      acceptedInvitation = {
        invitationId: invitationObjectId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        status: "accepted",
      };
    });

    if (expired) {
      throw new InvitationError(
        "This invitation has expired.",
        410
      );
    }

    return acceptedInvitation;
  } finally {
    await session.endSession();
  }
}




export async function declineWorkspaceInvitation({
  client,
  db,
  invitationId,
  userId,
}) {
  const invitationObjectId = toObjectId(
    invitationId,
    "invitation ID"
  );

  const userObjectId = toObjectId(
    userId,
    "user ID"
  );

  const session = client.startSession();

  let declinedInvitation = null;
  let expired = false;

  try {
    await session.withTransaction(async () => {
      // Reset values if MongoDB retries the transaction.
      declinedInvitation = null;
      expired = false;

      const invitations = db.collection("invitations");
      const workspaces = db.collection("workspaces");

      // Verify that this invitation belongs to the user.
      const invitation = await invitations.findOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
        },
        { session }
      );

      if (!invitation) {
        throw new InvitationError(
          "Invitation not found.",
          404
        );
      }

      if (invitation.status !== "pending") {
        throw new InvitationError(
          "This invitation is no longer pending.",
          409
        );
      }

      // Serialize seat-release operations with other
      // workspace invitation and membership operations.
      const lockResult = await workspaces.updateOne(
        { _id: invitation.workspaceId },
        {
          $inc: {
            seatVersion: 1,
          },
        },
        { session }
      );

      if (lockResult.matchedCount === 0) {
        throw new InvitationError(
          "Workspace no longer exists.",
          404
        );
      }

      const now = new Date();

      // Recheck the invitation after acquiring the lock.
      const currentInvitation = await invitations.findOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
          status: "pending",
        },
        { session }
      );

      if (!currentInvitation) {
        throw new InvitationError(
          "This invitation is no longer available.",
          409
        );
      }

      // Expired invitations cannot be declined.
      if (currentInvitation.expiresAt <= now) {
        const updateResult = await invitations.updateOne(
          {
            _id: invitationObjectId,
            invitedUserId: userObjectId,
            status: "pending",
          },
          {
            $set: {
              status: "expired",
            },
          },
          { session }
        );

        if (updateResult.modifiedCount !== 1) {
          throw new InvitationError(
            "Unable to update this invitation.",
            409
          );
        }

        expired = true;
        return;
      }

      // Decline the invitation.
      const updateResult = await invitations.updateOne(
        {
          _id: invitationObjectId,
          invitedUserId: userObjectId,
          status: "pending",
          expiresAt: { $gt: now },
        },
        {
          $set: {
            status: "declined",
            respondedAt: now,
          },
        },
        { session }
      );

      if (updateResult.modifiedCount !== 1) {
        throw new InvitationError(
          "Unable to decline this invitation.",
          409
        );
      }

      declinedInvitation = {
        invitationId: invitationObjectId,
        workspaceId: invitation.workspaceId,
        status: "declined",
        respondedAt: now,
      };
    });

    if (expired) {
      throw new InvitationError(
        "This invitation has expired.",
        410
      );
    }

    return declinedInvitation;
  } finally {
    await session.endSession();
  }
}


export async function revokeWorkspaceInvitation({
  client,
  db,
  workspaceId,
  invitationId,
  userId,
}) {
  const workspaceObjectId = toObjectId(
    workspaceId,
    "workspace ID"
  );

  const invitationObjectId = toObjectId(
    invitationId,
    "invitation ID"
  );

  const userObjectId = toObjectId(
    userId,
    "user ID"
  );

  const session = client.startSession();

  let revokedInvitation = null;
  let expired = false;

  try {
    await session.withTransaction(async () => {
      // Reset values if MongoDB retries the transaction.
      revokedInvitation = null;
      expired = false;

      const workspaces = db.collection("workspaces");
      const workspaceMembers = db.collection("workspaceMembers");
      const invitations = db.collection("invitations");

      // Serialize workspace seat operations.
      const lockResult = await workspaces.updateOne(
        { _id: workspaceObjectId },
        { $inc: { seatVersion: 1 } },
        { session }
      );

      if (lockResult.matchedCount !== 1) {
        throw new InvitationError(
          "Workspace not found.",
          404
        );
      }

      // Verify the person revoking the invitation.
      const membership = await workspaceMembers.findOne(
        {
          workspaceId: workspaceObjectId,
          userId: userObjectId,
        },
        { session }
      );

      if (!membership) {
        throw new InvitationError(
          "You do not have access to this workspace.",
          403
        );
      }

      // Verify invitation belongs to this workspace.
      const invitation = await invitations.findOne(
        {
          _id: invitationObjectId,
          workspaceId: workspaceObjectId,
        },
        { session }
      );

      if (!invitation) {
        throw new InvitationError(
          "Invitation not found.",
          404
        );
      }

      // Owner can revoke any pending invitation.
      // Admin can revoke member invitations only.
      const canRevoke =
        membership.role === "owner" ||
        (
          membership.role === "admin" &&
          invitation.role === "member"
        );

      if (!canRevoke) {
        throw new InvitationError(
          "You do not have permission to revoke this invitation.",
          403
        );
      }

      if (invitation.status !== "pending") {
        throw new InvitationError(
          "This invitation is no longer pending.",
          409
        );
      }

      const now = new Date();

      // Expired invitations should be marked expired,
      // not revoked.
      if (invitation.expiresAt <= now) {
        const updateResult = await invitations.updateOne(
          {
            _id: invitationObjectId,
            workspaceId: workspaceObjectId,
            status: "pending",
          },
          {
            $set: {
              status: "expired",
            },
          },
          { session }
        );

        if (updateResult.modifiedCount !== 1) {
          throw new InvitationError(
            "Unable to update expired invitation.",
            409
          );
        }

        expired = true;
        return;
      }

      // Revoke the pending invitation.
      const updateResult = await invitations.updateOne(
        {
          _id: invitationObjectId,
          workspaceId: workspaceObjectId,
          status: "pending",
          expiresAt: { $gt: now },
        },
        {
          $set: {
            status: "revoked",
            respondedAt: now,
            revokedBy: userObjectId,
          },
        },
        { session }
      );

      if (updateResult.modifiedCount !== 1) {
        throw new InvitationError(
          "Unable to revoke this invitation.",
          409
        );
      }

      revokedInvitation = {
        invitationId: invitationObjectId,
        workspaceId: workspaceObjectId,
        status: "revoked",
        respondedAt: now,
      };
    });

    // Throw only after the transaction commits.
    if (expired) {
      throw new InvitationError(
        "This invitation has expired.",
        410
      );
    }

    return revokedInvitation;
  } finally {
    await session.endSession();
  }
}
