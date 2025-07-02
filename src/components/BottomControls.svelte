<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const controls = [
    { id: 'upload', icon: '📁', label: 'Upload GPX', action: () => dispatch('uploadGPX') },
    { id: 'findPOIs', icon: '🔍', label: 'Find POIs', action: () => dispatch('findPOIs') },
    { id: 'findNearMe', icon: '📍', label: 'Near Me', action: () => dispatch('findPOIsNearMe') },
    { id: 'settings', icon: '⚙️', label: 'Settings', action: () => dispatch('showSettings') },
    { id: 'locate', icon: '🎯', label: 'Locate Me', action: () => dispatch('locateMe') },
    { id: 'export', icon: '💾', label: 'Export', action: () => dispatch('exportWaypoints') },
    { id: 'delete', icon: '🗑️', label: 'Delete All', action: () => dispatch('deleteAll') }
  ];
</script>

<div class="bottom-controls">
  {#each controls as control}
    <button 
      class="control-button" 
      on:click={control.action}
      aria-label={control.label}
    >
      <span class="icon">{control.icon}</span>
      <span class="label">{control.label}</span>
    </button>
  {/each}
</div>

<style>
  .bottom-controls {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 24px;
    padding: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .control-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: white;
    padding: 12px 8px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 60px;
    min-height: 60px;
  }

  .control-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .control-button:active {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
  }

  .icon {
    font-size: 20px;
    margin-bottom: 2px;
  }

  .label {
    font-size: 10px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }

  @media (max-width: 480px) {
    .bottom-controls {
      left: 10px;
      right: 10px;
      transform: none;
      justify-content: space-around;
    }

    .control-button {
      min-width: 50px;
      min-height: 50px;
      padding: 8px 4px;
    }

    .icon {
      font-size: 18px;
    }

    .label {
      font-size: 9px;
    }
  }
</style>
