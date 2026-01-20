import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// MOCK USER IDs (Used in the mock collections below)
const CURRENT_USER_ID = '6565f5e4f4a3b2c1d0e9f8a7'; 
const PARTNER_ID_1 = '6565f5e4f4a3b2c1d0e9f8a8';
const PARTNER_ID_2 = '6565f5e4f4a3b2c1d0e9f8a9';

// MOCK DATA COLLECTIONS (In a real app, these would connect to MongoDB)
const mockUsers = [
    { _id: CURRENT_USER_ID, name: 'Current User (Founder)', role: 'Founder' },
    { _id: PARTNER_ID_1, name: 'Alexandra Chen (Ascent)', role: 'Investor' },
    { _id: PARTNER_ID_2, name: 'John Smith (SeedFund)', role: 'Investor' },
];

const mockConnections = [
    // Accepted Connection 1: Current User (Founder) connecting to Partner 1 (Investor)
    { 
        _id: 'deal-xyz', founder_id: CURRENT_USER_ID, investor_id: PARTNER_ID_1, 
        status: 'Accepted', message: 'Just the updated Cap Table if you have it ready.', 
        created_at: new Date(Date.now() - 3600000) 
    },
    // Accepted Connection 2: Partner 2 (Investor) connecting to Current User (Founder)
    { 
        _id: 'deal-abc', founder_id: PARTNER_ID_2, investor_id: CURRENT_USER_ID, 
        status: 'Accepted', message: 'Yes, we are definitely ready to proceed to DD.', 
        created_at: new Date(Date.now() - 7200000) 
    },
    // Pending Connection (Should NOT be returned by default for messaging)
    { 
        _id: 'deal-def', founder_id: CURRENT_USER_ID, investor_id: '6565f5e4f4a3b2c1d0e9f8aa', 
        status: 'Requested', message: 'Initial outreach.', 
        created_at: new Date(Date.now() - 10800000) 
    },
];

/**
 * Reads the JWT from the cookie, verifies it, and returns the userId.
 * NOTE: Mocked to return a fixed user ID for testing context.
 * @returns {Promise<string|null>} The user ID string or null if verification fails.
 */
export async function verifyToken() {
    // In a real environment, this verifies the JWT.
    // For this demonstration, we mock a successful authentication.
    return CURRENT_USER_ID; 
}

/**
 * Mock function to represent getting the MongoDB connections collection.
 */
export async function getConnectionsCollection() {
    return {
        find: (query = {}) => ({
            toArray: async () => {
                let results = mockConnections.filter(conn => 
                    (conn.founder_id === CURRENT_USER_ID || conn.investor_id === CURRENT_USER_ID) &&
                    (!query.status || conn.status === query.status)
                );
                // Simple in-memory sorting
                results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
                return results;
            },
            findOne: async (q) => {
                return mockConnections.find(conn => conn._id === q._id);
            }
        }),
    };
}

/**
 * Mock function to represent getting the MongoDB users collection 
 * (used to look up partner names).
 */
export async function getUsersCollection() {
    return {
        findOne: async (query) => {
            return mockUsers.find(user => user._id === query._id);
        },
    };
}

/**
 * Mock function for the messages collection (used in POST/GET /api/messages)
 */
export async function getMessagesCollection() {
     return {
        insertOne: async (doc) => ({ insertedId: 'mock-msg-id-' + Date.now(), ops: [doc] }),
        find: (query) => ({
            sort: () => ({
                toArray: async () => ([
                    // Mock message 
                    { id: 'msg1', senderId: CURRENT_USER_ID, text: 'This is a mock message from the server.', timestamp: new Date() }
                ])
            })
        })
    };
}