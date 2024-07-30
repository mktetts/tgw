const { exec } = require('child_process');

const dockerImageName = 'my-vite-react-app';
const baseHostPort = 5174; // The base host port

// Build the Docker image
exec(`docker build -t ${dockerImageName} .`, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error building Docker image: ${stderr}`);
    return;
  }
  console.log(`Docker image built: ${stdout}`);

  // Function to run a container with a specific name and host port
  const runContainer = (containerName, hostPort) => {
    exec(`docker run -d -p ${hostPort}:5174 --name ${containerName} ${dockerImageName}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error running Docker container ${containerName}: ${stderr}`);
        return;
      }
      console.log(`Docker container ${containerName} started: ${stdout}`);
      console.log(`App running at: http://localhost:${hostPort}`);
    });
  };

  // Run 10 containers with different host ports
  for (let i = 0; i < 10; i++) {
    const containerName = `my-vite-react-app-container-${i + 1}`;
    const hostPort = baseHostPort + i;
    runContainer(containerName, hostPort);
  }
});
