import { isLogin, getUserProfile, updateUserProfile } from "../lib/firebaseCommon.js";

export async function loadProfile(uid) {
  const data = await getUserProfile();
  if (!data) {
    console.error("User profile not found");
    return;
  }

  document.getElementById("profileUsername").innerText = data.username || "Unknown";
  document.getElementById("profileMBTI").innerText = data.mbtiType || "---";
  document.getElementById("profileAvatar").src = "../images/" + data.avatar || "../images/default.png";
  // document.getElementById("profileActivities").innerText = "Coming soon!";

}
