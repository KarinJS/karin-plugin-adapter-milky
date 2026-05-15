import type { Client } from '@/core/client'

/**
 * 分页扫描群通知列表，定位指定 notification_seq 的通知。
 * 同时检查过滤/未过滤两条流，最多翻 50 页防御性兜底。
 *
 * milky 的 getGroupNotifications 没有按 seq 查询的入口，
 * 而 Karin 的 setGroupApplyResult / setInvitedJoinGroupResult 只拿到 seq，
 * 所以必须扫描分页才能拿到 group_id / is_filtered 这些 accept/reject API 必需的字段。
 */
export async function findGroupNotification (client: Client, seq: number) {
  for (const isFiltered of [false, true]) {
    let next: number | undefined
    for (let i = 0; i < 50; i++) {
      const res = await client.getGroupNotifications(next, isFiltered, 20)
      const found = res.notifications.find(v => v.notification_seq === seq)
      if (found) return { req: found, isFiltered }
      if (!res.next_notification_seq || res.notifications.length === 0) break
      next = res.next_notification_seq
    }
  }
  return null
}
