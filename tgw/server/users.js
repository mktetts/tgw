const socketio = require("socket.io");
const {
    getDeploymentApplication,
    findAndUpdateDeployment,
    deleteInstance,
} = require("./edgecloud");
const unzipper = require("unzipper");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const unloadDotenv = (path) => {
    const result = dotenv.parse(fs.readFileSync(path));
    for (const key in result) {
        delete process.env[key];
    }
};
module.exports = (server) => {
    let baseHostPort = 2000;

    const io = socketio(server, {
        cors: {
            origin: "*", // Allow all origins. You can specify your client's URL here instead.
            methods: ["GET", "POST"],
        },
    });
    const users = [];

    io.on("connection", (socket) => {
        console.log("New client connected");

        // Listen for user data
        socket.on("userConnected", (userData) => {
            const index = users.findIndex(
                (user) => user.address === userData.address
            );

            if (index === -1) {
                // If user does not exist, add to the users array
                users.push({ id: socket.id, ...userData });
            } else {
                // If user exists, update the user data
                users[index] = { id: socket.id, ...userData };
            }

            // Emit the total number of connected users
            io.emit("totalUsers", users);
        });

        socket.on("disconnect", () => {
            // Remove the user from the users array
            const index = users.findIndex((user) => user.id === socket.id);
            if (index !== -1) {
                users.splice(index, 1);
                console.log("User disconnected");

                // Emit the total number of connected users
                io.emit("totalUsers", users);
            }
        });
        socket.on("newComment", (comment) => {
            io.emit("newComments", comment);
        });
        socket.on("totalUser", () => {
            io.emit("totalUsers", users);
        });

        socket.on("run-docker", async (data) => {
            try {
                const deploymentApplication = await getDeploymentApplication(
                    data.key
                );
                const extractPath = path.join(__dirname, "extracted");
                await unzipFile(deploymentApplication, extractPath);
                // Read vite.config.js to extract the port\\
                const fileName = data.fileName.split(".")[0];
                // const viteConfigPath = path.join(extractPath, fileName+ "/vite.config.js");
                // const viteConfig = await import(viteConfigPath);
                // const containerPort = 5174;
                // Load environment variables from .env file
                const envPath = path.join(extractPath, fileName + "/.env");
                if (fs.existsSync(envPath)) {
                    dotenv.config({ path: envPath });
                    console.log(envPath);
                    let containerPor = process.env.CONTAINER_PORT || 5173;
                    console.log(containerPor);
                }
                const containerPort = process.env.CONTAINER_PORT || 5173;
                console.log(containerPort);

                if (fs.existsSync(envPath)) {
                    unloadDotenv(envPath);
                  }
            
                // Build and run Docker container
                const dockerImageName = data.data.appName;
                const dockerContainerName = data.data.appName + "-container";

                // Build the Docker image
                exec(
                    `docker build -t ${dockerImageName} ${
                        extractPath + "/" + fileName
                    }`,
                    async (err, stdout, stderr) => {
                        if (err) {
                            console.log(stderr, stdout);
                            await findAndUpdateDeployment(data._id, {
                                error: stderr + stdout,
                            });
                            return;
                        }
                        baseHostPort = baseHostPort + 1;
                        // Run the Docker container
                        exec(
                            `docker run -d -p ${baseHostPort}:${containerPort} --name ${dockerContainerName} ${dockerImageName}`,
                            async (err, containerId, stderr) => {
                                if (err) {
                                    console.log(stderr, err);
                                    await findAndUpdateDeployment(data._id, {
                                        error: stderr + err,
                                    });
                                    return;
                                }
                                containerId = containerId.trim();

                                // Get container IP address
                                exec(
                                    `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerId}`,
                                    (err, containerIp, stderr) => {
                                        if (err) {
                                            console.log(stderr, err);
                                            findAndUpdateDeployment(data._id, {
                                                error: stderr + err,
                                            });
                                            return;
                                        }
                                        containerIp = containerIp.trim();

                                        findAndUpdateDeployment(data._id, {
                                            // baseHostPort: baseHostPort,
                                            containerPort: containerPort,
                                            status: "Running",
                                            dockerContainerName:
                                                dockerContainerName,
                                            dockerImageName: dockerImageName,
                                            url: `http://${containerIp}:${containerPort}`,
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            } catch (e) {
                // console.log(e);
                await findAndUpdateDeployment(data._id, {
                    error: e,
                });
            }
        });

        socket.on("delete-docker", async (data) => {
            exec(
                `docker rm -f ${data.dockerContainerName}`,
                (err, stdout, stderr) => {
                    if (err) {
                        socket.emit("docker-delete", {
                            message: `Error stopping and removing container: ${stderr}`,
                        });
                        console.error(
                            `Error stopping and removing container: ${stderr}`
                        );
                        return;
                    }
                    socket.emit("docker-delete", {
                        message: `Docker container removed: ${stdout}`,
                    });

                    // Remove the Docker image
                    exec(
                        `docker rmi ${data.dockerImageName}`,
                        (err, stdout, stderr) => {
                            if (err) {
                                socket.emit("docker-delete", {
                                    message: `Error removing Docker image: ${stderr}`,
                                });
                                return;
                            }
                            socket.emit("docker-delete", {
                                message: `Docker image removed: ${stdout}`,
                            });
                        }
                    );

                    if (deleteInstance(data._id)) {
                        socket.emit("docker-delete", {
                            message: "Removed from database",
                        });
                    } else {
                        socket.emit("docker-delete", {
                            message: "Failed to remove from database",
                        });
                    }
                }
            );
        });

        // Add more event listeners and handlers here if needed
    });

    const unzipFile = (zipFilePath, extractPath) => {
        return new Promise((resolve, reject) => {
            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: extractPath }))
                .on("close", resolve)
                .on("error", reject);
        });
    };

    return io;
};
