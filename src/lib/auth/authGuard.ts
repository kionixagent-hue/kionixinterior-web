export function shouldRedirectToLogin(pathname: string, hasUser: boolean): boolean {
  if (!pathname.startsWith('/admin')) return false
  if (pathname.startsWith('/admin/login')) return false
  return !hasUser
}
