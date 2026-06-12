import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Customers
export const getCustomers = () => API.get('/customers');
export const getSegments = () => API.get('/segments');

// Insights
export const getInsights = () => API.get('/insights');

// Campaigns
export const getCampaigns = () => API.get('/campaigns');
export const getCampaign = (id) => API.get(`/campaigns/${id}`);
export const createCampaign = (data) => API.post('/campaigns', data);
export const fireCampaign = (id) => API.post(`/campaigns/${id}/fire`);
export const createCampaignFromChat = (data) => API.post('/campaigns/from-chat', data);

// Chat
export const sendChatMessage = (message, history) =>
  API.post('/chat', { message, history });

// SSE Stream
export const streamCampaign = (campaignId, onUpdate) => {
  const es = new EventSource(
    `http://localhost:5000/api/campaigns/${campaignId}/stream`
  );
  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type !== 'heartbeat') {
      onUpdate(data);
    }
  };
  es.onerror = () => es.close();
  return es;
};