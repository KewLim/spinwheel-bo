const express = require('express');
const router = express.Router();
const Angpau = require('../models/Angpau');
const AngpauConfig = require('../models/AngpauConfig');
const GameSession = require('../models/GameSession');
const authMiddleware = require('../middleware/auth');

// Get angpau game configuration
router.get('/config', async (req, res) => {
    try {
        const config = await AngpauConfig.findOne({});
        if (!config) {
            // Return default configuration for 10 cards
            return res.json({
                cardConfigs: [
                    { amount: '₹8', probability: 0 },
                    { amount: '₹50', probability: 0 },
                    { amount: '₹100', probability: 0 },
                    { amount: '₹300', probability: 0 },
                    { amount: '₹1000', probability: 0 },
                    { amount: '₹3000', probability: 0 },
                    { amount: '₹800', probability: 0 },
                    { amount: '₹5000', probability: 0 },
                    { amount: '₹2000', probability: 0 },
                    { amount: '₹1500', probability: 0 }
                ]
            });
        }
        res.json(config);
    } catch (error) {
        console.error('Error fetching angpau config:', error);
        res.status(500).json({ error: 'Failed to fetch angpau configuration' });
    }
});

// Save angpau game configuration (admin only)
router.post('/config', authMiddleware, async (req, res) => {
    try {
        const { cardConfigs } = req.body;

        if (!cardConfigs || !Array.isArray(cardConfigs) || cardConfigs.length !== 10) {
            return res.status(400).json({ error: 'Card configs must be an array of 10 items' });
        }

        // Validate each card config
        for (let i = 0; i < cardConfigs.length; i++) {
            const card = cardConfigs[i];
            if (!card.amount || typeof card.probability !== 'number') {
                return res.status(400).json({ error: `Card ${i + 1} must have amount and probability` });
            }
        }

        // Find existing config or create new one
        let config = await AngpauConfig.findOne({});

        if (config) {
            // Update existing
            config.cardConfigs = cardConfigs;
            await config.save();
        } else {
            // Create new
            config = new AngpauConfig({
                cardConfigs
            });
            await config.save();
        }

        res.json({
            message: 'Angpau configuration saved successfully',
            config
        });
    } catch (error) {
        console.error('Error saving angpau config:', error);
        res.status(500).json({ error: 'Failed to save angpau configuration' });
    }
});

// Get all angpau items
router.get('/', authMiddleware, async (req, res) => {
    try {
        const angpaus = await Angpau.find({}, { sort: { created_at: -1 } });
        res.json(angpaus);
    } catch (error) {
        console.error('Error fetching angpau items:', error);
        res.status(500).json({ error: 'Failed to fetch angpau items' });
    }
});

// Get active angpau items (public endpoint for frontend)
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        const angpaus = await Angpau.find({
            status: 'active',
            expiryDate: { $gt: now }
        }, { sort: { created_at: -1 } });
        res.json(angpaus);
    } catch (error) {
        console.error('Error fetching active angpau items:', error);
        res.status(500).json({ error: 'Failed to fetch active angpau items' });
    }
});

// Get single angpau by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const angpau = await Angpau.findById(req.params.id);
        if (!angpau) {
            return res.status(404).json({ error: 'Angpau not found' });
        }
        res.json(angpau);
    } catch (error) {
        console.error('Error fetching angpau:', error);
        res.status(500).json({ error: 'Failed to fetch angpau' });
    }
});

// Create new angpau
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, amount, description, code, expiryDate, status } = req.body;

        if (!title || !amount) {
            return res.status(400).json({ error: 'Title and amount are required' });
        }

        const angpau = new Angpau({
            title,
            amount,
            description,
            code,
            expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
            status: status || 'active'
        });

        await angpau.save();

        res.status(201).json({
            message: 'Angpau created successfully',
            angpau
        });
    } catch (error) {
        console.error('Error creating angpau:', error);
        res.status(500).json({ error: 'Failed to create angpau' });
    }
});

// Update angpau
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, amount, description, code, expiryDate, status } = req.body;

        const angpau = await Angpau.findById(req.params.id);
        if (!angpau) {
            return res.status(404).json({ error: 'Angpau not found' });
        }

        // Update fields
        if (title !== undefined) angpau.title = title;
        if (amount !== undefined) angpau.amount = amount;
        if (description !== undefined) angpau.description = description;
        if (code !== undefined) angpau.code = code;
        if (expiryDate !== undefined) angpau.expiryDate = expiryDate;
        if (status !== undefined) angpau.status = status;

        await angpau.save();

        res.json({
            message: 'Angpau updated successfully',
            angpau
        });
    } catch (error) {
        console.error('Error updating angpau:', error);
        res.status(500).json({ error: 'Failed to update angpau' });
    }
});

// Delete angpau
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Angpau.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Angpau not found' });
        }

        res.json({ message: 'Angpau deleted successfully' });
    } catch (error) {
        console.error('Error deleting angpau:', error);
        res.status(500).json({ error: 'Failed to delete angpau' });
    }
});

// Generate unique game link
router.post('/generate-link', authMiddleware, async (req, res) => {
    try {
        const { cardConfigs } = req.body;

        if (!cardConfigs || !Array.isArray(cardConfigs) || cardConfigs.length !== 10) {
            return res.status(400).json({ error: 'Card configs must be an array of 10 items' });
        }

        // Validate each card config
        for (let i = 0; i < cardConfigs.length; i++) {
            const card = cardConfigs[i];
            if (!card.amount || typeof card.probability !== 'number') {
                return res.status(400).json({ error: `Card ${i + 1} must have amount and probability` });
            }
        }

        // Create new game session
        const session = new GameSession({
            cardConfigs,
            createdBy: 'admin'
        });

        await session.save();

        res.json({
            message: 'Game link generated successfully',
            sessionId: session.sessionId,
            cardConfigs: session.cardConfigs,
            createdAt: session.createdAt,
            url: `/angpau?session=${session.sessionId}`
        });
    } catch (error) {
        console.error('Error generating game link:', error);
        res.status(500).json({ error: 'Failed to generate game link' });
    }
});

// Get all game sessions
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const sessions = await GameSession.find({}, { sort: { created_at: -1 } });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching game sessions:', error);
        res.status(500).json({ error: 'Failed to fetch game sessions' });
    }
});

// Get session config by session ID (public - for game page)
router.get('/session/:sessionId', async (req, res) => {
    try {
        const session = await GameSession.findBySessionId(req.params.sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!session.isActive) {
            return res.status(410).json({ error: 'Session is no longer active' });
        }

        // Check if session has already been played
        if (session.playCount > 0) {
            return res.status(403).json({ 
                error: 'Session already played',
                message: 'You already played\nPlease contact us for new link',
                alreadyPlayed: true
            });
        }

        // Increment play count (this will make it 1, preventing future plays)
        await session.incrementPlayCount();

        res.json({
            cardConfigs: session.cardConfigs
        });
    } catch (error) {
        console.error('Error fetching session config:', error);
        res.status(500).json({ error: 'Failed to fetch session configuration' });
    }
});

module.exports = router;
