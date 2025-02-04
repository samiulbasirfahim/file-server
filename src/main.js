import http from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import url from "node:url";
import path from "node:path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "upload");

if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, {
        recursive: true,
    });
}

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, uploadDir);
    },

    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage }).single("file");

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);

    if (parsedUrl.pathname == "/upload") {
        upload(req, res, (err) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(
                    JSON.stringify({ error: "Multer error", details: err.message }),
                );
            }

            if (!req.file) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "No file uploaded." }));
            }

            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "File uploaded." }));
        });
    }

    if (parsedUrl.pathname.startsWith("/get")) {
        const filepath = path.join(uploadDir, parsedUrl.pathname.split("/get/")[1]);

        if (!existsSync(filepath)) {
            res.writeHead(404, {
                "content-type": "application/json",
            });
            return res.end(
                JSON.stringify({
                    error: "File not found.",
                }),
            );
        }

        const readStream = createReadStream(filepath);
        readStream.on("data", (chunk) => {
            res.write(chunk);
        });

        readStream.on("end", () => {
            res.end();
        });
    }
});

const port = 3000;

server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
