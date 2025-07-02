<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { gpxStoreHelpers } from '../stores';
  import { GPXParser } from '../services/GPXParser';

  export let show = false;

  const dispatch = createEventDispatcher();
  const gpxParser = new GPXParser();

  let fileInput: HTMLInputElement;
  let uploading = false;

  function closeModal() {
    show = false;
  }

  function handleFileSelect() {
    fileInput.click();
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;

    uploading = true;

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.gpx')) {
          alert(`${file.name} is not a GPX file`);
          continue;
        }

        const text = await file.text();
        const track = await gpxParser.parseGPX(text, file.name);
        
        if (track) {
          gpxStoreHelpers.addTrack(track);
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error processing GPX files:', error);
      alert('Error processing GPX files. Please check the file format.');
    } finally {
      uploading = false;
      target.value = '';
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      handleFiles(files);
    }
  }

  async function handleFiles(files: FileList) {
    uploading = true;

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.gpx')) {
          continue;
        }

        const text = await file.text();
        const track = await gpxParser.parseGPX(text, file.name);
        
        if (track) {
          gpxStoreHelpers.addTrack(track);
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error processing GPX files:', error);
      alert('Error processing GPX files. Please check the file format.');
    } finally {
      uploading = false;
    }
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Upload GPX Files</h2>
        <button class="close-button" on:click={closeModal}>✕</button>
      </div>

      <div class="modal-content">
        <div 
          class="upload-area"
          class:uploading
          on:dragover={handleDragOver}
          on:drop={handleDrop}
          on:click={handleFileSelect}
        >
          {#if uploading}
            <div class="upload-spinner">⏳</div>
            <p>Processing files...</p>
          {:else}
            <div class="upload-icon">📁</div>
            <p>Click to select GPX files or drag & drop</p>
            <small>Supports multiple file selection</small>
          {/if}
        </div>

        <input
          bind:this={fileInput}
          type="file"
          accept=".gpx"
          multiple
          style="display: none;"
          on:change={handleFileChange}
        />
      </div>
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
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    padding: 20px;
  }

  .modal {
    background: #1a1a1a;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow: hidden;
    border: 1px solid #333;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #333;
  }

  .modal-header h2 {
    color: white;
    margin: 0;
    font-size: 18px;
  }

  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
  }

  .modal-content {
    padding: 20px;
  }

  .upload-area {
    border: 2px dashed #555;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.02);
  }

  .upload-area:hover {
    border-color: #00BFFF;
    background: rgba(0, 191, 255, 0.05);
  }

  .upload-area.uploading {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .upload-spinner {
    font-size: 48px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .upload-area p {
    color: white;
    margin: 0 0 8px 0;
    font-size: 16px;
  }

  .upload-area small {
    color: #999;
    font-size: 12px;
  }
</style>