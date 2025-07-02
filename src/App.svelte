<script lang="ts">
  import Map from "./components/Map.svelte";
  import BottomControls from "./components/BottomControls.svelte";
  import SettingsDrawer from "./components/SettingsDrawer.svelte";
  import GPXUploadModal from "./components/GPXUploadModal.svelte";
  import POIDetailsPanel from "./components/POIDetailsPanel.svelte";
  import { gpxStore, settingsStore, poiStore, gpxStoreHelpers, poiStoreHelpers } from "./stores";
  import { GPXParser } from "./services/GPXParser";
  import type { POI } from "./types";

  let showSettings = false;
  let showGPXUpload = false;
  let showPOIDetails = false;
  let selectedPOI: POI | null = null;
  let mapComponent: Map;

  const gpxParser = new GPXParser();

  // Handle POI selection from map
  function handlePOISelected(event: CustomEvent<POI>) {
    selectedPOI = event.detail;
    showPOIDetails = true;
  }

  function handleLocateMe() {
    if (mapComponent) {
      mapComponent.centerOnUser();
    }
  }

  function handleUploadGPX() {
    showGPXUpload = true;
  }

  function handleShowSettings() {
    showSettings = true;
  }

  function handleExportWaypoints() {
    const pois = $poiStore;
    if (pois.length === 0) {
      alert("No waypoints to export");
      return;
    }

    const gpxContent = generateGPXFromPOIs(pois);
    downloadGPX(gpxContent, "waypoints.gpx");
  }

  function handleDeleteAll() {
    if (confirm("Delete all GPX tracks and waypoints?")) {
      gpxStoreHelpers.clearAll();
      poiStoreHelpers.clear();
    }
  }

  function handleFindPOIs() {
    if (mapComponent) {
      mapComponent.findPOIs();
    }
  }

  function handleFindPOIsNearMe() {
    if (mapComponent) {
      mapComponent.findPOIsNearMe();
    }
  }


  async function handleLoadTestRoute() {
    try {
      console.log("🧪 Loading test GPX file from /public/test.gpx");
      
      const response = await fetch('/geopoio/test.gpx');
      if (!response.ok) {
        throw new Error(`Failed to fetch test.gpx: ${response.status}`);
      }
      
      const gpxContent = await response.text();
      const track = await gpxParser.parseGPX(gpxContent, 'test.gpx');
      
      if (track) {
        // Update the track name to indicate it's a test route
        track.name = `Test Route - ${track.name}`;
        gpxStoreHelpers.addTrack(track);
        console.log("🧪 Test route loaded successfully:", track.name);
        console.log("📍 Track coordinates:", track.coordinates.length, "points");
        console.log("🗺️ Track bounds:", track.bounds);
      } else {
        throw new Error("Failed to parse GPX file");
      }
    } catch (error) {
      console.error("❌ Error loading test route:", error);
      alert("Failed to load test route. Check console for details.");
    }
  }

  function generateGPXFromPOIs(pois: any[]) {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoPOIO">
  <metadata>
    <name>GeoPOIO Waypoints</name>
  </metadata>`;

    const waypoints = pois
      .map(
        (poi) => `
  <wpt lat="${poi.lat}" lon="${poi.lon}">
    <name>${poi.name || poi.type}</name>
    <desc>${poi.amenity || poi.type}</desc>
    <type>${poi.type}</type>
  </wpt>`
      )
      .join("");

    return header + waypoints + "\n</gpx>";
  }

  function downloadGPX(content: string, filename: string) {
    const blob = new Blob([content], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<main>
  <Map bind:this={mapComponent} on:poiSelected={handlePOISelected} />

  <BottomControls
    on:uploadGPX={handleUploadGPX}
    on:showSettings={handleShowSettings}
    on:locateMe={handleLocateMe}
    on:exportWaypoints={handleExportWaypoints}
    on:deleteAll={handleDeleteAll}
    on:findPOIs={handleFindPOIs}
    on:findPOIsNearMe={handleFindPOIsNearMe}
  />

  <SettingsDrawer 
    bind:show={showSettings} 
    on:findPOIs={handleFindPOIs}
    on:findPOIsNearMe={handleFindPOIsNearMe}
  />

  <GPXUploadModal bind:show={showGPXUpload} />

  <POIDetailsPanel bind:show={showPOIDetails} bind:poi={selectedPOI} />
</main>

<style>
  main {
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
    background-color: #000;
  }
</style>
