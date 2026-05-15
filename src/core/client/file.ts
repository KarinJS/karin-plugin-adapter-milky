import type {
  CreateGroupFolderOutput,
  GetGroupFileDownloadUrlOutput,
  GetGroupFilesOutput,
  GetPrivateFileDownloadUrlOutput,
  UploadGroupFileOutput,
  UploadPrivateFileOutput
} from '@saltify/milky-types'
import type { ClientCtx } from './index'

export const uploadPrivateFile = (
  ctx: ClientCtx,
  userId: number,
  fileUri: string,
  fileName: string
) =>
  ctx.request<UploadPrivateFileOutput>('/upload_private_file', { user_id: +userId, file_uri: fileUri, file_name: fileName })

export const uploadGroupFile = (
  ctx: ClientCtx,
  groupId: number,
  folderId: string = '/',
  fileUri: string,
  fileName: string
) =>
  ctx.request<UploadGroupFileOutput>('/upload_group_file', { group_id: +groupId, parent_folder_id: folderId, file_uri: fileUri, file_name: fileName })

export const getPrivateFileDownloadUrl = (
  ctx: ClientCtx,
  userId: number,
  fileId: string,
  fileHash: string
) =>
  ctx.request<GetPrivateFileDownloadUrlOutput>('/get_private_file_download_url', { user_id: +userId, file_id: fileId, file_hash: fileHash })

export const getGroupFileDownloadUrl = (ctx: ClientCtx, groupId: number, fileId: string) =>
  ctx.request<GetGroupFileDownloadUrlOutput>('/get_group_file_download_url', { group_id: +groupId, file_id: fileId })

export const getGroupFiles = (ctx: ClientCtx, groupId: number, folderId: string = '/') =>
  ctx.request<GetGroupFilesOutput>('/get_group_files', { group_id: +groupId, parent_folder_id: folderId })

export const moveGroupFile = (
  ctx: ClientCtx,
  groupId: number,
  fileId: string,
  folderId: string = '/',
  targetId: string = '/'
) =>
  ctx.request('/move_group_file', { group_id: +groupId, file_id: fileId, parent_folder_id: folderId, target_folder_id: targetId })

export const renameGroupFile = (
  ctx: ClientCtx,
  groupId: number,
  fileId: string,
  folderId: string = '/',
  newName: string
) =>
  ctx.request('/rename_group_file', { group_id: +groupId, file_id: fileId, parent_folder_id: folderId, new_file_name: newName })

export const deleteGroupFile = (ctx: ClientCtx, groupId: number, fileId: string) =>
  ctx.request('/delete_group_file', { group_id: +groupId, file_id: fileId })

export const createGroupFolder = (ctx: ClientCtx, groupId: number, folderName: string) =>
  ctx.request<CreateGroupFolderOutput>('/create_group_folder', { group_id: +groupId, folder_name: folderName })

export const renameGroupFolder = (
  ctx: ClientCtx,
  groupId: number,
  folderId: string,
  newName: string
) =>
  ctx.request('/rename_group_folder', { group_id: +groupId, folder_id: folderId, new_folder_name: newName })

export const deleteGroupFolder = (ctx: ClientCtx, groupId: number, folderId: string) =>
  ctx.request('/delete_group_folder', { group_id: +groupId, folder_id: folderId })
