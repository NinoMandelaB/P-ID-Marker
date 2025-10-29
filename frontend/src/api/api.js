import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export const uploadPDF = (file, filename) => {
  const formData = new FormData();
  formData.append("pdf_file", file);
  formData.append("filename", filename);
  return axios.post(`${BASE_URL}/pid_documents/`, formData);
};

export const getPDFs = () => axios.get(`${BASE_URL}/pid_documents/`);

export const addElement = (element) => axios.post(`${BASE_URL}/elements/`, element);

export const getElementsByDoc = (docId) => axios.get(`${BASE_URL}/elements/by_doc/${docId}`);

export const uploadAttachment = (file, filename, file_type, element_id) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", filename);
  formData.append("file_type", file_type);
  formData.append("element_id", element_id);
  return axios.post(`${BASE_URL}/attachments/`, formData);
};

export const addComment = (comment) => axios.post(`${BASE_URL}/comments/`, comment);

export const getCommentsByElement = (element_id) => axios.get(`${BASE_URL}/comments/by_element/${element_id}`);
