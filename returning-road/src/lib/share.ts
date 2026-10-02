/**
 * 공유: 휴대폰에서는 기기의 공유 창을, 그 밖에서는 링크 복사를 쓴다.
 * 둘 다 막혀 있으면(예: claude.ai 아티팩트 안) 링크를 화면에 보여 주고 직접 복사하게 한다.
 */

/**
 * 공유할 주소의 바탕. 빌드할 때 VITE_SHARE_URL로 정할 수 있다.
 * (아티팩트는 실제 페이지 주소가 아니라 claude.ai 링크를 공유해야 하므로 빌드 때 넣어 준다.)
 */
export function shareBaseUrl(): string {
  const configured = import.meta.env.VITE_SHARE_URL as string | undefined
  if (configured) return configured.replace(/#.*$/, '')
  return window.location.origin + window.location.pathname
}

export const testLink = () => shareBaseUrl()
export const resultLink = (code: string) => `${shareBaseUrl()}#${code}`

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual'

export async function shareLink(data: { title: string; text: string; url: string }): Promise<ShareOutcome> {
  const canNativeShare =
    typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))
  if (canNativeShare) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // 공유 창이 막혀 있으면 복사로 넘어간다
    }
  }
  try {
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'manual'
  }
}
