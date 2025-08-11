import axios from 'axios';

// Define the PCCParams type to match backend
export interface PCCParams {
  bending_angles: number[];
  rotation_angles: number[];
  backbone_lengths: number[];
  coupling_lengths: number[];
  discretization_steps: number;
}

// Define the API response type
export interface PCCResponse {
  segments: number[][][];
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export const robotAPI = {
  computePCC: async (params: PCCParams): Promise<PCCResponse> => {
    const response = await apiClient.post('/pcc', params);
    return response.data as PCCResponse;
  }
};
