import axiosInstance from './axiosInstance';

export const getGroupsApi         = async ()           => (await axiosInstance.get('/groups')).data;
export const createGroupApi       = async (data)       => (await axiosInstance.post('/groups', data)).data;
export const getGroupApi          = async (id)         => (await axiosInstance.get(`/groups/${id}`)).data;
export const deleteGroupApi       = async (id)         => (await axiosInstance.delete(`/groups/${id}`)).data;
export const addGroupExpenseApi   = async (id, data)   => (await axiosInstance.post(`/groups/${id}/expenses`, data)).data;
export const deleteGroupExpenseApi = async (id, expId) => (await axiosInstance.delete(`/groups/${id}/expenses/${expId}`)).data;
export const closeGroupApi        = async (id)         => (await axiosInstance.post(`/groups/${id}/close`)).data;
export const getMyInvitesApi      = async ()           => (await axiosInstance.get('/invites')).data;
export const acceptInviteApi      = async (groupId)    => (await axiosInstance.post(`/invites/${groupId}/accept`)).data;
export const declineInviteApi     = async (groupId)    => (await axiosInstance.post(`/invites/${groupId}/decline`)).data;