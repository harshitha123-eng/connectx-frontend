import API from "../api/axios";

export const loginUser = (loginData) => {
    return API.post("/auth/login", loginData);
};

// Register
export const registerUser = (registerData) => {
    return API.post("/auth/register", registerData);
};