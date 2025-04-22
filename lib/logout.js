export function logout(response) {
  response.cookies.delete("auth_token");
}
