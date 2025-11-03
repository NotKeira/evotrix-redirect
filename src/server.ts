import * as http from 'http';
import * as url from 'url';
import { LRUCache } from '@notkeira/ttl-cache';

interface Redirect {
  id: string;
  shortCode: string;
  targetUrl: string;
  title: string;
  createdAt: number;
}

interface IconCache {
  favicon?: string;
  ogImage?: string;
}

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-secure-api-key-here';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds

// TTL Cache for icons (2 weeks)
const iconCache = new LRUCache<string, IconCache>({
  maxSize: 1000,
  ttl: TWO_WEEKS_MS
});

// In-memory storage for redirects
const redirects = new Map<string, Redirect>();
const shortCodeIndex = new Map<string, string>(); // shortCode -> id mapping

// Helper function to generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper function to fetch icon for a URL
async function fetchIcon(targetUrl: string): Promise<IconCache> {
  const cached = iconCache.get(targetUrl);
  if (cached) {
    return cached;
  }

  const icons: IconCache = {};
  
  try {
    const parsedUrl = new URL(targetUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    
    // Try to get favicon
    icons.favicon = `${baseUrl}/favicon.ico`;
    
    // For og:image, we would need to fetch the page HTML and parse it
    // For simplicity, we'll just use the favicon
    
    iconCache.set(targetUrl, icons);
  } catch (error) {
    console.error('Error fetching icon:', error);
  }
  
  return icons;
}

// Helper function to parse JSON body
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Check API key
function checkApiKey(req: http.IncomingMessage): boolean {
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
  return apiKey === API_KEY;
}

// HTML page
function getHtmlPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evotrix Redirect Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 1.1em;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-danger:hover {
            background: #dc2626;
        }
        
        .btn-edit {
            background: #10b981;
            color: white;
            margin-right: 10px;
        }
        
        .btn-edit:hover {
            background: #059669;
        }
        
        .redirect-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .redirect-item {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s;
        }
        
        .redirect-item:hover {
            transform: translateY(-4px);
        }
        
        .redirect-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            margin-bottom: 15px;
            object-fit: cover;
            background: white;
        }
        
        .redirect-title {
            font-weight: 700;
            font-size: 1.2em;
            color: #333;
            margin-bottom: 8px;
        }
        
        .redirect-code {
            color: #667eea;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .redirect-url {
            color: #666;
            font-size: 0.9em;
            word-break: break-all;
            margin-bottom: 15px;
        }
        
        .redirect-actions {
            display: flex;
            gap: 10px;
            margin-top: auto;
        }
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #6ee7b7;
        }
        
        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        
        .hidden {
            display: none;
        }
        
        .api-key-input {
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Evotrix Redirect</h1>
            <p class="subtitle">Manage your URL redirects with style</p>
        </div>
        
        <div id="alert" class="alert hidden"></div>
        
        <div class="card api-key-input">
            <div class="form-group">
                <label for="apiKey">API Key</label>
                <input type="password" id="apiKey" placeholder="Enter your API key">
            </div>
        </div>
        
        <div class="card">
            <h2 style="margin-bottom: 20px; color: #333;">Add New Redirect</h2>
            <form id="addForm">
                <div class="form-group">
                    <label for="shortCode">Short Code</label>
                    <input type="text" id="shortCode" placeholder="e.g., github" required>
                </div>
                <div class="form-group">
                    <label for="targetUrl">Target URL</label>
                    <input type="text" id="targetUrl" placeholder="https://github.com/NotKeira" required>
                </div>
                <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" id="title" placeholder="GitHub Profile" required>
                </div>
                <button type="submit" class="btn btn-primary">Add Redirect</button>
            </form>
        </div>
        
        <div class="card">
            <h2 style="margin-bottom: 20px; color: #333;">Your Redirects</h2>
            <div id="redirectList" class="redirect-list"></div>
        </div>
    </div>
    
    <script>
        const apiKeyInput = document.getElementById('apiKey');
        const addForm = document.getElementById('addForm');
        const redirectList = document.getElementById('redirectList');
        const alertDiv = document.getElementById('alert');
        
        function showAlert(message, type) {
            alertDiv.textContent = message;
            alertDiv.className = 'alert alert-' + type;
            setTimeout(() => {
                alertDiv.className = 'alert hidden';
            }, 3000);
        }
        
        function getApiKey() {
            return apiKeyInput.value || localStorage.getItem('apiKey') || '';
        }
        
        apiKeyInput.addEventListener('change', () => {
            localStorage.setItem('apiKey', apiKeyInput.value);
        });
        
        // Load API key from localStorage
        const savedApiKey = localStorage.getItem('apiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }
        
        async function loadRedirects() {
            try {
                const response = await fetch('/api/redirects');
                const redirects = await response.json();
                
                redirectList.innerHTML = '';
                
                for (const redirect of redirects) {
                    const item = document.createElement('div');
                    item.className = 'redirect-item';
                    
                    const icon = document.createElement('img');
                    icon.className = 'redirect-icon';
                    icon.src = redirect.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M13.5 2c-5.629 0-10.212 4.436-10.475 10h-3.025l4.537 5.917 4.463-5.917h-2.975c.26-3.902 3.508-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.876-2.854l-1.847 2.449c1.919 2.088 4.664 3.405 7.723 3.405 5.798 0 10.5-4.702 10.5-10.5s-4.702-10.5-10.5-10.5z"/></svg>';
                    icon.onerror = () => {
                        icon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M13.5 2c-5.629 0-10.212 4.436-10.475 10h-3.025l4.537 5.917 4.463-5.917h-2.975c.26-3.902 3.508-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.876-2.854l-1.847 2.449c1.919 2.088 4.664 3.405 7.723 3.405 5.798 0 10.5-4.702 10.5-10.5s-4.702-10.5-10.5-10.5z"/></svg>';
                    };
                    
                    const title = document.createElement('div');
                    title.className = 'redirect-title';
                    title.textContent = redirect.title;
                    
                    const code = document.createElement('div');
                    code.className = 'redirect-code';
                    code.textContent = '/' + redirect.shortCode;
                    
                    const url = document.createElement('div');
                    url.className = 'redirect-url';
                    url.textContent = redirect.targetUrl;
                    
                    const actions = document.createElement('div');
                    actions.className = 'redirect-actions';
                    
                    const editBtn = document.createElement('button');
                    editBtn.className = 'btn btn-edit';
                    editBtn.textContent = 'Edit';
                    editBtn.onclick = () => editRedirect(redirect);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.onclick = () => deleteRedirect(redirect.id);
                    
                    actions.appendChild(editBtn);
                    actions.appendChild(deleteBtn);
                    
                    item.appendChild(icon);
                    item.appendChild(title);
                    item.appendChild(code);
                    item.appendChild(url);
                    item.appendChild(actions);
                    
                    redirectList.appendChild(item);
                }
            } catch (error) {
                console.error('Error loading redirects:', error);
            }
        }
        
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const apiKey = getApiKey();
            if (!apiKey) {
                showAlert('Please enter an API key', 'error');
                return;
            }
            
            const data = {
                shortCode: document.getElementById('shortCode').value,
                targetUrl: document.getElementById('targetUrl').value,
                title: document.getElementById('title').value
            };
            
            try {
                const response = await fetch('/api/redirects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    showAlert('Redirect added successfully!', 'success');
                    addForm.reset();
                    loadRedirects();
                } else {
                    const error = await response.text();
                    showAlert('Error: ' + error, 'error');
                }
            } catch (error) {
                showAlert('Error adding redirect', 'error');
            }
        });
        
        async function editRedirect(redirect) {
            const newTitle = prompt('Enter new title:', redirect.title);
            if (!newTitle) return;
            
            const newUrl = prompt('Enter new URL:', redirect.targetUrl);
            if (!newUrl) return;
            
            const apiKey = getApiKey();
            if (!apiKey) {
                showAlert('Please enter an API key', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/redirects/' + redirect.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify({
                        title: newTitle,
                        targetUrl: newUrl
                    })
                });
                
                if (response.ok) {
                    showAlert('Redirect updated successfully!', 'success');
                    loadRedirects();
                } else {
                    showAlert('Error updating redirect', 'error');
                }
            } catch (error) {
                showAlert('Error updating redirect', 'error');
            }
        }
        
        async function deleteRedirect(id) {
            if (!confirm('Are you sure you want to delete this redirect?')) {
                return;
            }
            
            const apiKey = getApiKey();
            if (!apiKey) {
                showAlert('Please enter an API key', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/redirects/' + id, {
                    method: 'DELETE',
                    headers: {
                        'X-API-Key': apiKey
                    }
                });
                
                if (response.ok) {
                    showAlert('Redirect deleted successfully!', 'success');
                    loadRedirects();
                } else {
                    showAlert('Error deleting redirect', 'error');
                }
            } catch (error) {
                showAlert('Error deleting redirect', 'error');
            }
        }
        
        // Load redirects on page load
        loadRedirects();
    </script>
</body>
</html>`;
}

// Server request handler
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '/';
  const method = req.method || 'GET';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve HTML page
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHtmlPage());
    return;
  }

  // API: Get all redirects
  if (pathname === '/api/redirects' && method === 'GET') {
    const redirectArray = Array.from(redirects.values()).map(r => ({
      ...r,
      favicon: iconCache.get(r.targetUrl)?.favicon
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(redirectArray));
    return;
  }

  // API: Add redirect
  if (pathname === '/api/redirects' && method === 'POST') {
    if (!checkApiKey(req)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const { shortCode, targetUrl, title } = body;

      if (!shortCode || !targetUrl || !title) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing required fields');
        return;
      }

      // Check if short code already exists (O(1) lookup)
      if (shortCodeIndex.has(shortCode)) {
        res.writeHead(409, { 'Content-Type': 'text/plain' });
        res.end('Short code already exists');
        return;
      }

      const id = generateId();
      const redirect: Redirect = {
        id,
        shortCode,
        targetUrl,
        title,
        createdAt: Date.now()
      };

      redirects.set(id, redirect);
      shortCodeIndex.set(shortCode, id);
      
      // Fetch icon asynchronously
      fetchIcon(targetUrl).catch(err => console.error('Error fetching icon:', err));

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(redirect));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON');
    }
    return;
  }

  // API: Update redirect
  if (pathname?.startsWith('/api/redirects/') && method === 'PUT') {
    if (!checkApiKey(req)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    const id = pathname.split('/')[3];
    const redirect = redirects.get(id);

    if (!redirect) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Redirect not found');
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const { targetUrl, title, shortCode } = body;

      // If shortCode is being changed, check if the new one is available
      if (shortCode && shortCode !== redirect.shortCode) {
        if (shortCodeIndex.has(shortCode)) {
          res.writeHead(409, { 'Content-Type': 'text/plain' });
          res.end('Short code already exists');
          return;
        }
        // Update the index
        shortCodeIndex.delete(redirect.shortCode);
        shortCodeIndex.set(shortCode, id);
        redirect.shortCode = shortCode;
      }

      if (targetUrl) {
        redirect.targetUrl = targetUrl;
        // Refresh icon cache
        fetchIcon(targetUrl).catch(err => console.error('Error fetching icon:', err));
      }
      if (title) redirect.title = title;

      redirects.set(id, redirect);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(redirect));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON');
    }
    return;
  }

  // API: Delete redirect
  if (pathname?.startsWith('/api/redirects/') && method === 'DELETE') {
    if (!checkApiKey(req)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    const id = pathname.split('/')[3];
    
    const redirect = redirects.get(id);
    if (redirect) {
      shortCodeIndex.delete(redirect.shortCode);
    }
    
    if (redirects.delete(id)) {
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Redirect not found');
    }
    return;
  }

  // Handle redirects
  if (pathname && pathname.length > 1 && method === 'GET') {
    const shortCode = pathname.substring(1);
    
    const redirectId = shortCodeIndex.get(shortCode);
    if (redirectId) {
      const redirect = redirects.get(redirectId);
      if (redirect) {
        res.writeHead(302, { 'Location': redirect.targetUrl });
        res.end();
        return;
      }
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`🚀 Evotrix Redirect server running at http://localhost:${PORT}`);
  console.log('Set API_KEY environment variable to change the default API key');
  if (API_KEY === 'your-secure-api-key-here') {
    console.log('⚠️  WARNING: Using default API key! Set API_KEY environment variable for production.');
  }
});
