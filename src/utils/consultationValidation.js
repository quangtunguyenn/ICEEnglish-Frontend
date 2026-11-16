export function validateConsultation(values, currentYear) {
  const studentFullname = String(values.get("studentName") ?? "").trim().replace(/\s+/gu, " ");
  const birthYear = String(values.get("birthYear") ?? "").trim();
  const score = String(values.get("targetScore") ?? "").trim();
  const phoneNumberRequest = String(values.get("phone") ?? "").trim();

  if (
    studentFullname.length > 150 ||
    !/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(studentFullname) ||
    (studentFullname.match(/\p{L}/gu) ?? []).length < 2
  ) {
    return { field: "studentName", error: "Vui lòng nhập họ tên hợp lệ, từ 2 chữ cái và không quá 150 ký tự." };
  }
  if (!/^\d{4}$/.test(birthYear) || Number(birthYear) < 1 || Number(birthYear) > currentYear) {
    return { field: "birthYear", error: `Vui lòng nhập năm sinh gồm 4 chữ số, không lớn hơn ${currentYear}.` };
  }
  if (score === "" || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 10) {
    return { field: "targetScore", error: "Điểm mục tiêu phải từ 0 đến 10." };
  }
  if (!/^\d{10}$/.test(phoneNumberRequest)) {
    return { field: "phone", error: "Số điện thoại phải gồm đúng 10 chữ số." };
  }

  return {
    payload: {
      studentFullname,
      bod: Number(birthYear),
      targetGrade: Number(score),
      phoneNumberRequest,
    },
  };
}
