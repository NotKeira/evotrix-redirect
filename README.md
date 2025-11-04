# 🚀 Evotrix Redirect

A modern, corporate-styled URL redirect manager built with TypeScript and Node.js native `http` module. Features a beautiful web interface, API-key protected endpoints, and intelligent favicon caching using `@notkeira/ttl-cache`.

![Evotrix Redirect UI](https://github.com/user-attachments/assets/3db51f95-1d32-4558-beff-95b4e9da9c4a)

## ✨ Features

- **Modern Web Interface**: Beautiful, responsive UI with gradient backgrounds and smooth animations
- **API-Key Authentication**: Secure API endpoints with custom API key protection
- **Smart Caching**: 2-week TTL cache for favicons using `@notkeira/ttl-cache`
- **Full CRUD Operations**: Create, read, update, and delete redirects via API or UI
- **Favicon Support**: Automatically fetches and displays favicons for target URLs
- **TypeScript**: Fully typed codebase for better development experience
- **Zero Dependencies Runtime**: Built on Node.js native `http` module

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NotKeira/evotrix-redirect.git
cd evotrix-redirect
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the server:
```bash
# Using default API key
npm start

# Or with custom API key
API_KEY="your-secret-key" npm start

# Or with custom port and API key
PORT=8080 API_KEY="your-secret-key" npm start
```

The server will start at `http://localhost:3000` (or your specified port).

## 📖 Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Enter your API key in the "API Key" field (it will be saved in localStorage)
3. Add redirects using the form
4. Manage your redirects with Edit/Delete buttons
5. Visit `http://localhost:3000/{shortCode}` to be redirected

### API Endpoints

All modification endpoints require the `X-API-Key` header.

#### Get All Redirects
```bash
curl http://localhost:3000/api/redirects
```

#### Add a Redirect
```bash
curl -X POST http://localhost:3000/api/redirects \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "shortCode": "github",
    "targetUrl": "https://github.com/NotKeira",
    "title": "GitHub Profile"
  }'
```

#### Update a Redirect
```bash
curl -X PUT http://localhost:3000/api/redirects/{id} \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "title": "New Title",
    "targetUrl": "https://new-url.com"
  }'
```

#### Delete a Redirect
```bash
curl -X DELETE http://localhost:3000/api/redirects/{id} \
  -H "X-API-Key: your-api-key"
```

#### Use a Redirect
Simply visit: `http://localhost:3000/{shortCode}`

## 🎨 Design

The interface features:
- Purple gradient background (#667eea to #764ba2)
- Clean white cards with subtle shadows
- Colorful gradient buttons with hover effects
- Responsive grid layout for redirect cards
- Toast notifications for user feedback
- Modern sans-serif typography

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: API key for protected endpoints (default: "your-secure-api-key-here")

### Cache Configuration

The favicon cache is set to 2 weeks (1,209,600,000 ms) with a maximum of 1000 entries. This can be modified in `src/server.ts`:

```typescript
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const iconCache = new LRUCache<string, IconCache>({
  maxSize: 1000,
  ttl: TWO_WEEKS_MS
});
```

## 📁 Project Structure

```
evotrix-redirect/
├── src/
│   └── server.ts       # Main server implementation
├── dist/               # Compiled JavaScript (generated)
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🛠️ Development

### Build
```bash
npm run build
```

### Dev Mode (Build + Run)
```bash
npm run dev
```

## 📝 API Response Examples

### Successful Redirect Creation
```json
{
  "id": "lf9k2j3h4g5",
  "shortCode": "github",
  "targetUrl": "https://github.com/NotKeira",
  "title": "GitHub Profile",
  "createdAt": 1699012345678
}
```

### Error Response
```
401 Unauthorized
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC

## 👤 Author

Keira Hopkins ([@NotKeira](https://github.com/NotKeira))

## 🔗 Links

- [GitHub Repository](https://github.com/NotKeira/evotrix-redirect)
- [@notkeira/ttl-cache](https://www.npmjs.com/package/@notkeira/ttl-cache)