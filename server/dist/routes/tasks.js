"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Task_1 = __importDefault(require("../models/Task"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const { projectId, status, assignedTo } = req.query;
        const filter = { createdBy: req.user?.id };
        if (projectId)
            filter.projectId = projectId;
        if (status)
            filter.status = status;
        if (assignedTo)
            filter.assignedTo = assignedTo;
        const tasks = await Task_1.default.find(filter)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const task = await Task_1.default.findOne({
            _id: req.params.id,
            createdBy: req.user?.id,
        })
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('dependencies')
            .populate('blockedBy');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});
router.post('/', async (req, res) => {
    try {
        const task = new Task_1.default({
            ...req.body,
            createdBy: req.user?.id,
        });
        await task.save();
        await task.populate([
            { path: 'projectId', select: 'name' },
            { path: 'assignedTo', select: 'name email' },
            { path: 'createdBy', select: 'name email' },
        ]);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const task = await Task_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { ...req.body, updatedAt: new Date() }, { new: true })
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task_1.default.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user?.id,
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user?.id }, { status, updatedAt: new Date() }, { new: true })
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map