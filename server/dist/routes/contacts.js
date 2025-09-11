"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Contact_1 = __importDefault(require("../models/Contact"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const { search, company, tags } = req.query;
        const filter = { createdBy: req.user?.id };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }
        if (company) {
            filter.company = { $regex: company, $options: 'i' };
        }
        if (tags) {
            filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
        }
        const contacts = await Contact_1.default.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(contacts);
    }
    catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const contact = await Contact_1.default.findOne({
            _id: req.params.id,
            createdBy: req.user?.id,
        }).populate('createdBy', 'name email');
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});
router.post('/', async (req, res) => {
    try {
        const contact = new Contact_1.default({
            ...req.body,
            createdBy: req.user?.id,
        });
        await contact.save();
        await contact.populate('createdBy', 'name email');
        res.status(201).json(contact);
    }
    catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const contact = await Contact_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { ...req.body, updatedAt: new Date() }, { new: true }).populate('createdBy', 'name email');
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact_1.default.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user?.id,
        });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});
router.post('/:id/tags', async (req, res) => {
    try {
        const { tags } = req.body;
        const contact = await Contact_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { $addToSet: { tags: { $each: tags } } }, { new: true }).populate('createdBy', 'name email');
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Add tags error:', error);
        res.status(500).json({ error: 'Failed to add tags' });
    }
});
router.delete('/:id/tags/:tag', async (req, res) => {
    try {
        const contact = await Contact_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { $pull: { tags: req.params.tag } }, { new: true }).populate('createdBy', 'name email');
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Remove tag error:', error);
        res.status(500).json({ error: 'Failed to remove tag' });
    }
});
exports.default = router;
//# sourceMappingURL=contacts.js.map