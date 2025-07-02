# GeoPOIO - Real-Time Location Sharing 🌍

GeoPOIO is a powerful web application that combines GPX route visualization with real-time location sharing capabilities. Discover Points of Interest along your routes and share your location with friends in real-time!

## ✨ Features

### Core Features
- 📁 **GPX Upload & Visualization** - Upload and visualize GPX tracks on an interactive map
- 🔍 **POI Discovery** - Find Points of Interest along your routes using Overpass API
- 📍 **Location-based Search** - Discover POIs near your current location
- 🗺️ **Interactive Map** - Powered by MapLibre GL with beautiful outdoor styling

### 🚀 NEW: Real-Time Location Sharing
- 🌐 **Group Location Sharing** - Create or join groups with fun names like "turtle-blue-flying-1234"
- 👥 **Live Member Tracking** - See group members' locations update in real-time
- 🎯 **Custom Emojis** - Choose your emoji and display name
- 📱 **Mobile-Friendly** - Works seamlessly on all devices
- 🔒 **Privacy-First** - No accounts needed, groups auto-expire after 24h

## 🏗️ Architecture

### Frontend
- **Svelte 5** - Modern reactive framework
- **MapLibre GL** - High-performance vector maps
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool

### Backend (NEW!)
- **Vercel Serverless Functions** - Scalable API endpoints
- **Vercel KV** - Redis-compatible key-value storage
- **Real-time Polling** - Live location updates every 5 seconds
- **Automatic Cleanup** - Inactive members removed after 30 seconds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/fxi/geopoio.git
   cd geopoio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **For Vercel development (with API routes)**
   ```bash
   npm run dev:vercel
   ```

## 🌐 Deployment

### Automated Deployment with GitHub Actions

This project includes automated deployment to Vercel using GitHub Actions. Here's how to set it up:

#### 1. Vercel Setup

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Create a new project** and connect your GitHub repository

3. **Set up Vercel KV database**:
   - Go to your Vercel dashboard
   - Navigate to Storage → Create Database → KV
   - Note down the connection details

4. **Get Vercel credentials**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and get your credentials
   vercel login
   vercel link
   
   # Get your org and project IDs
   cat .vercel/project.json
   ```

#### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

#### 3. Environment Variables

In your Vercel dashboard, add these environment variables:

```
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
```

#### 4. Deploy

Push to the `main` branch and GitHub Actions will automatically:
- ✅ Run type checking
- ✅ Build the application
- ✅ Deploy to Vercel
- ✅ Set up the KV database

## 📱 How to Use Location Sharing

### Creating a Group
1. Click the **🌐 Share Location** button
2. Enter your name and choose an emoji
3. Click **Create Group**
4. Share the generated group code with friends

### Joining a Group
1. Click the **🌐 Share Location** button
2. Enter your name and choose an emoji
3. Check **Join existing group**
4. Enter the group code
5. Click **Join Group**

### Group Features
- 👥 See all group members on the map
- 📍 Real-time location updates
- 🎯 Click markers for member details
- 📋 Copy group code to share
- 🚪 Leave group anytime

## 🛠️ API Endpoints

The location sharing feature uses these serverless API routes:

- `POST /api/groups/join` - Create or join a group
- `GET /api/groups/[groupId]/members` - Get group members
- `POST /api/groups/[groupId]/update` - Update member location
- `POST /api/groups/[groupId]/leave` - Leave group

## 🔧 Development Scripts

```bash
npm run dev          # Start Vite dev server
npm run dev:vercel   # Start Vercel dev server (with API routes)
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check
npm run lint         # Lint code
```

## 🏗️ Project Structure

```
├── api/                    # Vercel serverless functions
│   └── groups/
│       ├── join.ts
│       └── [groupId]/
│           ├── members.ts
│           ├── update.ts
│           └── leave.ts
├── lib/                    # Backend utilities
│   ├── kv.ts              # KV database service
│   └── groupUtils.ts      # Group management utilities
├── src/
│   ├── components/        # Svelte components
│   │   ├── Map.svelte
│   │   ├── LocationShareModal.svelte
│   │   └── ...
│   ├── services/          # Frontend services
│   │   ├── LocationShareService.ts
│   │   └── ...
│   ├── stores/            # Svelte stores
│   │   ├── locationShare.ts
│   │   └── ...
│   └── types/             # TypeScript types
├── .github/workflows/     # GitHub Actions
│   ├── deploy.yml         # GitHub Pages deployment
│   └── deploy-vercel.yml  # Vercel deployment
└── vercel.json           # Vercel configuration
```

## 🔒 Privacy & Security

- **No user accounts** - Anonymous usage
- **Temporary data** - Groups auto-expire after 24 hours
- **No location history** - Only current positions stored
- **Client-side validation** - Input sanitization
- **Rate limiting** - Built-in Vercel protection

## 🌟 Fun Group Names

Groups are automatically assigned fun names like:
- `turtle-blue-flying-1234`
- `dragon-gold-dancing-5678`
- `phoenix-emerald-swift-9012`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MapLibre GL](https://maplibre.org/) for the amazing mapping library
- [Overpass API](https://overpass-api.de/) for POI data
- [Vercel](https://vercel.com/) for hosting and serverless functions
- [Svelte](https://svelte.dev/) for the reactive framework

---

**Ready to share your adventures? Start exploring with GeoPOIO!** 🚀
