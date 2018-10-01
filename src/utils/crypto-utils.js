const app = window.require('electron');
const crypto = app.remote.require('crypto');
const fs = app.remote.require('fs');

const IV_LENGTH = 16; // For AES, this is always 16
const IV_LENGTH_BASE64 = 24; // Length of IV as base 64 string used in decryption
const AUTH_TAG_LENGHT = 16;
const IV_AND_AUTH_TAG_BASE64_LENGTH = 44;

export const hashString = (message, algorithm = 'sha256', options) => {
    const hash = crypto.createHash(algorithm);

    if (Buffer.isBuffer(message)) {
        hash.update(message);
    } else if (Array.isArray(message)) {
        // Array of byte values
        hash.update(new Buffer(message));
    } else {
        // Otherwise, treat as a binary string
        hash.update(new Buffer(message, 'binary'));
    }

    const bufferDigest = hash.digest();

    if (options && options.asBytes) {
        // Array of bytes as decimal integers
        let arrayOfBytes = [];
        for (let i = 0; i < bufferDigest.length; i++) {
            arrayOfBytes.push(bufferDigest[i]);
        }
        return arrayOfBytes;
    } else if (options && options.asString) {
        // Binary string
        return bufferDigest.toString('binary');
    } else if (options && options.asBuffer) {
        // Buffer
        return bufferDigest;
    } else {
        // String of hex characters
        return bufferDigest.toString('hex');
    }
};

export const hashFile = (filePath, algorithm = 'sha256') => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        hash.setEncoding('hex');
        const input = fs.createReadStream(filePath);
        input.on('end', () => {
            hash.end();
            resolve(hash.read());
        });

        input.pipe(hash);
    });
};

export const cipherFile = (filePath, secret, destPath, algorithm = 'id-aes256-GCM') => {
    return new Promise((resolve, reject) => {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(algorithm, secret, iv);

            const input = fs.createReadStream(filePath, { encoding: 'utf8' });
            const output = fs.createWriteStream(destPath);

            let encryptedData;
            input.on('end', () => {
                cipher.end();
            });
            cipher.on('data', data => {
                if (data) {
                    if (encryptedData instanceof Buffer) {
                        encryptedData = Buffer.concat([encryptedData, Buffer.from(data)]);
                    } else {
                        encryptedData = Buffer.from(data);
                    }
                }
            });
            cipher.on('end', () => {
                const authTag = cipher.getAuthTag();
                const encrypted = Buffer.concat([Buffer.from(iv), Buffer.from(authTag), encryptedData]).toString('base64');
                output.write(encrypted);
                output.end();
                resolve(encrypted);
            });

            input.pipe(cipher);
        } catch (e) {
            reject(e);
        }
    });
};

export const decipherFile = (filePath, secret, algorithm = 'id-aes256-GCM') => {
    return new Promise((resolve, reject) => {
        try {
            
            fs.readFile(filePath, { encoding: 'utf8'}, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decryptString(data, secret, algorithm));
                }
            });
            
        } catch (e) {
            reject(e);
        }
    });
};

const decryptString = (encryptedData, secret, algorithm = 'id-aes256-GCM') => {
    try {
        let rawData = Buffer.from(encryptedData, 'base64');

        const iv = rawData.slice(0, IV_LENGTH);
        const authTag = rawData.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGHT);
        const data = rawData.slice(IV_LENGTH + AUTH_TAG_LENGHT);

        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv);
        decipher.setAuthTag(authTag);

        let plainText = decipher.update(data, 'binary', 'utf8');
        plainText += decipher.final('utf8');
        console.log(plainText);
        return plainText;
    } catch (e) {
        throw new Error(e);
    }
};
