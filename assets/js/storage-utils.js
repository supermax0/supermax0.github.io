/**
 * Firebase Storage - رفع ملفات المشاريع
 */

const STORAGE_PATH = 'project-files';

/**
 * Upload project files to Firebase Storage
 * رفع ملفات المشروع إلى Firebase Storage
 * @param {string} projectId - معرف المشروع
 * @param {File[]} files - مصفوفة ملفات
 * @returns {Promise<Object>} { fileName: { name, url, type, size } }
 */
async function uploadProjectFilesToStorage(projectId, files) {
    if (!window.firebaseStorage || !projectId || !files || files.length === 0) {
        return null;
    }
    try {
        var storageMod = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js");
        var result = {};
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var path = STORAGE_PATH + '/' + projectId + '/' + file.name;
            var storageRef = storageMod.ref(window.firebaseStorage, path);
            await storageMod.uploadBytes(storageRef, file);
            var url = await storageMod.getDownloadURL(storageRef);
            result[file.name] = {
                name: file.name,
                url: url,
                type: file.type || 'text/plain',
                size: file.size
            };
        }
        return result;
    } catch (e) {
        console.error('Storage upload error:', e);
        throw e;
    }
}

if (typeof window !== 'undefined') {
    window.uploadProjectFilesToStorage = uploadProjectFilesToStorage;
}
