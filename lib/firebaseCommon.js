import { firebaseConfig } from '../env/firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore,
    onSnapshot,
    doc,
    getDoc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { getDatabase, ref, onValue, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// ログインしているか？:boolean
export function isLogin() {
    return new Promise(resolve => {
        const auth = getAuth(app);
        onAuthStateChanged(auth, user => {
            resolve(!!user); // userが存在すればtrue、いなければfalse
        });
    });
}

// メールアドレスとパスワードでログインする
export function emailLogin(email, password) {
    return new Promise(async (resolve, reject) => {
        if (await isLogin()) {
            resolve("Already logged in");
            return;
        }
        const auth = getAuth(app);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            resolve(result.user);
        } catch (error) {
            reject(error);
        }
    });
}


// ゲストアカウントでログインする
// （ログインと同時にユーザープロフィールを作成）
export function guestLogin() {
    return new Promise(async (resolve, reject) => {
        if( await isLogin()) {
            resolve("Already logged in");
            return;
        }
        const auth = getAuth(app);
        try {
            const result = await signInAnonymously(auth);
            await createUserProfile(result.user.uid, "guest@example.com", true);
            resolve(result.user);
        }
        catch (error) {
            reject(error);
        }
    });
}

// eメールアドレスとパスワードでサインアップする
export function emailSignup(email, password) {
    return new Promise(async (resolve, reject) => {
        if (await isLogin()) {
            resolve("Already logged in");
            return;
        }
        const auth = getAuth(app);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(result.user);
            await createUserProfile(result.user.uid, email, false);
            resolve(result.user);
        }
        catch (error) {
            reject(error);
        }
    });
}


// ログアウト
export async function logout() {
    return new Promise(async (resolve, reject) => {
        if (!await isLogin()) {
            resolve("Already logged out");
            return;
        }
        try {
            const auth = getAuth();
            await signOut(auth);
            resolve("Logout successful");
        } catch (error) {
            reject(error);
        }
    });
}

// ユーザに関するプロファイルフィールドを作る
async function createUserProfile(uid, email, isGuest=false) {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) return;

    const defaultData = {
        username: isGuest ? "Guest" : email,
        mbtiType: "",
        guild: "",
        avatar: "default.png",
        createdAt: new Date(),
        todoItems: [],
    };

    await setDoc(userRef, defaultData);

}

// そのユーザのプロファイルを取得する
export function getUserProfile() {
    return new Promise(async (resolve, reject) => {
        const auth = getAuth(app);
        onAuthStateChanged(auth, async user  => {
            const db = getFirestore(app);
            if (!user) {
                reject("User not logged in");
            }

            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                resolve(docSnap.data());
            }
            else {
                reject("User profile not found");
            }
        });
    });
}

// プロファイルを更新する
export function updateUserProfile(data) {
    return new Promise(async (resolve, reject) => {
        const auth = getAuth(app);
        onAuthStateChanged(auth, async user  => {
            const db = getFirestore(app);
            if (!user) {
                reject("User not logged in");
            }

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, data, { merge: true });
            resolve("Profile updated successfully");
        });
    });
}


// export function setUserProfile(data) {
//     return new Promise(async (resolve, reject) => {
//         const auth = getAuth(app);
//         onAuthStateChanged(auth, async user  => {
//             const db = getFirestore(app);
//             if (!user) {
//                 reject("User not logged in");
//             }

//             const userRef = doc(db, "users", user.uid);
//             await setDoc(userRef, data, { merge: false });
//             resolve("Profile updated successfully");
//         });
//     });
// }



// -------- realtime database ---------
// realtime database でユーザ状態を更新
// /status/{uid}はログインしていれば誰でも見れる

/**
 * ユーザーのオンライン状態を Realtime Database の /status/{uid} に自動更新する
 * @param {number} [heartbeat=10000] last_changed 更新間隔(ms)
 */
export function setupPresence(heartbeat = 10000) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);

    const online  = () => ({ state: 'online',  last_changed: serverTimestamp() });
    const offline = () => ({ state: 'offline', last_changed: serverTimestamp() });

    let hbTimer = null;
    let statusRef = null;

    onAuthStateChanged(auth, user => {
        // 古いheartbeat停止
        if (hbTimer) {
            clearInterval(hbTimer);
            hbTimer = null;
        }

        if (!user) {
            if (statusRef) set(statusRef, offline()).catch(console.error);
            statusRef = null;
            return;
        }

        statusRef = ref(db, `/status/${user.uid}`);

        onValue(ref(db, '.info/connected'), snap => {
            if (snap.val() === false) return;

            onDisconnect(statusRef).set(offline()).catch(console.error);
            set(statusRef, online()).catch(console.error);
        });

        hbTimer = setInterval(() => {
            set(statusRef, online()).catch(console.error);
        }, heartbeat);
    });
}



// ------ WebRTC関係（roomsなど）------
// ルームのデータベースを取得する
// あんま使わんでほしい
// export function getRoomRef(roomId){
//     return new Promise(async (resolve, reject) => {
//         const auth = getAuth(app);
//         onAuthStateChanged(auth, async user  => {
//             const db = getFirestore(app);
//             const roomRef = doc(db, "rooms", roomId);

//             if (!user) {
//                 reject("User not logged in");
//             }

//             resolve(roomRef);
//         });
//     });
// }


// export function addCollection(roomId, collectionName, value) {
//     return new Promise(async (resolve, reject) => {
//         const db = getFirestore(app);
//         const collectionRef = doc(db, "rooms", roomId).collection(collectionName);
//         await addDoc(collectionRef, value);
//         resolve();
//     });
// }


// export function setRoomDoc(roomId, value){
//     return new Promise(async (resolve, reject) => {
//         const roomRef = await getRoomRef(roomId);
//         await setDoc(roomRef, value);
//         resolve();
//     });
// }