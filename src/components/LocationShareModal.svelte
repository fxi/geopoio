<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { locationShareStore, locationShareHelpers } from '../stores/locationShare';
  import { LocationShareService, LocationTracker } from '../services/LocationShareService';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let isVisible = true;
  let isLoading = false;
  let error = '';
  let step: 'setup' | 'active' = 'setup';
  
  // Form data
  let userName = '';
  let userEmoji = '📍';
  let groupId = '';
  let isJoiningExisting = false;

  // Location tracking
  let locationTracker: LocationTracker | null = null;
  let updateInterval: ReturnType<typeof setInterval> | null = null;

  const emojis = ['📍', '🚀', '🎯', '⭐', '🔥', '💎', '🌟', '🎉', '🚗', '🏃', '🚴', '🛴', '✈️', '🚁', '🛸'];

  function close() {
    isVisible = false;
    setTimeout(() => dispatch('close'), 300);
  }

  async function handleSubmit() {
    if (!userName.trim()) {
      error = 'Please enter your name';
      return;
    }

    isLoading = true;
    error = '';

    try {
      // Join or create group
      const result = await LocationShareService.joinGroup(
        isJoiningExisting ? groupId : undefined,
        userName.trim(),
        userEmoji
      );

      // Start location sharing
      locationShareHelpers.startSharing(
        result.groupId,
        result.userId,
        userName.trim(),
        userEmoji
      );

      // Start location tracking
      locationTracker = new LocationTracker();
      await locationTracker.start(async (lat, lon) => {
        try {
          await LocationShareService.updateLocation(
            result.groupId,
            result.userId,
            userName.trim(),
            userEmoji,
            lat,
            lon
          );
        } catch (err) {
          console.error('Failed to update location:', err);
        }
      });

      // Start polling for other members
      startPolling(result.groupId);

      step = 'active';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start sharing';
    } finally {
      isLoading = false;
    }
  }

  function startPolling(groupId: string) {
    updateInterval = setInterval(async () => {
      try {
        const result = await LocationShareService.getMembers(groupId);
        locationShareHelpers.updateMembers(result.members);
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    }, 5000); // Poll every 5 seconds
  }

  async function stopSharing() {
    isLoading = true;
    
    try {
      const state = $locationShareStore;
      if (state.groupId && state.userId) {
        await LocationShareService.leaveGroup(state.groupId, state.userId);
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
    }

    // Clean up
    if (locationTracker) {
      locationTracker.stop();
      locationTracker = null;
    }
    
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    locationShareHelpers.stopSharing();
    close();
  }

  function copyGroupId() {
    const state = $locationShareStore;
    if (state.groupId) {
      navigator.clipboard.writeText(state.groupId);
      // Could add a toast notification here
    }
  }
</script>

{#if isVisible}
  <div class="modal-overlay" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>📍 Share Location</h2>
        <button class="close-btn" on:click={close}>×</button>
      </div>

      {#if step === 'setup'}
        <div class="modal-content">
          <div class="form-group">
            <label for="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              bind:value={userName}
              placeholder="Enter your name"
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label>Choose Your Emoji</label>
            <div class="emoji-grid">
              {#each emojis as emoji}
                <button
                  class="emoji-btn"
                  class:selected={userEmoji === emoji}
                  on:click={() => userEmoji = emoji}
                >
                  {emoji}
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                bind:checked={isJoiningExisting}
              />
              Join existing group
            </label>
          </div>

          {#if isJoiningExisting}
            <div class="form-group">
              <label for="groupId">Group Code</label>
              <input
                id="groupId"
                type="text"
                bind:value={groupId}
                placeholder="turtle-blue-flying-1234"
              />
            </div>
          {/if}

          {#if error}
            <div class="error">{error}</div>
          {/if}

          <div class="modal-actions">
            <button class="btn-secondary" on:click={close}>Cancel</button>
            <button
              class="btn-primary"
              on:click={handleSubmit}
              disabled={isLoading}
            >
              {#if isLoading}
                Starting...
              {:else if isJoiningExisting}
                Join Group
              {:else}
                Create Group
              {/if}
            </button>
          </div>
        </div>
      {:else}
        <div class="modal-content">
          <div class="active-status">
            <div class="status-icon">✅</div>
            <h3>Location Sharing Active</h3>
            <p>Group: <strong>{$locationShareStore.groupId}</strong></p>
            <button class="copy-btn" on:click={copyGroupId}>📋 Copy Group Code</button>
          </div>

          <div class="members-list">
            <h4>Group Members ({$locationShareStore.members.length})</h4>
            {#each $locationShareStore.members as member}
              <div class="member-item">
                <span class="member-emoji">{member.emoji}</span>
                <span class="member-name">{member.name}</span>
                <span class="member-status">
                  {Math.round((Date.now() - member.lastSeen) / 1000)}s ago
                </span>
              </div>
            {/each}
          </div>

          <div class="modal-actions">
            <button
              class="btn-danger"
              on:click={stopSharing}
              disabled={isLoading}
            >
              {isLoading ? 'Stopping...' : 'Stop Sharing'}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .form-group input[type="text"] {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .form-group input[type="text"]:focus {
    outline: none;
    border-color: #007bff;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  .emoji-btn {
    background: #f8f9fa;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .emoji-btn:hover {
    background: #e9ecef;
  }

  .emoji-btn.selected {
    background: #007bff;
    border-color: #007bff;
    color: white;
  }

  .error {
    color: #dc3545;
    background: #f8d7da;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn-primary, .btn-secondary, .btn-danger {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  .btn-primary:disabled, .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .active-status {
    text-align: center;
    margin-bottom: 20px;
  }

  .status-icon {
    font-size: 3rem;
    margin-bottom: 10px;
  }

  .copy-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 10px;
  }

  .copy-btn:hover {
    background: #218838;
  }

  .members-list {
    margin-bottom: 20px;
  }

  .members-list h4 {
    margin-bottom: 12px;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .member-item:last-child {
    border-bottom: none;
  }

  .member-emoji {
    font-size: 1.2rem;
  }

  .member-name {
    flex: 1;
    font-weight: 500;
  }

  .member-status {
    font-size: 0.8rem;
    color: #666;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
