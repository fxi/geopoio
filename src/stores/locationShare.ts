import { writable } from 'svelte/store';
import type { LocationShareState } from '../types';

export const locationShareStore = writable<LocationShareState>({
  isActive: false,
  groupId: null,
  userId: null,
  userName: '',
  userEmoji: '📍',
  members: []
});

export const locationShareHelpers = {
  startSharing: (groupId: string, userId: string, userName: string, userEmoji: string) => {
    locationShareStore.update(state => ({
      ...state,
      isActive: true,
      groupId,
      userId,
      userName,
      userEmoji
    }));
  },
  
  stopSharing: () => {
    locationShareStore.update(state => ({
      ...state,
      isActive: false,
      groupId: null,
      userId: null,
      members: []
    }));
  },
  
  updateMembers: (members: any[]) => {
    locationShareStore.update(state => ({
      ...state,
      members
    }));
  }
};
