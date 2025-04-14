const fs = require('fs');
const path = require('path');

class ProcessLock {
    // Initialize lock file path when class is instantiated
    constructor(basePath) {
        this.lockFile = path.join(basePath, 'script.lock');
        console.log(`Lock file initialized at: ${this.lockFile}`);
    }

    // Try to acquire lock by creating a lock file
    acquireLock() {
        try {
            //console.log(`[LOCK] Attempting to acquire lock at: ${this.lockFile}`);
            //console.log(`[LOCK] Current directory: ${process.cwd()}`);
            //console.log(`[LOCK] Process ID: ${process.pid}`);
            
            fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
            console.log(`[LOCK] Successfully acquired lock`);
            return true;
        } catch (err) {
/*             console.error(`[LOCK] Error acquiring lock:`, {
                error: err.message,
                code: err.code,
                path: this.lockFile,
                pid: process.pid
            }); */
            return false;
        }
    }
    
    // Release lock by deleting the lock file
    releaseLock() {
        try {
            fs.unlinkSync(this.lockFile);
            console.log(`Lock released by process ${process.pid}`);
            return true;
        } catch (err) {
            console.log(`Failed to release lock: ${err.message}`);
            return false;
        }
    }

    // Wait until lock becomes available
    async waitForLock() {
        console.log(`Process ${process.pid} waiting for lock...`);
        let attempts = 0;
        while (!this.acquireLock()) {
            attempts++;
            //console.log(`Attempt ${attempts}: Lock still held, waiting...`);
            // Wait 1 second before next attempt
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
        console.log(`Process ${process.pid} obtained lock after ${attempts} attempts`);
    }
}

module.exports = ProcessLock;