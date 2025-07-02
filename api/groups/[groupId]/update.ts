import { VercelRequest, VercelResponse } from '@vercel/node';
import { KVService } from '../../../lib/kv';
import { isValidGroupId } from '../../../lib/groupUtils';
import type { GroupMember } from '../../../lib/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId } = req.query;
    const { userId, name, emoji, lat, lon } = req.body;

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    if (!isValidGroupId(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }

    // Validate required fields
    if (!userId || !name || !emoji || lat === undefined || lon === undefined) {
      return res.status(400).json({ 
        error: 'userId, name, emoji, lat, and lon are required' 
      });
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'lat and lon must be numbers' });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Create member object
    const member: GroupMember = {
      id: userId,
      name,
      emoji,
      lat,
      lon,
      lastSeen: Date.now()
    };

    // Update member in group
    const group = await KVService.addOrUpdateMember(groupId, member);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      member
    });

  } catch (error) {
    console.error('Error in update endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
