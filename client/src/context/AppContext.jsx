import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createContext, useState } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [image, setImage] = useState(false);
  const [resultImage, setResultImage] = useState(false);
  const navigate = useNavigate();

  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [credit, setCredit] = useState(false);

  const loadCreditsData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/user/credits', { headers: { token } });
      if (data.success) {
        setCredit(data.credits);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeBG = async (image) => {
    try {
      if (!image) {
        throw new Error("No image file selected.");
      }
      if (!isSignedIn) {
        return openSignIn();
      }
      console.log("Image selected, navigating to result page...");
      setImage(image);
      setResultImage(false);
      navigate("/result");
  
      const token = await getToken();
      const formData = new FormData();
      image && formData.append("image", image);
  
      const { data } = await axios.post(
        `${backendUrl}/api/image/remove-bg`,
        formData,
        { headers: { token, "Content-Type": "multipart/form-data" } }
      );
  
      if (data.success) {
        setResultImage(data.resultImage); // Access `resultImage` directly
        data.creditBalance && setCredit(data.creditBalance); // Access `creditBalance` directly
      } else {
        alert("Something went wrong");
        if (data.creditBalance === 0) {
          navigate("/buy-credits");
        }
      }
    } catch (error) {
      console.error("Error in removeBG:", error);
      alert("Failed to remove background. Please try again.");
    }
  };
  

  const value = {
    setCredit,
    credit,
    backendUrl,
    loadCreditsData,
    removeBG,
    image,
    resultImage,
    setResultImage,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;