import { NextResponse } from "next/server";
import { getMessagesCollection, getConnectionsCollection } from "@/lib/mongodb"; // Assumed DB utility
import { verifyToken } from "@/lib/authUtils"; // Assumed Auth utility
import { ObjectId } from "mongodb";

/**
 * Utility function to check if the user is authorized for a connection.
 * @param {string} connectionId - The ID of the connection.
 * @param {string} userId - The ID of the currently logged-in user.
 * @returns {Promise<boolean>} - True if authorized, false otherwise.
 */
async function checkConnectionAuthorization(connectionId, userId) {
    try {
        const connections = await getConnectionsCollection();
        
        // 1. Find the connection by ID
        const connection = await connections.findOne({
            _id: new ObjectId(connectionId)
        });

        if (!connection) {
            console.warn(`Connection ID ${connectionId} not found.`);
            return false;
        }

        // 2. Check if the user is a participant (either founder or investor)
        const isParticipant = connection.founder_id.toString() === userId || 
                              connection.investor_id.toString() === userId;
        
        // 3. Check if the status is Accepted (Secure Messaging requirement)
        const isAccepted = connection.status === 'Accepted';

        return isParticipant && isAccepted;
        
    } catch (error) {
        console.error("Authorization check failed:", error);
        return false;
    }
}

// =========================================================================
// POST /api/messages - Send a new message
// =========================================================================
export async function POST(req) {
    // 1. Authentication: Get user ID from JWT token
    const userId = await verifyToken();
    if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { connectionId, text } = await req.json();

        if (!connectionId || !text) {
            return NextResponse.json(
                { success: false, message: "Connection ID and message text are required" },
                { status: 400 }
            );
        }
        
        // 2. Authorization: Check if the connection exists and is Accepted
        const isAuthorized = await checkConnectionAuthorization(connectionId, userId);
        
        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: "Access denied. Connection is not active or user is not a participant." },
                { status: 403 }
            );
        }

        const messages = await getMessagesCollection();

        // 3. Store the message
        const messageDocument = {
            connectionId: new ObjectId(connectionId),
            senderId: new ObjectId(userId),
            text: text,
            timestamp: new Date(),
        };

        const result = await messages.insertOne(messageDocument);

        // Optional: Trigger a Real-Time notification (e.g., via WebSockets/PubSub) here

        return NextResponse.json({
            success: true,
            message: "Message sent",
            data: {
                id: result.insertedId.toString(),
                connectionId: connectionId,
                senderId: userId,
                text: text,
                timestamp: messageDocument.timestamp,
            }
        }, { status: 201 });

    } catch (err) {
        console.error("POST /api/messages error:", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

// =========================================================================
// GET /api/messages/[connectionId] - Retrieve message history
// =========================================================================
export async function GET(req, { params }) {
    // 1. Authentication: Get user ID from JWT token
    const userId = await verifyToken();
    if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Extract connection ID from the URL path parameters
    const connectionId = params.connectionId;
    if (!connectionId) {
        return NextResponse.json({ success: false, message: "Connection ID is required" }, { status: 400 });
    }

    try {
        // 2. Authorization: Check if the connection exists and is Accepted
        const isAuthorized = await checkConnectionAuthorization(connectionId, userId);

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: "Access denied. Connection is not active or user is not a participant." },
                { status: 403 }
            );
        }

        const messages = await getMessagesCollection();
        
        // 3. Fetch messages for the connection, sorted by timestamp
        const messageHistory = await messages.find({
            connectionId: new ObjectId(connectionId)
        })
        .sort({ timestamp: 1 }) // Ascending order
        .toArray();
        
        // Format the output to be clean JSON
        const formattedHistory = messageHistory.map(msg => ({
            id: msg._id.toString(),
            senderId: msg.senderId.toString(),
            text: msg.text,
            timestamp: msg.timestamp,
            connectionId: msg.connectionId.toString(),
            // In a production system, you'd likely JOIN/LOOKUP the sender's name/details here
        }));


        return NextResponse.json({
            success: true,
            data: formattedHistory
        }, { status: 200 });

    } catch (err) {
        console.error("GET /api/messages/[connectionId] error:", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}