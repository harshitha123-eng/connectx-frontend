import API from "../api/axios";

export const getAllUsers = () => {
    return API.get("/users");
};
export const getOnlineUsers = () => {
    return API.get("/users/online-users");
};