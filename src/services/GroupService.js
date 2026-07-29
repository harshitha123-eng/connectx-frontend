import axios from "../api/axios";

const BASE_URL = "/groups";

export const createGroup = async (groupData) => {
    const response = await axios.post(BASE_URL, groupData);
    return response.data;
};

export const getGroupById = async (groupId) => {
    const response = await axios.get(`${BASE_URL}/${groupId}`);
    return response.data;
};

export const getGroupsByUser = async (userId) => {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
};

export const getGroupMembers = async (groupId) => {
    const response = await axios.get(`${BASE_URL}/${groupId}/members`);
    return response.data;
};

export const addMember = async (groupId, userId, adminId) => {
    const response = await axios.put(
        `${BASE_URL}/${groupId}/members/${userId}?adminId=${adminId}`
    );
    return response.data;
};

export const removeMember = async (groupId, userId, adminId) => {
    const response = await axios.delete(
        `${BASE_URL}/${groupId}/members/${userId}?adminId=${adminId}`
    );
    return response.data;
};

export const updateGroup = async (groupId, groupData) => {
    const response = await axios.put(
        `${BASE_URL}/${groupId}`,
        groupData
    );
    return response.data;
};

export const leaveGroup = async (groupId, userId) => {
    const response = await axios.delete(
        `${BASE_URL}/${groupId}/leave/${userId}`
    );
    return response.data;
};

export const deleteGroup = async (groupId, adminId) => {
    const response = await axios.delete(
        `${BASE_URL}/${groupId}?adminId=${adminId}`
    );
    return response.data;
};