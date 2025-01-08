// Simple encryption using base64 with a salt
export const encryptData = (data: string): string => {
  const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'default-salt';
  const saltedData = `${salt}:${data}`;
  return Buffer.from(saltedData).toString('base64');
};

export const decryptData = (encryptedData: string): string => {
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString();
    const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'default-salt';
    const [prefix, data] = decoded.split(':');
    
    if (prefix !== salt) {
      throw new Error('Invalid encrypted data');
    }
    
    return data;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}; 