// Function to handle withdrawing an outgoing request
async function withdrawConnection(req, res) {
    const connectionId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'Investor') {
        return res.status(403).json({ message: 'Only Investors can withdraw requests.' });
    }

    try {
        const result = await db.query(`
            UPDATE connections 
            SET status = 'Withdrawn', updated_at = NOW()
            WHERE id = $1 AND investor_id = $2 AND status = 'Requested'
            RETURNING id, status
        `, [connectionId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Connection not found or already processed.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Withdraw connection error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}