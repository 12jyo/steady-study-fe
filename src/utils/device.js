export function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    // Generate unique device id once per browser
    id = "WEB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem("deviceId", id);
  }
  return id;
}