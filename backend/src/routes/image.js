"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const image_1 = require("../controllers/image");
const router = express_1.default.Router();
exports.router = router;
// Route to handle image upload and nickname generation
router.post('/upload', image_1.uploadImage);
router.post('/generate-nickname', image_1.generateNickname);
