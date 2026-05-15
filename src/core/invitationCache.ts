/**
 * 邀请自身入群事件的内存缓存：invitation_seq → group_id
 *
 * milky 的 `accept_group_invitation` API 需要 group_id，
 * 但 Karin 的 `setInvitedJoinGroupResult(requestId, isApprove)` 只传 invitation_seq，
 * 所以适配器收到 group_invitation 事件时把 (seq → groupId) 入缓存，
 * setInvitedJoinGroupResult 时再 pop 取回。
 */
export class InvitationCache {
  #map = new Map<number, number>()

  stash (invitationSeq: number, groupId: number): void {
    this.#map.set(invitationSeq, groupId)
  }

  pop (invitationSeq: number): number | undefined {
    const v = this.#map.get(invitationSeq)
    if (v !== undefined) this.#map.delete(invitationSeq)
    return v
  }
}
