import { kv } from '@vercel/kv';

export interface GroupMember {
  id: string;
  name: string;
  emoji: string;
  lat: number;
  lon: number;
  lastSeen: number;
}

export interface LocationGroup {
  id: string;
  members: GroupMember[];
  createdAt: number;
}

export class KVService {
  private static getGroupKey(groupId: string): string {
    return `group:${groupId}`;
  }

  static async getGroup(groupId: string): Promise<LocationGroup | null> {
    try {
      const group = await kv.get<LocationGroup>(this.getGroupKey(groupId));
      return group;
    } catch (error) {
      console.error('Error getting group:', error);
      return null;
    }
  }

  static async createGroup(groupId: string): Promise<LocationGroup> {
    const group: LocationGroup = {
      id: groupId,
      members: [],
      createdAt: Date.now()
    };
    
    await kv.set(this.getGroupKey(groupId), group, { ex: 86400 }); // 24h expiry
    return group;
  }

  static async addOrUpdateMember(groupId: string, member: GroupMember): Promise<LocationGroup | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;

    const existingIndex = group.members.findIndex(m => m.id === member.id);
    if (existingIndex >= 0) {
      group.members[existingIndex] = member;
    } else {
      group.members.push(member);
    }

    await kv.set(this.getGroupKey(groupId), group, { ex: 86400 });
    return group;
  }

  static async removeMember(groupId: string, memberId: string): Promise<LocationGroup | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;

    group.members = group.members.filter(m => m.id !== memberId);
    await kv.set(this.getGroupKey(groupId), group, { ex: 86400 });
    return group;
  }

  static async cleanupInactiveMembers(groupId: string, maxAge: number = 30000): Promise<LocationGroup | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;

    const now = Date.now();
    group.members = group.members.filter(m => (now - m.lastSeen) < maxAge);
    
    await kv.set(this.getGroupKey(groupId), group, { ex: 86400 });
    return group;
  }
}
