const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const multer = require("multer");
const mime = require("mime-types");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

//Configure Gemini API
const googleGenAI = new GoogleGenerativeAI(process.env.API_KEY);

const geminiProVisionModel = googleGenAI.getGenerativeModel({
    model: "gemini-2.5-flash"
})

//Configure upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // cb(null, "./uploads/")
        const uploadDir = path.join(__dirname, '../uploads');

        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create it if it doesn't exist
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})

app.get("/", (req, res) => {
    res.send("Welcome to our AI Caption Generation API");
})

/* Original post script
app.post("/generate-caption", upload.single("file"), async (req, res) => {
    
    const filePath = req.file.path;
    const mimeType = mime.lookup(filePath);

    const imagePath = {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType: mimeType
        }
    }

    const images = [imagePath];

    const prompt = "Write an appropriate caption for this image to help visually-impaired users";

    const request = await geminiProVisionModel.generateContent([
        prompt, ...images
    ]);
    const response = await request.response;
    const caption = response.text();

    res.send(caption);
})
*/

// Post script from Gemini
app.post("/generate-caption", upload.single("file"), async (req, res) => {
    // --- IMPORTANT: Check if a file was actually uploaded ---
    if (!req.file) {
        console.error('No file uploaded or Multer failed to process.');
        return res.status(400).send("No file uploaded. Please select an image.");
    }

    const filePath = req.file.path;
    const mimeType = mime.lookup(filePath);

    // --- Add a try-catch block for file reading and API call ---
    try {
        // Ensure the file exists before reading it
        if (!fs.existsSync(filePath)) {
            console.error(`File not found at: ${filePath}`);
            return res.status(500).send("Uploaded file not found on server.");
        }

        const imagePath = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
                mimeType: mimeType
            }
        };

        const images = [imagePath];
        const prompt = "Write an appropriate caption for this image to help visually-impared users";

        const request = await geminiProVisionModel.generateContent([
            prompt, ...images
        ]);
        const response = await request.response;
        const caption = response.text();

        // --- Clean up the uploaded file after processing ---
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Failed to delete temporary file:", err);
            } else {
                console.log("Temporary file deleted:", filePath);
            }
        });

        res.send(caption);

    } catch (error) {
        console.error("Error during caption generation:", error);
        // If an error occurred after the file was uploaded, try to delete it
        if (fs.existsSync(filePath)) {
             fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete temporary file after error:", err);
             });
        }
        if (error.response && error.response.error) {
            // If it's a Gemini API error with a structured response
            res.status(500).send(`Error from Gemini API: ${error.response.error.message || error.message}`);
        } else {
            res.status(500).send("An error occurred during caption generation. Please try again.");
        }
    }
});

const PORT = process.env.PORT || 1330;

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
})