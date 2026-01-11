import {
  GetFriendInfoOutput,
  GetHistoryMessagesOutput,
  GetMessageOutput,
  GetPrivateFileDownloadUrlOutput,
  GetUserProfileOutput,
  OutgoingSegment,
  SendPrivateMessageOutput,
  UploadPrivateFileOutput,
} from '@saltify/milky-types'

export type FriendApi = {
  sendMsg: (message: OutgoingSegment[]) => Promise<SendPrivateMessageOutput>
  recall: (messageSeq: number) => Promise<any>
  getInfo: (noCache?: boolean) => Promise<GetFriendInfoOutput>
  getProfile: () => Promise<GetUserProfileOutput>
  nudge: (isSelf?: boolean) => Promise<any>
  like: (count?: number) => Promise<any>
  getMessage: (messageSeq: number) => Promise<GetMessageOutput>
  getHistory: (start?: number, limit?: number) => Promise<GetHistoryMessagesOutput>
  markRead: (messageSeq: number) => Promise<any>
  uploadFile: (fileUri: string, fileName: string) => Promise<UploadPrivateFileOutput>
  getFileDownloadUrl: (fileId: string, fileHash: string) => Promise<GetPrivateFileDownloadUrlOutput>
}

type FriendClientLike = {
  sendPrivateMessage: (userId: number, message: OutgoingSegment[]) => Promise<SendPrivateMessageOutput>
  recallPrivateMessage: (userId: number, messageSeq: number) => Promise<any>
  getFriendInfo: (userId: number, noCache?: boolean) => Promise<GetFriendInfoOutput>
  getUserProfile: (userId: number) => Promise<GetUserProfileOutput>
  sendFriendNudge: (userId: number, isSelf?: boolean) => Promise<any>
  sendProfileLike: (userId: number, count?: number) => Promise<any>
  getMessage: (messageScene: 'friend', peerId: number, messageSeq: number) => Promise<GetMessageOutput>
  getHistoryMessage: (
    messageScene: 'friend',
    peerId: number,
    start?: number,
    limit?: number,
  ) => Promise<GetHistoryMessagesOutput>
  markMessageAsRead: (messageScene: 'friend', peerId: number, messageSeq: number) => Promise<any>
  uploadPrivateFile: (userId: number, fileUri: string, fileName: string) => Promise<UploadPrivateFileOutput>
  getPrivateFileDownloadUrl: (userId: string, fileId: string, fileHash: string) => Promise<GetPrivateFileDownloadUrlOutput>
}

export function createFriendApi (client: FriendClientLike, userId: number): FriendApi {
  const uid = +userId

  const methods: FriendApi = {
    sendMsg: (message) => client.sendPrivateMessage(uid, message),
    recall: (messageSeq) => client.recallPrivateMessage(uid, messageSeq),
    getInfo: (noCache) => client.getFriendInfo(uid, noCache),
    getProfile: () => client.getUserProfile(uid),
    nudge: (isSelf = false) => client.sendFriendNudge(uid, isSelf),
    like: (count = 1) => client.sendProfileLike(uid, count),
    getMessage: (messageSeq) => client.getMessage('friend', uid, messageSeq),
    getHistory: (start, limit = 20) => client.getHistoryMessage('friend', uid, start, limit),
    markRead: (messageSeq) => client.markMessageAsRead('friend', uid, messageSeq),
    uploadFile: (fileUri, fileName) => client.uploadPrivateFile(uid, fileUri, fileName),
    getFileDownloadUrl: (fileId, fileHash) =>
      client.getPrivateFileDownloadUrl(String(uid), fileId, fileHash),
  }

  const proxy = new Proxy({}, {
    get (_target, prop) {
      const fn = (methods as any)[prop as any]
      if (fn) return fn
      return undefined
    },
  }) as FriendApi

  return proxy
}
