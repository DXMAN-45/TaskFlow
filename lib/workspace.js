
import { ObjectId } from "mongodb";

// Create indexes required by the workspace system.
export async function ensureWorkspaceIndexes(db) {
  const workspaces = db.collection("workspaces");
  const workspaceMembers = db.collection("workspaceMembers");

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

  const user = await users.findOne({
    _id: userObjectId,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const workspaces = db.collection("workspaces");

  // 1. Check the user's saved default workspace ID.
  if (user.defaultWorkspaceId) {
    const savedWorkspace = await workspaces.findOne({
      _id: user.defaultWorkspaceId,
      ownerId: userObjectId,
      isDefault: true,
    });

    if (savedWorkspace) {
      return savedWorkspace;
    }
  }

  // 2. Check whether a default workspace already exists.
  const existingWorkspace = await workspaces.findOne({
    ownerId: userObjectId,
    isDefault: true,
  });

  if (existingWorkspace) {
    await users.updateOne(
      { _id: userObjectId },
      {
        $set: {
          defaultWorkspaceId: existingWorkspace._id,
        },
      }
    );

    // Ensure the owner membership exists.
    await db.collection("workspaceMembers").updateOne(
      {
        workspaceId: existingWorkspace._id,
        userId: userObjectId,
      },
      {
        $setOnInsert: {
          name: user.name || user.username || "Workspace owner",
          email: user.email || "",
          role: "owner",
          joinedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return existingWorkspace;
  }

  // 3. Create a default workspace if none exists.
  const workspaceName = user.username
    ? `${user.username}'s Workspace`
    : user.name
      ? `${user.name}'s Workspace`
      : "My Workspace";

  try {
    const workspace = await createWorkspace({
      db,
      user,
      name: workspaceName,
      isDefault: true,
    });

    // Save the default workspace ID on the user.
    await users.updateOne(
      { _id: userObjectId },
      {
        $set: {
          defaultWorkspaceId: workspace._id,
        },
      }
    );

    return workspace;
  } catch (error) {
    // Handle simultaneous initialization requests.
    // Another request may have created the default workspace first.
    const workspaceCreatedByAnotherRequest = await workspaces.findOne({
      ownerId: userObjectId,
      isDefault: true,
    });

    if (workspaceCreatedByAnotherRequest) {
      await users.updateOne(
        { _id: userObjectId },
        {
          $set: {
            defaultWorkspaceId: workspaceCreatedByAnotherRequest._id,
          },
        }
      );

      return workspaceCreatedByAnotherRequest;
    }

    throw error;
  }
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
