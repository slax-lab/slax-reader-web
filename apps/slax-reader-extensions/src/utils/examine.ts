import type { UserInfo } from '@commons/types/interface'

export const examineSideBarAction = async (type: string, userInfo: UserInfo | null) => {
  return !!type
}
