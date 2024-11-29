import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import { removeBgImage } from "../controllers/imageController.js";
import upload from "../middlewares/multer.js";
const imageRouter = express.Router();

imageRouter.post(
  "/remove-bg",
  upload.single("image"),
  isAuthorized,
  removeBgImage
);

export default imageRouter;