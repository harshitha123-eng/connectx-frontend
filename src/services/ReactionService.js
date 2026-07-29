import api from "../api/axios";

const BASE_URL = "/reactions";

export const addReaction = (reactionData) => {
    return api.post(BASE_URL, reactionData);
};

export const getReactions = (messageId) => {
    return api.get(`${BASE_URL}/${messageId}`);
};