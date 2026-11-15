export const guestMockProfile = {
  fullName: 'Khách',
  studentIrn: '9999010120091',
  passwordMock: 'guest',
}

export function getMockLoginError(profile, studentIrn, password) {
  if (typeof profile?.studentIrn !== 'string' || !profile.studentIrn.trim() ||
      typeof profile?.passwordMock !== 'string' || !profile.passwordMock) {
    return 'Tài khoản chưa có mã thí sinh hoặc mật khẩu luyện tập. Vui lòng liên hệ quản trị viên.'
  }
  if (studentIrn.trim() !== profile.studentIrn.trim() || password !== profile.passwordMock) {
    return 'Mã thí sinh hoặc mật khẩu luyện tập không đúng.'
  }
  return ''
}
