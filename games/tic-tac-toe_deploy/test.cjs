const { exec } = require('child_process');

const dockerImageName = 'my-react-app';
const dockerContainerName = 'my-react-app-container';
const hostPort = 5174; // The port your app will run on
const containerPort = 5174; // The port your app will run inside the container

// Build the Docker image
exec(`docker build -t ${dockerImageName} .`, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error building Docker image: ${stderr}`);
        return;
    }
    console.log(`Docker image built: ${stdout}`);

    // Run the Docker container
    exec(`docker run -d -p ${hostPort}:${containerPort} --name ${dockerContainerName} ${dockerImageName}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error running Docker container: ${stderr}`);
            return;
        }
        console.log(`Docker container started: ${stdout}`);

        // Get the container's IP address (not needed for localhost access)
        exec(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${dockerContainerName}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error getting container IP address: ${stderr}`);
                return;
            }
            const containerIp = stdout.trim();
            console.log(`App running at: http://localhost:${hostPort}`);
        });
    });
});
