import "dotenv/config";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import userModel from "../models/userModel.js";
import { successResponse } from "./responseController.js";
import paymentModel from "../models/paymentModel.js";

const removeBgImage = async (req, res, next) => {
  try {
    const { clerkId } = req.body;
    const user = await userModel.findOne({ clerkId });

    if (!user) {
      throw new Error("User not found with this clerkId");
    }

    if (user.creditBalance <= 0) {
      throw new Error(
        "Insufficient credits to remove background. Please buy credits."
      );
    }

    const imagePath = req.file.path;
    const imageFile = fs.createReadStream(imagePath);

    const formData = new FormData();
    formData.append("image_file", imageFile);

    const { data } = await axios.post(
      "https://clipdrop-api.co/remove-background/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
        },
        responseType: "arraybuffer",
      }
    );
    if (!data) {
      throw new Error("ClipDrop API did not return image data.");
    }
    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:${req.file.mimetype};base64,${base64Image}`;

    await userModel.findByIdAndUpdate(user._id, {
      creditBalance: user.creditBalance - 1,
    });

    return successResponse(res, {
      statusCode: 200,
      message: "Background removed successfully",
      payload: {
        resultImage,
        creditBalance: user.creditBalance - 1,
      },
    });
  } catch (error) {
    console.error("Error removing background:", error.message);
    if (error.response) {
      console.error("ClipDrop API Error:", error.response.data);
    }
    next(error);
  }
};

export { removeBgImage };