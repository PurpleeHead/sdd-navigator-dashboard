export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? '';
export const DATA_MODE: 'api' | 'mock' = API_BASE_URL ? 'api' : 'mock';
