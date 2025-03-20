const net = require("net");
const fs = require("fs");
const path = require("path");

const PORT = 1337;
const FRAME_RATE = 33; // ms
const FRAME_PATH = "ascii_frames";

const loadFrames = () => {
    const frames = [];
    const files = fs.readdirSync(FRAME_PATH).sort();
    files.forEach((file) => {
        if (file.endsWith(".txt")) {
            frames.push(fs.readFileSync(path.join(FRAME_PATH, file), "utf8"));
        }
    });
    return frames;
};

const frames = loadFrames();

const server = net.createServer((socket) => {
    console.log("New client connected!");

    let frameIndex = 0;
    const interval = setInterval(() => {
        if (!socket.writable) return clearInterval(interval);
        socket.write("\033[H\033[2J"); // Clear terminal
        socket.write(frames[frameIndex] || "No frames loaded.\n");
        frameIndex = (frameIndex + 1) % frames.length;
    }, FRAME_RATE);

    socket.on("end", () => {
        console.log("Client disconnected.");
        clearInterval(interval);
    });

    socket.on("error", () => {
        clearInterval(interval);
    });
});

server.listen(PORT, () => {
    console.log(`ASCII server running on port ${PORT}. Connect via 'telnet localhost ${PORT}'`);
});
