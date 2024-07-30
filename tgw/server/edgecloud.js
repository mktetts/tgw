const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const axios = require("axios");
const app = express();
const mongoose = require("mongoose");

const port = 3000;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());

try {
    mongoose.connect(process.env.DATABASE_URL + process.env.DB_NAME, {});
    console.log("Database connected");
} catch (err) {
    console.error(err.message);
    process.exit(1);
}

const videoSchema = new mongoose.Schema({
    key: String,
    data: mongoose.Schema.Types.Mixed,
    date: String,
    thumbnail: Buffer
});
const Video = mongoose.model("Video", videoSchema);

const fileSchema = new mongoose.Schema({
    key: String,
});
const File = mongoose.model("Screenshots", fileSchema);

const deploymentSchema = new mongoose.Schema({
    key: {
        type: String,
        default: "",
    },
    owner: {
        type: String,
        default: "",
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    error: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    status: {
        type: String,
        default: "",
    },
    fileName: {
        type: String,
        default: "",
    },
    dockerImageName: {
        type: String,
        default: "",
    },
    dockerContainerName: {
        type: String,
        default: "",
    },
    baseHostPort: {
        type: Number,
        default: 0,
    },
    containerPort: {
        type: Number,
        default: 0,
    },
    url: {
        type: String,
        default: "",
    },
});
const Deployment = mongoose.model("Deployment", deploymentSchema);

const storageDir = path.join(__dirname, "storage");

if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir);
}

const storage = multer.memoryStorage(); // Store files in memory for hashing
const upload = multer({ storage: storage });


app.post("/store", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file part" });
    }
    const file = req.file;
    const tempFilePath = path.join(storageDir, req.file.originalname);
    fs.writeFileSync(tempFilePath, file.buffer);
    const payload = {
        jsonrpc: "2.0",
        method: "edgestore.PutFile",
        params: [{ path: tempFilePath }],
        id: 1,
    };

    try {
        const response = await axios.post(
            process.env.EDGE_STORE_NODE,
            payload,
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        // Remove the temporary file
        fs.unlink(tempFilePath, (err) => {
            if (err)
                console.error(`Error deleting file ${tempFilePath}: ${err}`);
        });
        res.json({
            key: response.data.result.key,
            status: response.data.result.success,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

app.post("/retrieve", async (req, res) => {
    const { key, relpath } = req.body;
    if (!key) {
        return res.status(400).json({ error: "No key provided" });
    }

    const payload = {
        jsonrpc: "2.0",
        method: "edgestore.GetFile",
        params: [{ key }],
        id: 1,
    };

    try {
        const response = await axios.post(
            process.env.EDGE_STORE_NODE,
            payload,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 1500
            }
        );

        const responseData = response.data;
        if (!responseData.result || !responseData.result.path) {
            return res
                .status(400)
                .json({ error: "Invalid response from server" });
        }
        const filePath = responseData.result.path;
        const fileName = path.basename(filePath);

        res.sendFile(path.resolve(filePath));
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve file" });
    }
});

app.post("/uploadDeployment", upload.single("file"), async (req, res) => {
    const file = req.file;
    const data = JSON.parse(req.body.data);

    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    // Calculate hash of the file
    // Create a directory named after the hash
    // const tempFilePath = path.join(storageDir, file.originalname);
    // if (!fs.existsSync(hashDir)) {
    //     fs.mkdirSync(hashDir, { recursive: true });
    // }

    const tempFilePath = path.join(storageDir, req.file.originalname);
    fs.writeFileSync(tempFilePath, file.buffer);

    const payload = {
        jsonrpc: "2.0",
        method: "edgestore.PutFile",
        params: [{ path: tempFilePath }],
        id: 1,
    };

    try {
        const response = await axios.post(
            process.env.EDGE_STORE_NODE,
            payload,
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        // Remove the temporary file
        fs.unlink(tempFilePath, (err) => {
            if (err)
                console.error(`Error deleting file ${tempFilePath}: ${err}`);
        });
        const newFile = new Deployment({
            key: response.data.result.key,
            data: JSON.parse(req.body.data),
            owner: data.owner,
            error: "",
            status: "Not Running",
            fileName: req.file.originalname,
        });
        await newFile.save();
        res.json({
            key: response.data.result.key,
            status: response.data.result.success,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
    }
    // Save file details to MongoDB
});
app.post("/getAllInstances", async (req, res) => {
    const data = req.body.owner;
    try {
        const result = await Deployment.find();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
    }
    // Save file details to MongoDB
});
app.post("/getMyInstances", async (req, res) => {
    const data = req.body.owner;
    try {
        const result = await Deployment.find({ owner: data });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
    }
    // Save file details to MongoDB
});

app.post("/deleteMyInstace", async (req, res) => {
    const data = req.body.key;
    console.log(data);
    try {
        const result = await Deployment.findOneAndDelete({ key: data });
        if (result) {
            res.json({ message: `Application with key ${data} was deleted:` });
        } else {
            res.json({ message: `No application found with key ${data}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete" });
    }
    // Save file details to MongoDB
});

const deleteInstance = async (key) => {
    try {
        const result = await Deployment.findOneAndDelete({ _id: key });
        return true;
    } catch (error) {
        return false;
    }
};

const getDeploymentApplication = async (key) => {
    const payload = {
        jsonrpc: "2.0",
        method: "edgestore.GetFile",
        params: [{ key }],
        id: 1,
    };

    try {
        const response = await axios.post(
            process.env.EDGE_STORE_NODE,
            payload,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 1500
            }
        );

        const responseData = response.data;
        return responseData.result.path;
    } catch (e) {
        console.log(e);
    }
};
async function findAndUpdateDeployment(key, updateData) {
    try {
        const updatedDeployment = await Deployment.findOneAndUpdate(
            { _id: key }, // The condition to find the document
            { $set: updateData }, // The data to update
            { new: true } // Return the updated document
        );
    } catch (err) {
        console.error("Error updating deployment:", err);
    }
}

app.post("/uploadVideo", upload.single('image'),async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file part" });
        }
        const { key, date } = req.body;
        const data = JSON.parse(req.body.data); // Parse the JSON data
        const image = req.file.buffer;
        
        const newVideo = new Video({
            key:key,
            data: data,
            date: date,
            thumbnail: image,
        });

        await newVideo.save();
        res.status(201).send('Video data and Thumbnail saved successfully.');
    } catch (error) {
        console.log(error)
        res.status(500).send('Error saving video data and image: ' + error.message);
    }
});

app.get('/getAllVideos', async (req, res) => {
    try {
        const videos = await Video.find();
        res.json(videos);
    } catch (error) {
        res.status(500).send('Error fetching videos: ' + error.message);
    }
});
module.exports = {
    app,
    getDeploymentApplication,
    findAndUpdateDeployment,
    deleteInstance,
};
