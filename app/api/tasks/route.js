import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// Create a new task for the logged-in user.
export async function POST(request) {
    try {
        // Check if the user is authenticated before allowing task creation.
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "You must be logged in to create a task" },
                { status: 401 }
            );
        }

        // Read the incoming JSON payload from the client.
        let data;

        try {
            data = await request.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON request body" },
                { status: 400 }
            );
        }

        // Validate the required fields before saving into MongoDB.
        if (typeof data.title !== "string" || data.title.trim() === "") {
            return NextResponse.json({ message: "Title is required" }, { status: 400 });
        }
        if (data.description != null && typeof data.description !== "string") {
            return NextResponse.json({ message: "Description must be a string" }, { status: 400 });
        }

        const title = data.title.trim();
        const description = data.description == null ? "" : data.description.trim();

        // Store the task with the user ID so that each user sees only their own tasks.
        const task = {
            title,
            description,
            completed: false,
            userId: session.user.id,
            createdAt: new Date(),
        };

        const client = await clientPromise;
        const db = client.db("taskflow");
        const collection = db.collection("tasks");
        const result = await collection.insertOne(task);

        return NextResponse.json({ message: "Task created successfully", id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ message: "Error creating task" }, { status: 500 });
    }
}

// Fetch all tasks from the database.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "You must be logged in to view tasks" },
                { status: 401 }
            );
        }
        const client = await clientPromise;
        const db = client.db("taskflow");
        const collection = db.collection("tasks");
        const tasks = await collection.find({ userId: session.user.id }).toArray();
        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
    }
}

// Update an existing task by its MongoDB ObjectId.
export async function PATCH(request) {
    try {

        // Check if the user is authenticated before allowing task creation.
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "You must be logged in to update tasks" },
                { status: 401 }
            );
        }
        let data;

        try {
            data = await request.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON request body" },
                { status: 400 }
            );
        }

        if (!data || typeof data !== "object") {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }

        const { id, title, description, completed } = data;

        // Ensure the ID is a valid MongoDB ObjectId.
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Valid task ID is required" }, { status: 400 });
        }

        // Prevent users from altering protected fields like _id and createdAt.
        if ("_id" in data || "createdAt" in data) {
            return NextResponse.json({ message: "Cannot update _id or createdAt" }, { status: 400 });
        }

        const updateFields = {};

        // Only update the fields that are actually present in the request.
        if (title !== undefined) {
            if (typeof title !== "string" || title.trim() === "") {
                return NextResponse.json({ message: "Title must be a non-empty string" }, { status: 400 });
            }
            updateFields.title = title.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return NextResponse.json({ message: "Description must be a string" }, { status: 400 });
            }
            updateFields.description = description.trim();
        }

        if (completed !== undefined) {
            if (typeof completed !== "boolean") {
                return NextResponse.json({ message: "Completed must be a boolean" }, { status: 400 });
            }
            updateFields.completed = completed;
        }

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ message: "No valid fields provided to update" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("taskflow");
        const collection = db.collection("tasks");

        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: session.user.id },
            { $set: updateFields },
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ message: "Error updating task" }, { status: 500 });
    }
}

// Delete a task by ID.
export async function DELETE(request) {
    try {
        // Check if the user is authenticated before allowing task creation.
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "You must be logged in to delete tasks" },
                { status: 401 }
            );
        }
        let data;

        try {
            data = await request.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON request body" },
                { status: 400 }
            );
        }
        if (!data || typeof data !== "object") {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }

        const { id } = data;

        // Validate the MongoDB ID before deleting the record.
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Valid task ID is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("taskflow");
        const collection = db.collection("tasks");

        const result = await collection.deleteOne({ _id: new ObjectId(id), userId: session.user.id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ message: "Error deleting task" }, { status: 500 });
    }
}



