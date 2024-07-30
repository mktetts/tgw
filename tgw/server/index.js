require('dotenv').config();
const http = require("http");
const {app} = require("./edgecloud");
const socketServer = require("./users");
const cors = require('cors')
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socketServer(server);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
