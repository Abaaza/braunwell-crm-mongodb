"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Project_1 = __importDefault(require("../models/Project"));
const Task_1 = __importDefault(require("../models/Task"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const projects = await Project_1.default.find({ createdBy: req.user?.id })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(projects);
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const project = await Project_1.default.findOne({
            _id: req.params.id,
            createdBy: req.user?.id
        }).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
router.post('/', async (req, res) => {
    try {
        const project = new Project_1.default({
            ...req.body,
            createdBy: req.user?.id,
        });
        await project.save();
        await project.populate('createdBy', 'name email');
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const project = await Project_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { ...req.body, updatedAt: new Date() }, { new: true }).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project_1.default.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user?.id,
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await Task_1.default.deleteMany({ projectId: req.params.id });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
router.post('/:id/archive', async (req, res) => {
    try {
        const project = await Project_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, {
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: req.user?.id,
        }, { new: true }).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ error: 'Failed to archive project' });
    }
});
router.post('/:id/unarchive', async (req, res) => {
    try {
        const project = await Project_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, {
            isArchived: false,
            archivedAt: undefined,
            archivedBy: undefined,
        }, { new: true }).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Unarchive project error:', error);
        res.status(500).json({ error: 'Failed to unarchive project' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map