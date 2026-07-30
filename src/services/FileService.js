import axios from "axios";


const API = "https://connectx-backend-1-nv31.onrender.com/api/files";
export const uploadFile = async (file, token) => {

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
        `${API}/upload`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;
};