import axiosInstance from './axiosInstance';

export const scanReceiptApi = (imageAsset) => {
  const formData = new FormData();
  formData.append('receipt', {
    uri:  imageAsset.uri,
    type: imageAsset.type || 'image/jpeg',
    name: imageAsset.fileName || 'receipt.jpg',
  });

  return axiosInstance.post('/receipts/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000, // OCR can take up to 60-90 seconds on first run
  });
};
