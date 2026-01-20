// Function to handle declining a connection request
async function declineConnection(req, res) {
    const connectionId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'Founder') {
        return res.status(403).json({ message: 'Only Founders can decline connection requests.' });
    }

    try {
        const result = await db.query(`
            UPDATE connections 
            SET status = 'Declined', updated_at = NOW()
            WHERE id = $1 AND founder_id = $2 AND status = 'Requested'
            RETURNING id, status
        `, [connectionId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Connection not found or already processed.' });
        }

        // Optional: Trigger notification service to inform the Investor
        // notifyInvestor(result.rows[0].investor_id, 'Connection Declined.');

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Decline connection error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}