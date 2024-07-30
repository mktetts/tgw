import axios from 'axios';
import JSZip from 'jszip';

export const getTransactions = async data => {
    const res = await axios.post(import.meta.env.VITE_APP_NODE + '/getTransactions', data);
    return res.data;
};

export const getAllNetworks = async () => {
    const res = await axios.get(import.meta.env.VITE_APP_NODE + '/listAllNetworks');
    return res.data.data;
};
export const findIngestor = async (apikey, apiSecret) => {
    const res = await axios.get('https://api.thetavideoapi.com/ingestor/filter', {
        headers: {
            'x-tva-sa-id': apikey,
            'x-tva-sa-secret': apiSecret
        }
    });
    return res.data.body.ingestors;
};

export const getStreamKeys = async (id, apikey, apiSecret, ingestor) => {
    const res = await axios.put(
        'https://api.thetavideoapi.com/ingestor/' + ingestor + '/select',
        {
            tva_stream: id
        },
        {
            headers: {
                'x-tva-sa-id': apikey,
                'x-tva-sa-secret': apiSecret,
                'Content-Type': 'application/json'
            }
        }
    );
    return res.data.body;
};

export const getStreamURL = async (id, apikey, apiSecret) => {
    const res = await axios.get('https://api.thetavideoapi.com/stream/' + id, {
        headers: {
            'x-tva-sa-id': apikey,
            'x-tva-sa-secret': apiSecret
        }
    });
    return res.data.body;
};

export const createZipFile = async gameForm => {
    const zip = new JSZip();

    if (gameForm.gameRules) {
        zip.file('gameRules.txt', gameForm.gameRules);
    }
    if (gameForm.gameDescription) {
        zip.file('gameDescription.txt', gameForm.gameDescription);
    }

    if (gameForm.gameVideo) {
        const videoFile = await fetch(URL.createObjectURL(gameForm.gameVideo)).then(res => res.blob());
        zip.file('gameVideo.mp4', videoFile);
    }

    if (gameForm.gameThumbnail) {
        const thumbnailFile = await fetch(URL.createObjectURL(gameForm.gameThumbnail)).then(res => res.blob());
        zip.file('gameThumbnail.png', thumbnailFile);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    return zipContent;
};

export const uploadGameDetails = async (zipFile, fileName) => {
    if (!zipFile) return;

    const formData = new FormData();
    formData.append('file', zipFile, fileName);

    const res = await axios.post( import.meta.env.VITE_APP_TGW_SERVER + '/store', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return res.data;
};

export const unZipGamingAssets = async (key, fileName) => {
    const files = {};
    try{
        const res = await axios.post(
            import.meta.env.VITE_APP_TGW_SERVER + '/retrieve',
            {
                key: key,
                relpath: fileName
            },
            {
                responseType: 'arraybuffer'
            }
        );
        const zipFile = res.data;
        const zip = new JSZip();
        const unzipped = await zip.loadAsync(zipFile);
    
        for (const [fileName, fileData] of Object.entries(unzipped.files)) {
            if (!fileData.dir) {
                const content = await fileData.async('blob');
                files[fileName] = content;
            }
        }
    
        return files;
    }
    catch(e){
        console.log(e)
        throw new Error(e)
        return files
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

export const uploadNFT = async (zipFile, fileName) => {
    if (!zipFile) return;

    const formData = new FormData();
    formData.append('file', zipFile, fileName);

    const res = await axios.post(import.meta.env.VITE_APP_TGW_SERVER +'/store', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return res.data;
};
export const covnertToImage = async image => {
    const imageData = await image.async('base64');
    const img = new Image();
    img.src = `data:image/png;base64,${imageData}`;
    return img;
};

export const decodeNFT = async (storekey, fileName) => {
    try{
        const res = await axios.post(
            import.meta.env.VITE_APP_TGW_SERVER +'/retrieve',
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
    }
    catch(e){
        throw new Error (e)
    }
    
};

export const uploadDeploymentDetails = async (zipFile, fileName, data) => {
    if (!zipFile) return;
    console.log(data);
    const formData = new FormData();
    formData.append('file', zipFile, fileName);
    formData.append('data', JSON.stringify(data));

    const res = await axios.post(import.meta.env.VITE_APP_TGW_SERVER +'/uploadDeployment', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    console.log(res);
    return res.data;
};
export const getAllInstance = async owner => {
    const res = await axios.post(import.meta.env.VITE_APP_TGW_SERVER +'/getAllInstances', {
        owner: owner
    });
    return res.data;
};
export const getMyInstance = async owner => {
    const res = await axios.post(import.meta.env.VITE_APP_TGW_SERVER +'/getMyInstances', {
        owner: owner
    });
    return res.data;
};

export const deleteMyInstace = async key => {
    const res = await axios.post(import.meta.env.VITE_APP_TGW_SERVER +'/deleteMyInstace', {
        key: key
    });
    return res.data;
};

export const uploadVideo = async (key, data, imageFile) => {
    console.log(data)
    const formData = new FormData();
    formData.append('key', key); // Replace with actual key
    formData.append('data', JSON.stringify(data));
    formData.append('date', new Date().toISOString());
    formData.append('image', imageFile);

    try {
        const response = await axios.post( import.meta.env.VITE_APP_TGW_SERVER +'/uploadVideo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status === 201) {
            return response.data
        }
    } catch (error) {
        throw new Error('Error uploading video and image: ' + error.message);
    }
};

export const getVideos = async () => {
    try {
        const response = await axios.get( import.meta.env.VITE_APP_TGW_SERVER +'/getAllVideos');

        return response.data
        if (response.status === 201) {
        }
    } catch (error) {
        throw new Error('Error uploading video and image: ' + error.message);
    }
};
