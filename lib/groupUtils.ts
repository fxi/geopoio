const ADJECTIVES = [
  'flying', 'dancing', 'jumping', 'running', 'swimming', 'climbing', 'walking', 'hiking',
  'happy', 'cheerful', 'bright', 'sunny', 'cool', 'awesome', 'amazing', 'fantastic',
  'swift', 'quick', 'fast', 'speedy', 'rapid', 'zippy', 'turbo', 'rocket',
  'brave', 'bold', 'strong', 'mighty', 'powerful', 'fierce', 'wild', 'free',
  'smart', 'clever', 'wise', 'bright', 'sharp', 'quick', 'witty', 'genius'
];

const ANIMALS = [
  'turtle', 'rabbit', 'fox', 'wolf', 'bear', 'eagle', 'hawk', 'owl',
  'dolphin', 'whale', 'shark', 'octopus', 'penguin', 'seal', 'otter', 'fish',
  'lion', 'tiger', 'leopard', 'cheetah', 'elephant', 'giraffe', 'zebra', 'rhino',
  'monkey', 'gorilla', 'panda', 'koala', 'kangaroo', 'sloth', 'llama', 'alpaca',
  'dragon', 'phoenix', 'unicorn', 'griffin', 'pegasus', 'sphinx', 'kraken', 'yeti'
];

const COLORS = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan',
  'magenta', 'lime', 'teal', 'indigo', 'violet', 'crimson', 'azure', 'gold',
  'silver', 'bronze', 'copper', 'platinum', 'emerald', 'ruby', 'sapphire', 'amber',
  'coral', 'turquoise', 'lavender', 'mint', 'peach', 'rose', 'ivory', 'pearl'
];

export function generateGroupId(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  
  return `${animal}-${color}-${adjective}-${number}`;
}

export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidGroupId(groupId: string): boolean {
  // Basic validation: should have 4 parts separated by hyphens
  const parts = groupId.split('-');
  return parts.length === 4 && parts.every(part => part.length > 0);
}
