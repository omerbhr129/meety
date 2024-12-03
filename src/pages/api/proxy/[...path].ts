import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { IncomingMessage } from 'http';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001']
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(
  req: NextApiRequest, 
  res: NextApiResponse, 
  fn: (
    req: NextApiRequest,
    res: NextApiResponse,
    callback: (result: Error | unknown) => void
  ) => void
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: Error | unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Create proxy instance with custom error handling
const proxy = httpProxy.createProxy({
  timeout: 30000,
  proxyTimeout: 30000,
  secure: false,
  followRedirects: true,
  autoRewrite: true,
  changeOrigin: true,
  ws: false
});

// Configure target based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';

// Configure API route
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Main handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Run the CORS middleware
    await runMiddleware(req, res, cors);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Log the request
    console.log('=== New Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', {
      ...req.headers,
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]'
    });

    // For POST requests, log the body
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          console.log('Body:', parsedBody);
        } catch (e) {
          console.log('Raw body:', body);
        }
      });
    }

    console.log('Query:', req.query);
    console.log('==================\n');

    // Don't forward cookies to the API
    delete req.headers.cookie;

    // Remove set-cookie header if it exists
    delete req.headers['set-cookie'];

    // Rewrite the URL to remove /api/proxy from the path
    const pathname = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path;

    const target = `${API_URL}/${pathname}`;
    console.log('Proxying to:', target);

    return new Promise((resolve, reject) => {
      // Configure proxy options
      const proxyOptions = {
        target: API_URL,
        changeOrigin: true,
        xfwd: true,
        proxyTimeout: 30000,
        timeout: 30000,
        secure: false,
        followRedirects: true,
        autoRewrite: true,
        headers: {
          ...Object.fromEntries(
            Object.entries(req.headers)
              .filter(([key]) => key !== 'set-cookie')
              .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
          ),
          host: new URL(API_URL).host,
        },
      };

      // Add CORS headers to response
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

      // Handle the proxy response
      proxy.once('proxyRes', (proxyRes: IncomingMessage) => {
        console.log('Proxy response:', {
          status: proxyRes.statusCode,
          headers: proxyRes.headers
        });

        let responseBody = '';
        proxyRes.on('data', chunk => {
          responseBody += chunk;
        });

        proxyRes.on('end', () => {
          try {
            // Try to parse and log the response body
            const data = JSON.parse(responseBody);
            console.log('Response body:', data);

            // Check if the response is in the expected format for participant creation
            if (req.url?.includes('/participants') && req.method === 'POST') {
              if (!data.participant?._id) {
                console.error('Invalid participant response format:', data);
                res.status(500).json({
                  message: 'Invalid response format from server',
                  received: data
                });
                return resolve(undefined);
              }
            }
          } catch (e) {
            console.log('Raw response body:', responseBody);
          }
          resolve(undefined);
        });
      });

      // Forward the request
      proxy.web(req, res, proxyOptions, (err: Error) => {
        console.error('Proxy error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Proxy error',
            error: err.message
          });
        }
        reject(err);
      });

      // Handle proxy errors
      proxy.on('error', (err: Error) => {
        console.error('Proxy error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            message: 'Proxy error',
            error: err.message
          });
        }
        reject(err);
      });

      // Handle proxy request
      proxy.on('proxyReq', () => {
        console.log('Proxy request:', {
          method: req.method,
          url: req.url,
          headers: {
            ...req.headers,
            authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]'
          }
        });
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
