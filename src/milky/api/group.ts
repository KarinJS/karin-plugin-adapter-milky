import {
  CreateGroupFolderOutput,
  GetGroupAnnouncementsOutput,
  GetGroupEssenceMessagesOutput,
  GetGroupFileDownloadUrlOutput,
  GetGroupFilesOutput,
  GetGroupInfoOutput,
  GetGroupMemberInfoOutput,
  GetGroupMemberListOutput,
  OutgoingSegment,
  SendGroupMessageOutput,
  UploadGroupFileOutput,
} from '@saltify/milky-types'

export type GroupApi = {
  sendMsg: (message: OutgoingSegment[]) => Promise<SendGroupMessageOutput>
  recall: (messageSeq: number) => Promise<any>
  getInfo: (noCache?: boolean) => Promise<GetGroupInfoOutput>
  getMemberList: (noCache?: boolean) => Promise<GetGroupMemberListOutput>
  getMemberInfo: (userId: number, noCache?: boolean) => Promise<GetGroupMemberInfoOutput>
  setName: (name: string) => Promise<any>
  setAvatar: (uri: string) => Promise<any>
  setCard: (userId: number, card: string) => Promise<any>
  setSpecialTitle: (userId: number, title: string) => Promise<any>
  setAdmin: (userId: number, isSet?: boolean) => Promise<any>
  mute: (userId: number, duration?: number) => Promise<any>
  wholeMute: (isMute?: boolean) => Promise<any>
  kick: (userId: number, rejectRequest?: boolean) => Promise<any>
  getAnnouncements: () => Promise<GetGroupAnnouncementsOutput>
  sendAnnouncement: (content: string, uri?: string) => Promise<any>
  deleteAnnouncement: (id: string) => Promise<any>
  getEssenceMessages: (pageIndex: number, pageSize: number) => Promise<GetGroupEssenceMessagesOutput>
  setEssenceMessage: (messageSeq: number, isSet?: boolean) => Promise<any>
  quit: () => Promise<any>
  setMessageReaction: (messageSeq: number, reaction: string, isAdd?: boolean) => Promise<any>
  sendNudge: (userId: number) => Promise<any>
  acceptRequest: (
    noticeId: number,
    noticeType: 'join_request' | 'invited_join_request',
    isFiltered?: boolean,
  ) => Promise<any>
  rejectRequest: (
    noticeId: number,
    noticeType: 'join_request' | 'invited_join_request',
    isFiltered?: boolean,
    reason?: string,
  ) => Promise<any>
  acceptInvitation: (invitationSeq: number) => Promise<any>
  rejectInvitation: (invitationSeq: number) => Promise<any>
  getFileDownloadUrl: (fileId: string) => Promise<GetGroupFileDownloadUrlOutput>
  uploadFile: (folderId: string | undefined, fileUri: string, fileName: string) => Promise<UploadGroupFileOutput>
  getFiles: (folderId?: string) => Promise<GetGroupFilesOutput>
  moveFile: (fileId: string, folderId?: string, targetId?: string) => Promise<any>
  renameFile: (fileId: string, folderId: string | undefined, newName: string) => Promise<any>
  deleteFile: (fileId: string) => Promise<any>
  createFolder: (folderName: string) => Promise<CreateGroupFolderOutput>
  renameFolder: (folderId: string, newName: string) => Promise<any>
  deleteFolder: (folderId: string) => Promise<any>
}

type GroupClientLike = {
  sendGroupMessage: (groupId: number, message: OutgoingSegment[]) => Promise<SendGroupMessageOutput>
  recallGroupMessage: (groupId: number, messageSeq: number) => Promise<any>
  getGroupInfo: (groupId: number, noCache?: boolean) => Promise<GetGroupInfoOutput>
  getGroupMemberList: (groupId: number, noCache?: boolean) => Promise<GetGroupMemberListOutput>
  getGroupMemberInfo: (groupId: number, userId: number, noCache?: boolean) => Promise<GetGroupMemberInfoOutput>
  setGroupName: (groupId: number, name: string) => Promise<any>
  setGroupAvatar: (groupId: number, uri: string) => Promise<any>
  setGroupMemberCard: (groupId: number, userId: number, card: string) => Promise<any>
  setGroupMemberSpecialTitle: (groupId: number, userId: number, title: string) => Promise<any>
  setGroupMemberAdmin: (groupId: number, userId: number, isSet?: boolean) => Promise<any>
  setGroupMemberMute: (groupId: number, userId: number, duration?: number) => Promise<any>
  setGroupWholeMute: (groupId: number, isMute?: boolean) => Promise<any>
  kickGroupMember: (groupId: number, userId: number, rejectRequest?: boolean) => Promise<any>
  getGroupAnnouncements: (groupId: number) => Promise<GetGroupAnnouncementsOutput>
  sendGroupAnnouncement: (groupId: number, content: string, uri?: string) => Promise<any>
  deleteGroupAnnouncement: (groupId: number, id: string) => Promise<any>
  getGroupEssenceMessages: (groupId: number, pageIndex: number, pageSize: number) => Promise<GetGroupEssenceMessagesOutput>
  setGroupEssenceMessage: (groupId: number, messageSeq: number, isSet?: boolean) => Promise<any>
  quitGroup: (groupId: number) => Promise<any>
  setGroupMessageReaction: (groupId: number, messageSeq: number, reaction: string, isAdd?: boolean) => Promise<any>
  sendGroupNudge: (groupId: number, userId: number) => Promise<any>
  acceptGroupRequest: (
    noticeId: number,
    noticeType: 'join_request' | 'invited_join_request',
    groupId: number,
    isFiltered?: boolean,
  ) => Promise<any>
  rejectGroupRequest: (
    noticeId: number,
    noticeType: 'join_request' | 'invited_join_request',
    groupId: number,
    isFiltered?: boolean,
    reason?: string,
  ) => Promise<any>
  acceptGroupInvitation: (groupId: number, invitationSeq: number) => Promise<any>
  rejectGroupInvitation: (groupId: number, invitationSeq: number) => Promise<any>
  getGroupFileDownloadUrl: (groupId: number, fileId: string) => Promise<GetGroupFileDownloadUrlOutput>
  uploadGroupFile: (groupId: number, folderId: string | undefined, fileUri: string, fileName: string) => Promise<UploadGroupFileOutput>
  getGroupFiles: (groupId: number, folderId?: string) => Promise<GetGroupFilesOutput>
  moveGroupFile: (groupId: number, fileId: string, folderId?: string, targetId?: string) => Promise<any>
  renameGroupFile: (groupId: number, fileId: string, folderId: string | undefined, newName: string) => Promise<any>
  deleteGroupFile: (groupId: number, fileId: string) => Promise<any>
  createGroupFolder: (groupId: number, folderName: string) => Promise<CreateGroupFolderOutput>
  renameGroupFolder: (groupId: number, folderId: string, newName: string) => Promise<any>
  deleteGroupFolder: (groupId: number, folderId: string) => Promise<any>
}

export function createGroupApi (client: GroupClientLike, groupId: number): GroupApi {
  const gid = +groupId

  const methods: GroupApi = {
    sendMsg: (message) => client.sendGroupMessage(gid, message),
    recall: (messageSeq) => client.recallGroupMessage(gid, messageSeq),
    getInfo: (noCache) => client.getGroupInfo(gid, noCache),
    getMemberList: (noCache) => client.getGroupMemberList(gid, noCache),
    getMemberInfo: (userId, noCache) => client.getGroupMemberInfo(gid, userId, noCache),
    setName: (name) => client.setGroupName(gid, name),
    setAvatar: (uri) => client.setGroupAvatar(gid, uri),
    setCard: (userId, card) => client.setGroupMemberCard(gid, userId, card),
    setSpecialTitle: (userId, title) => client.setGroupMemberSpecialTitle(gid, userId, title),
    setAdmin: (userId, isSet) => client.setGroupMemberAdmin(gid, userId, isSet),
    mute: (userId, duration = 0) => client.setGroupMemberMute(gid, userId, duration),
    wholeMute: (isMute = true) => client.setGroupWholeMute(gid, isMute),
    kick: (userId, rejectRequest = false) => client.kickGroupMember(gid, userId, rejectRequest),
    getAnnouncements: () => client.getGroupAnnouncements(gid),
    sendAnnouncement: (content, uri) => client.sendGroupAnnouncement(gid, content, uri),
    deleteAnnouncement: (id) => client.deleteGroupAnnouncement(gid, id),
    getEssenceMessages: (pageIndex, pageSize) => client.getGroupEssenceMessages(gid, pageIndex, pageSize),
    setEssenceMessage: (messageSeq, isSet = true) => client.setGroupEssenceMessage(gid, messageSeq, isSet),
    quit: () => client.quitGroup(gid),
    setMessageReaction: (messageSeq, reaction, isAdd = true) => client.setGroupMessageReaction(gid, messageSeq, reaction, isAdd),
    sendNudge: (userId) => client.sendGroupNudge(gid, userId),
    acceptRequest: (noticeId, noticeType, isFiltered = false) =>
      client.acceptGroupRequest(noticeId, noticeType, gid, isFiltered),
    rejectRequest: (noticeId, noticeType, isFiltered = false, reason) =>
      client.rejectGroupRequest(noticeId, noticeType, gid, isFiltered, reason),
    acceptInvitation: (invitationSeq) => client.acceptGroupInvitation(gid, invitationSeq),
    rejectInvitation: (invitationSeq) => client.rejectGroupInvitation(gid, invitationSeq),
    getFileDownloadUrl: (fileId) => client.getGroupFileDownloadUrl(gid, fileId),
    uploadFile: (folderId = '/', fileUri, fileName) => client.uploadGroupFile(gid, folderId, fileUri, fileName),
    getFiles: (folderId = '/') => client.getGroupFiles(gid, folderId),
    moveFile: (fileId, folderId = '/', targetId = '/') => client.moveGroupFile(gid, fileId, folderId, targetId),
    renameFile: (fileId, folderId = '/', newName) => client.renameGroupFile(gid, fileId, folderId, newName),
    deleteFile: (fileId) => client.deleteGroupFile(gid, fileId),
    createFolder: (folderName) => client.createGroupFolder(gid, folderName),
    renameFolder: (folderId, newName) => client.renameGroupFolder(gid, folderId, newName),
    deleteFolder: (folderId) => client.deleteGroupFolder(gid, folderId),
  }

  const proxy = new Proxy({}, {
    get<T extends keyof GroupApi> (_target: any, prop: T) {
      const fn = (methods)[prop]
      if (fn) return fn
      return undefined
    },
  }) as GroupApi

  return proxy
}
