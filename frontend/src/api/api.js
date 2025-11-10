import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || "https://p-id-marker-production.up.railway.app/api";

export const uploadPDF = (file, filename) => {
  const formData = new FormData();
  formData.append("pdf_file", file);
  formData.append("filename", filename);
  return axios.post(`${BASE_URL}/pid_documents/`, formData);
};

export const getPDFs = () => axios.get(`${BASE_URL}/pid_documents/`);

export const deletePDF = (docId) => axios.delete(`${BASE_URL}/pid_documents/${docId}`);

export const addElement = (element) => axios.post(`${BASE_URL}/elements/`, element);

export const getElementsByDoc = (docId) => axios.get(`${BASE_URL}/elements/by_doc/${docId}`);

export const updateElement = (elementId, element) => axios.put(`${BASE_URL}/elements/${elementId}`, element);

export const deleteElement = (elementId) => axios.delete(`${BASE_URL}/elements/${elementId}`);

// Attachment methods
export const uploadAttachment = (file, filename, file_type, element_id) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", filename);
  formData.append("file_type", file_type);
  formData.append("element_id", element_id);
  return axios.post(`${BASE_URL}/attachments/`, formData);
};

export const getAttachmentsByElement = (element_id) => axios.get(`${BASE_URL}/attachments/by_element/${element_id}`);

export const deleteAttachment = (attachmentId) => axios.delete(`${BASE_URL}/attachments/${attachmentId}`);

export const addComment = (comment) => axios.post(`${BASE_URL}/comments/`, comment);

export const getCommentsByElement = (element_id) => axios.get(`${BASE_URL}/comments/by_element/${element_id}`);
