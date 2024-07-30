const { exec } = require('child_process');

const dockerImageName = 'my-vite-react-app';
const baseContainerName = 'my-vite-react-app-container-';

for (let i = 0; i < 10; i++) {
  const containerName = `${baseContainerName}${i + 1}`;

  // Stop and remove the Docker container
  exec(`docker rm -f ${containerName}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error stopping and removing container ${containerName}: ${stderr}`);
      return;
    }
    console.log(`Docker container ${containerName} removed: ${stdout}`);

    // Remove the Docker image (only after the last container is removed)
    if (i === 9) {
      exec(`docker rmi ${dockerImageName}`, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error removing Docker image: ${stderr}`);
          return;
        }
        console.log(`Docker image removed: ${stdout}`);
      });
    }
  });
}
