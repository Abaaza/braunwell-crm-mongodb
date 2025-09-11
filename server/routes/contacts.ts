import express from 'express';
import Contact from '../models/Contact';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, company, tags } = req.query;
    const filter: any = { createdBy: req.user?.id };

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

    const contacts = await Contact.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user?.id,
    }).populate('createdBy', 'name email');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const contact = new Contact({
      ...req.body,
      createdBy: req.user?.id,
    });

    await contact.save();
    await contact.populate('createdBy', 'name email');

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user?.id,
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

router.post('/:id/tags', async (req: AuthRequest, res) => {
  try {
    const { tags } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?.id },
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Add tags error:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

router.delete('/:id/tags/:tag', async (req: AuthRequest, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?.id },
      { $pull: { tags: req.params.tag } },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

export default router;