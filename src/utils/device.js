import { v4 as uuidv4 } from "uuid";

export function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    // Generate unique device id once per browser
    id = "WEB-" + uuidv4();
    localStorage.setItem("deviceId", id);
  }
  return id;
}