const net = require("net");
const fs = require("fs");
const path = require("path");

const PORT = 1337;
const FRAME_RATE = 33; // ms per frame (~30fps)
const FRAME_PATH = "/www/ascii/ascii_frames";

// Load all ASCII frames into memory
const loadFrames = () => {
    const frames = [];
    const files = fs.readdirSync(FRAME_PATH).sort();
    files.forEach((file) => {
        if (file.endsWith(".txt")) {
            // Normalize line endings to \r\n for proper Telnet rendering
            const frame = fs.readFileSync(path.join(FRAME_PATH, file), "utf8").replace(/\n/g, "\r\n");
            frames.push(frame);
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

        // Clear screen and reset cursor
        socket.write("\x1b[2J\x1b[H");

        // Send frame
        socket.write(frames[frameIndex] || "No frames loaded.\r\n");

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
