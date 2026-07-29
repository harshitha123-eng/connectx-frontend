import api from "../api/axios";

export const getNotifications = (userId) => {
    return api.get(`/notifications/${userId}`);
};

export const markAllNotificationsRead = (userId) => {
    return api.put(`/notifications/receiver/${userId}/read-all`);
};