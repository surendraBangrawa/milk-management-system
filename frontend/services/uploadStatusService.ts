// Simplified upload status service - no polling or WebSocket tracking
// The rate list page will handle data fetching on page load and pull-to-refresh

class UploadStatusService {
  // This service is now minimal since we're not using polling or WebSocket tracking
  // The rate list page handles data fetching directly
}

export const uploadStatusService = new UploadStatusService();
