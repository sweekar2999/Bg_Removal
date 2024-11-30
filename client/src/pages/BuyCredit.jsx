import { useContext, useState } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";

const BuyCredit = () => {
  const { backendUrl, loadCreditsData } = useContext(AppContext);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initPay = async (order) => {
    if (!window.Razorpay) {
      return toast.error("Razorpay SDK not loaded. Please try again.");
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Credits Payment",
      description: "Credits Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        console.log("Razorpay response:", response);
        const token = await getToken();
        if (!token) {
          return toast.error("Authentication failed. Please login and try again.");
        }

        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verify-razor",
            response,
            { headers: { token } }
          );
          if (data.success) {
            loadCreditsData();
            navigate("/");
            toast.success("Credits Added Successfully!");
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          const errorMsg =
            error.response?.data?.message || "Failed to verify payment. Please try again.";
          toast.error(errorMsg);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const paymentRazorPay = async (planId) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        return toast.error("Authentication failed. Please login and try again.");
      }
      const { data } = await axios.post(
        backendUrl + "/api/user/pay-razor",
        { planId },
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
      }
    } catch (error) {
      console.error("Error in paymentRazorPay:", error);
      const errorMsg =
        error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!plans || plans.length === 0) {
    return <p>No plans available at the moment. Please check back later.</p>;
  }

  return (
    <section className="min-h-[82vh] text-center pt-14 mb-10">
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>
      <h1 className="text-center text-2xl md:text-3xl lg:text-4xl font-semibold mt-4 bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent mb-8 sm:mb-10">
        Choose the plan that`s right for you
      </h1>
      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            className="bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-700 hover:scale-105 transition-all duration-500"
            key={index}
          >
            <img src={assets.logo_icon} alt="Plan Logo" />
            <p className="mt-3 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">${item.price}</span>/{" "}
              {item.credits} credits
            </p>
            <button
              onClick={() => paymentRazorPay(item.id)}
              disabled={isLoading}
              className={`w-full text-white text-sm mt-8 ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800"
              } rounded-md min-w-52 py-2.5`}
            >
              {isLoading ? "Processing..." : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BuyCredit;
