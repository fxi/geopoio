# GeoPOIO 🗺️

**Discover Points of Interest (POIs) along your GPX routes and around your location.**

GeoPOIO is a modern web application that helps you find amenities, services, and points of interest either along your planned GPX routes or near your current location. Perfect for hikers, cyclists, travelers, and anyone exploring new areas.

## ✨ Features

### 🎯 Dual Search Modes
- **📍 Near Me**: Find POIs around your current location (1-10km radius)
- **🛤️ Along Tracks**: Discover amenities along your GPX route (10-400m from track)

### 🗺️ Interactive Map
- Real-time map with custom POI markers
- GPX track visualization with color coding
- Click POIs for detailed information
- Smooth pan and zoom controls

### 📱 Smart Distance Controls
- Separate distance settings for different search types
- Dropdown selectors with predefined optimal distances
- Track distance: 10m, 50m, 100m, 200m, 400m
- Near me distance: 1km, 2km, 5km, 10km

### 🏷️ POI Categories
- 💧 **Drinking Water** - Fountains, taps, water sources
- 🍽️ **Restaurants** - Cafes, restaurants, fast food
- ⛽ **Gas Stations** - Fuel stops and services
- 🛒 **Supermarkets** - Grocery stores, convenience shops
- 🏥 **Hospitals** - Medical facilities and clinics

### 💾 Smart Caching
- Offline-capable with intelligent caching
- 24-hour cache duration for optimal performance
- Separate cache management for different data types

### 📁 GPX Support
- Upload and visualize GPX tracks
- Multiple track support with visibility controls
- Export discovered POIs as GPX waypoints
- Test route included for quick demo

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation
```bash
# Clone the repository
git clone https://github.com/fxi/geopoio.git
cd geopoio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Load a GPX track** - Upload your route or use the test route
2. **Choose search type**:
   - Click **"Find POIs"** to search along your track
   - Click **"Near Me"** to search around your location
3. **Adjust distances** in Settings for optimal results
4. **Explore POIs** - Click markers for details
5. **Export results** - Save discovered POIs as GPX waypoints

## 🛠️ Technology Stack

- **Frontend**: Svelte 5 + TypeScript
- **Mapping**: MapLibre GL JS
- **Data Source**: OpenStreetMap via Overpass API
- **Build Tool**: Vite
- **Styling**: Modern CSS with custom properties

## 📦 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking and linting
npm run deploy       # Deploy to GitHub Pages
```

## 🌍 Data Sources

GeoPOIO uses **OpenStreetMap** data via the **Overpass API** to provide:
- Real-time, community-maintained POI data
- Global coverage with local accuracy
- Comprehensive amenity information
- Respect for data usage limits and caching

## 🎨 Design Philosophy

- **Mobile-first** responsive design
- **Accessibility** focused with ARIA labels
- **Performance** optimized with smart caching
- **User experience** prioritized with intuitive controls
- **Professional** aesthetic with clean typography

## 🔧 Configuration

### Custom POI Types
Edit `src/stores/index.ts` to add new POI categories:

```typescript
poiTypes: {
  your_type: { 
    name: 'Your Type', 
    color: '#COLOR', 
    icon: '🎯' 
  }
}
```

### Distance Presets
Modify distance options in `src/components/SettingsDrawer.svelte`:

```svelte
<option value={50}>50m</option>
<option value={100}>100m</option>
<!-- Add your custom distances -->
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** community for comprehensive POI data
- **MapLibre** for excellent mapping capabilities
- **Overpass API** for efficient data querying
- **Svelte** team for the amazing framework

## 🔗 Links

- **Demo**: [fxi.io/geopoio](https://fxi.io/geopoio)
- **Repository**: [github.com/fxi/geopoio](https://github.com/fxi/geopoio)
- **Issues**: [Report bugs or request features](https://github.com/fxi/geopoio/issues)

---

**GeoPOIO** - Making exploration smarter, one POI at a time! 🎯
