import { VercelRequest, VercelResponse } from '@vercel/node';
import { KVService } from '../../../lib/kv';
import { isValidGroupId } from '../../../lib/groupUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId } = req.query;

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    if (!isValidGroupId(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }

    // Clean up inactive members first
    await KVService.cleanupInactiveMembers(groupId);

    // Get group data
    const group = await KVService.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({
      success: true,
      members: group.members,
      groupId: group.id
    });

  } catch (error) {
    console.error('Error in members endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
