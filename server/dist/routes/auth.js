"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({
            email,
            passwordHash,
            name,
            role: 'user',
        });
        await user.save();
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const session = new Session_1.default({
            userId: user._id,
            token,
            expiresAt,
        });
        await session.save();
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token: jwtToken,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        user.lastLoginAt = new Date();
        await user.save();
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await Session_1.default.deleteMany({ userId: user._id });
        const session = new Session_1.default({
            userId: user._id,
            token,
            expiresAt,
        });
        await session.save();
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            },
            token: jwtToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        await Session_1.default.deleteMany({ userId: req.user?.id });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map