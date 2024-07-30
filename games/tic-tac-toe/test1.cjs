const { exec } = require('child_process');

const dockerImageName = 'my-react-app';
const dockerContainerName = 'my-react-app-container';

// Stop and remove the Docker container
exec(`docker rm -f ${dockerContainerName}`, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error stopping and removing container: ${stderr}`);
        return;
    }
    console.log(`Docker container removed: ${stdout}`);

    // Remove the Docker image
    exec(`docker rmi ${dockerImageName}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error removing Docker image: ${stderr}`);
            return;
        }
        console.log(`Docker image removed: ${stdout}`);
    });
});
