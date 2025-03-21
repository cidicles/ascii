const net = require("net");
const fs = require("fs");
const path = require("path");

const PORT = 1337;
const FRAME_RATE = 33; // ms per frame
// const FRAME_PATH = "/www/ascii/ascii_frames";
const FRAME_PATH = "/www/ascii/ascii_frames";

// Just get the list of frame filenames, sorted
const frameFiles = fs.readdirSync(FRAME_PATH)
    .filter((file) => file.endsWith(".txt"))
    .sort();

const server = net.createServer((socket) => {
    console.log("New client connected!");

    let frameIndex = 0;
    const interval = setInterval(() => {
        if (!socket.writable) return clearInterval(interval);

        const frameFile = frameFiles[frameIndex];
        const framePath = path.join(FRAME_PATH, frameFile);

        // Read the current frame from disk
        fs.readFile(framePath, "utf8", (err, data) => {
            if (err) {
                console.error("Failed to read frame:", frameFile, err);
                return;
            }

            const formattedFrame = data.replace(/\n/g, "\r\n");
            socket.write("\x1b[2J\x1b[H"); // Clear + cursor home
            socket.write(formattedFrame);
        });

        frameIndex = (frameIndex + 1) % frameFiles.length;
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
