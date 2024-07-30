import axios from 'axios';
import JSZip from 'jszip';

export const loginUser = async data => {
    const res = await axios.post(import.meta.env.VITE_APP_GSME_SERVER + '/login', data);
    return res.data;
};

export const unZipGamingAssets = async (key, fileName) => {
    try {
        const res = await axios.post(
            import.meta.env.VITE_APP_TGW_SERVER + '/retrieve',
            {
                key: key.slice(2).toString(),
                relpath: fileName
            },
            {
                responseType: 'arraybuffer'
            }
        );
        const zipFile = res.data;
        const zip = new JSZip();
        const unzipped = await zip.loadAsync(zipFile);
        const files = {};

        for (const [fileName, fileData] of Object.entries(unzipped.files)) {
            if (!fileData.dir) {
                const content = await fileData.async('blob');
                files[fileName] = content;
            }
        }

        return files;
    } catch (e) {
        throw new Error(e);
    }
};

export const convertBlobToBase64 = blob => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const base64ToBlob = (base64, type = 'application/octet-stream') => {
    try {
        // console.log(base64)
        const base64String = base64.split(',')[1];
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type });
    } catch (error) {
        console.error('Error converting base64 to Blob:', error);
        return null;
    }
};

export const covnertToImage = async image => {
    const imageData = await image.async('base64');
    const img = new Image();
    img.src = `data:image/png;base64,${imageData}`;
    return img;
};

export const decodeNFT = async (storekey, fileName) => {
    try {
        const res = await axios.post(
            import.meta.env.VITE_APP_TGW_SERVER + '/retrieve',
            {
                key: storekey.slice(2).toString(),
                relpath: fileName
            },
            {
                responseType: 'arraybuffer'
            }
        );
        let zipFile = res.data;
        const zip = new JSZip();
        zipFile = await zip.loadAsync(zipFile);
        let folderName = Object.keys(zipFile.files)[0];
        console.log(folderName);
        let jsonFile = await zipFile.file(folderName + 'metadata.json');

        jsonFile = await jsonFile.async('text');
        jsonFile = JSON.parse(jsonFile);
        let images = [];
        let imageCaption = [];
        for (let i = 0; i < jsonFile.filenames.length; i++) {
            images.push((await covnertToImage(zipFile.file(folderName + jsonFile.filenames[i]))).src);
            // let fn = jsonFile.filenames[i].split('.')[0];
            // if (fn === 'original') imageCaption.push('Original Image');
            // else imageCaption.push(jsonFile[fn]);
        }
        return { images: images, metadata: jsonFile };
    } catch (e) {
        // console.log(e);
        throw new Error(e);
    }
};
