import api from "@/shared/lib/axiosInstance";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface LastBackupInfo {
  timestamp: string;
  details: string;
  performedBy: string;
}

export const fetchLastBackup = async (): Promise<LastBackupInfo> => {
  const { data } = await api.get("/admin/database/last-backup");
  return data;
};

export const fetchLastRestore = async (): Promise<LastBackupInfo> => {
  const { data } = await api.get("/admin/database/last-restore");
  return data;
};

export const downloadBackup = async (password: string): Promise<void> => {
  const response = await api.post("/admin/database/backup", { currentPassword: password }, {
    responseType: "blob",
    timeout: 1800000, // 30 minutes
  });

  const blob = response.data as Blob;
  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  let filename = "backup.dump";
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Uses raw axios instead of the configured instance to avoid the default
// Content-Type: application/json header — restore requires multipart/form-data.
export const restoreBackup = async (file: File, password: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("currentPassword", password);

  const token = localStorage.getItem("authToken");

  try {
    const response = await axios.post(`${BASE_URL}/admin/database/restore`, formData, {
      timeout: 1800000, // 30 minutes
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return (response.data as { message: string }).message;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const serverMessage = error.response.data;
      if (typeof serverMessage === "string") {
        throw new Error(serverMessage);
      }
      if (typeof serverMessage === "object") {
        const messages = Object.values(serverMessage).flat().join(", ");
        if (messages) throw new Error(messages);
      }
    }
    throw error;
  }
};
