import API from "../api/axios";

export const getConversation = (user1, user2) => {
    return API.get(`/messages/conversation?user1=${user1}&user2=${user2}`);
};

export const searchPrivateMessages = (user1, user2, keyword) => {
    return API.get("/messages/search/private", {
        params: {
            user1,
            user2,
            keyword
        }
    });
};

export const getGroupMessages = (groupId) => {
    return API.get(`/messages/group/${groupId}`);
};

export const searchGroupMessages = (groupId, keyword) => {
    return API.get("/messages/search/group", {
        params: {
            groupId,
            keyword
        }
    });
};

export const sendMessage = (message) => {
    return API.post("/messages", message);
};