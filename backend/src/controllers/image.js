"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNickname = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const openai_1 = __importDefault(require("openai"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Configure OpenAI with your API key
const openai = new openai_1.default({
    apiKey: 'your-openai-api-key-here', // Replace with your actual API key
});
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.image) {
            return res.status(400).json({ error: 'No image provided' });
        }
        const result = yield cloudinary_1.v2.uploader.upload(req.body.image, {
            folder: 'nicknames'
        });
        res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });
    }
    catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
exports.uploadImage = uploadImage;
const generateNickname = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ error: 'No image URL provided' });
        }
        const response = yield openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Generate a fun, creative nickname based on this image. Keep it friendly and appropriate." },
                        { type: "image_url", image_url: imageUrl }
                    ],
                },
            ],
        });
        const nickname = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || 'Cool Person';
        res.status(200).json({ nickname });
    }
    catch (error) {
        console.error('Error generating nickname:', error);
        res.status(500).json({ error: 'Failed to generate nickname' });
    }
});
exports.generateNickname = generateNickname;
