const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Delete files older than specified age
 * @param {number} maxAge - Maximum age in milliseconds
 */
async function cleanupOldFiles(maxAge = CLEANUP_INTERVAL) {
    try {
        // Check if upload directory exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            console.log('Upload directory does not exist, skipping cleanup');
            return;
        }

        const files = fs.readdirSync(UPLOAD_DIR);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(UPLOAD_DIR, file);

            // Skip if not a file (e.g., directories)
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) continue;

            // Check file age
            const fileAge = now - stats.mtimeMs; // Modified time in milliseconds

            if (fileAge > maxAge) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️  Deleted old file: ${file} (age: ${Math.round(fileAge / 60000)} minutes)`);
                } catch (err) {
                    console.error(`Failed to delete ${file}:`, err.message);
                }
            }
        }

        if (deletedCount > 0) {
            console.log(`✅ Cleanup completed: ${deletedCount} file(s) deleted`);
        } else {
            console.log('✅ Cleanup completed: No old files to delete');
        }
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    }
}

/**
 * Start periodic cleanup task
 */
function startCleanupTask() {
    console.log(`🧹 Starting automatic file cleanup (every ${CLEANUP_INTERVAL / 60000} minutes)`);

    // Run cleanup immediately on start
    cleanupOldFiles();

    // Schedule periodic cleanup
    const intervalId = setInterval(() => {
        cleanupOldFiles();
    }, CLEANUP_INTERVAL);

    return intervalId;
}

/**
 * Delete a specific file immediately
 * @param {string} filePath - Path to the file to delete
 */
function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Deleted file: ${path.basename(filePath)}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error.message);
        return false;
    }
}

module.exports = {
    cleanupOldFiles,
    startCleanupTask,
    deleteFile,
    CLEANUP_INTERVAL
};
