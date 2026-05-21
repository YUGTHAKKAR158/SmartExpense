import axiosInstance from './axiosInstance';

export const getGroupsApi = async () => {
  const response = await axiosInstance.get('/groups');
  return response.data;
};

export const createGroupApi = async (groupData) => {
  const response = await axiosInstance.post('/groups', groupData);
  return response.data;
};

export const getGroupApi = async (id) => {
  const response = await axiosInstance.get(`/groups/${id}`);
  return response.data;
};

export const deleteGroupApi = async (id) => {
  const response = await axiosInstance.delete(`/groups/${id}`);
  return response.data;
};

export const addGroupExpenseApi = async (groupId, expenseData) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/expenses`, expenseData
  );
  return response.data;
};

export const deleteGroupExpenseApi = async (groupId, expenseId) => {
  const response = await axiosInstance.delete(
    `/groups/${groupId}/expenses/${expenseId}`
  );
  return response.data;
};

export const closeGroupApi = async (groupId) => {
  const response = await axiosInstance.post(`/groups/${groupId}/close`);
  return response.data;
};

export const updateMemberApi = async (groupId, memberId, memberData) => {
  const response = await axiosInstance.patch(
    `/groups/${groupId}/members/${memberId}`, memberData
  );
  return response.data;
};

export const updateGroupExpenseApi = async (groupId, expenseId, expenseData) => {
  const response = await axiosInstance.patch(
    `/groups/${groupId}/expenses/${expenseId}`, expenseData
  );
  return response.data;
};

export const addMemberApi = async (groupId, memberData) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/members`, memberData
  );
  return response.data;
};

export const deleteMemberApi = async (groupId, memberId) => {
  const response = await axiosInstance.delete(
    `/groups/${groupId}/members/${memberId}`
  );
  return response.data;
};

export const getMemberSummaryApi = async (groupId, memberId) => {
  const response = await axiosInstance.get(
    `/groups/${groupId}/members/${memberId}/summary`
  );
  return response.data;
};

export const inviteFriendApi = async (groupId, email) => {
  const response = await axiosInstance.post(`/groups/${groupId}/invite`, { email });
  return response.data;
};

export const getMyInvitesApi = async () => {
  const response = await axiosInstance.get('/invites');
  return response.data;
};

export const acceptInviteApi = async (groupId) => {
  const response = await axiosInstance.post(`/invites/${groupId}/accept`);
  return response.data;
};

export const declineInviteApi = async (groupId) => {
  const response = await axiosInstance.post(`/invites/${groupId}/decline`);
  return response.data;
};

export const removeCollaboratorApi = async (groupId, collaboratorId) => {
  const response = await axiosInstance.delete(
    `/groups/${groupId}/collaborators/${collaboratorId}`
  );
  return response.data;
};

export const generateShareLinkApi = async (groupId) => {
  const response = await axiosInstance.post(`/groups/${groupId}/share`);
  return response.data;
};

export const revokeShareLinkApi = async (groupId) => {
  const response = await axiosInstance.delete(`/groups/${groupId}/share`);
  return response.data;
};

export const getPublicSummaryApi = async (token) => {
  // No auth header needed — public endpoint
  const response = await axiosInstance.get(`/share/${token}`);
  return response.data;
};