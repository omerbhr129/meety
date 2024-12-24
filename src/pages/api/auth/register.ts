import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004'}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to register');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
