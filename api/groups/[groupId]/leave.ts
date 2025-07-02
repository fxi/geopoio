import { VercelRequest, VercelResponse } from '@vercel/node';
import { KVService } from '../../../lib/kv';
import { isValidGroupId } from '../../../lib/groupUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId } = req.query;
    const { userId } = req.body;

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    if (!isValidGroupId(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Remove member from group
    const group = await KVService.removeMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Left group successfully'
    });

  } catch (error) {
    console.error('Error in leave endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
