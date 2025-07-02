import { VercelRequest, VercelResponse } from '@vercel/node';
import { KVService } from '../../lib/kv';
import { generateGroupId, generateUserId, isValidGroupId } from '../../lib/groupUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, name, emoji } = req.body;

    // Validate input
    if (!name || !emoji) {
      return res.status(400).json({ error: 'Name and emoji are required' });
    }

    let finalGroupId = groupId;

    // If no groupId provided, create a new group
    if (!finalGroupId) {
      finalGroupId = generateGroupId();
      await KVService.createGroup(finalGroupId);
    } else {
      // Validate existing group ID
      if (!isValidGroupId(finalGroupId)) {
        return res.status(400).json({ error: 'Invalid group ID format' });
      }

      // Check if group exists, create if it doesn't
      let group = await KVService.getGroup(finalGroupId);
      if (!group) {
        await KVService.createGroup(finalGroupId);
      }
    }

    // Generate user ID
    const userId = generateUserId();

    return res.status(200).json({
      success: true,
      groupId: finalGroupId,
      userId,
      message: groupId ? 'Joined existing group' : 'Created new group'
    });

  } catch (error) {
    console.error('Error in join endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
