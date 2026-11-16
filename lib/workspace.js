
import { ObjectId } from "mongodb";

// Create indexes required by the workspace and invitation systems.
export async function ensureWorkspaceIndexes(db) {
  const workspaces = db.collection("workspaces");
  const workspaceMembers = db.collection("workspaceMembers");
  const invitations = db.collection("invitations");

  // One default workspace per owner.
  await workspaces.createIndex(
    { ownerId: 1 },
    {
      unique: true,
      partialFilterExpression: { isDefault: true },
      name: "unique_default_workspace_per_owner",
    }
  );

  // A user can only join a workspace once.
  await workspaceMembers.createIndex(
    { workspaceId: 1, userId: 1 },
    {
      unique: true,
      name: "unique_workspace_membership",
    }
  );

  await workspaceMembers.createIndex(
    { userId: 1, joinedAt: 1 }
  );

  await workspaceMembers.createIndex(
    { workspaceId: 1, role: 1 }
  );

  // INVITATION INDEXES

  // Only one pending invitation per user per workspace.
  await invitations.createIndex(
    {
      workspaceId: 1,
      invitedUserId: 1,
    },
    {
      unique: true,
      partialFilterExpression: {
        status: "pending",
      },
      name: "unique_pending_workspace_invitation",
    }
  );

  // Retrieve invitations received by a user.
  await invitations.createIndex(
    {
      invitedUserId: 1,
      status: 1,
      createdAt: -1,
    },
    {
      name: "user_received_invitations",
    }
  );

  // Retrieve invitations sent within a workspace.
  await invitations.createIndex(
    {
      workspaceId: 1,
      status: 1,
      createdAt: -1,
    },
    {
      name: "workspace_sent_invitations",
    }
  );

  // Find invitations that have expired.
  await invitations.createIndex(
    {
      status: 1,
      expiresAt: 1,
    },
    {
      name: "invitation_expiration",
    }
  );
}

// Create a workspace and its owner membership.
export async function createWorkspace({
  db,
  user,
  name,
  isDefault = false,
}) {
  if (!user?._id || !ObjectId.isValid(user._id)) {
    throw new Error("A valid user is required.");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Workspace name is required.");
  }

  const userId = new ObjectId(user._id);
  const now = new Date();

  const workspace = {
    name: name.trim(),
    ownerId: userId,
    plan: "free",
    isDefault,
    createdAt: now,
    updatedAt: now,
  };

  const workspaceResult = await db
    .collection("workspaces")
    .insertOne(workspace);

  const membership = {
    workspaceId: workspaceResult.insertedId,
    userId,
    name: user.name || user.username || "Workspace owner",
    email: user.email || "",
    role: "owner",
    joinedAt: now,
  };

  try {
    await db.collection("workspaceMembers").insertOne(membership);
  } catch (error) {
    // Roll back workspace creation if membership creation fails.
    await db.collection("workspaces").deleteOne({
      _id: workspaceResult.insertedId,
    });

    throw error;
  }

  return {
    ...workspace,
    _id: workspaceResult.insertedId,
    memberCount: 1,
    role: "owner",
  };
}

// Ensure every user has one default workspace.
export async function ensureDefaultWorkspace(db, userId) {
  if (!userId || !ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  const userObjectId = new ObjectId(userId);

  const users = db.collection("users");
  const workspaces = db.collection("workspaces");
  const workspaceMembers = db.collection("workspaceMembers");

  const user = await users.findOne({
    _id: userObjectId,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Find the existing default workspace.
  let defaultWorkspace = await workspaces.findOne({
    ownerId: userObjectId,
    isDefault: true,
  });

  // Create a default workspace if one doesn't exist.
  if (!defaultWorkspace) {
    const workspaceName = user.username
      ? `${user.username}'s Workspace`
      : user.name
        ? `${user.name}'s Workspace`
        : "My Workspace";

    try {
      const createdWorkspace = await createWorkspace({
        db,
        user,
        name: workspaceName,
        isDefault: true,
      });

      defaultWorkspace = createdWorkspace;
    } catch (error) {
      // Another request may have created it simultaneously.
      defaultWorkspace = await workspaces.findOne({
        ownerId: userObjectId,
        isDefault: true,
      });

      if (!defaultWorkspace) {
        throw error;
      }
    }
  }

  // Always ensure the owner membership exists.
  await workspaceMembers.updateOne(
    {
      workspaceId: defaultWorkspace._id,
      userId: userObjectId,
    },
    {
      $set: {
        name: user.name || user.username || "Workspace owner",
        email: user.email || "",
        role: "owner",
      },
      $setOnInsert: {
        joinedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Check whether the currently selected workspace is accessible.
  let activeWorkspace = null;

  if (
    user.activeWorkspaceId &&
    ObjectId.isValid(user.activeWorkspaceId)
  ) {
    const activeWorkspaceId = new ObjectId(
      user.activeWorkspaceId
    );

    const activeMembership = await workspaceMembers.findOne({
      workspaceId: activeWorkspaceId,
      userId: userObjectId,
    });

    if (activeMembership) {
      activeWorkspace = await workspaces.findOne({
        _id: activeWorkspaceId,
      });
    }
  }

  // Save default and active workspace IDs.
  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        defaultWorkspaceId: defaultWorkspace._id,
        activeWorkspaceId:
          activeWorkspace?._id || defaultWorkspace._id,
      },
    }
  );

  return defaultWorkspace;
}

// Retrieve all workspaces accessible to a user.
export async function getUserWorkspaces(db, userId) {
  if (!userId || !ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  const userObjectId = new ObjectId(userId);

  const memberships = await db
    .collection("workspaceMembers")
    .find({ userId: userObjectId })
    .sort({ joinedAt: 1 })
    .toArray();

  if (memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map(
    (membership) => membership.workspaceId
  );

  const workspaces = await db
    .collection("workspaces")
    .find({
      _id: { $in: workspaceIds },
    })
    .sort({ createdAt: -1 })
    .toArray();

  return workspaces.map((workspace) => {
    const membership = memberships.find(
      (item) =>
        item.workspaceId.toString() === workspace._id.toString()
    );

    return {
      ...workspace,
      role: membership?.role || null,
    };
  });
}
