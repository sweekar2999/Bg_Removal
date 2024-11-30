import { Webhook } from 'svix'
import userModel from '../models/userModel.js'
import transactionModel from "../models/transactionModel.js";
import Razorpay from "razorpay";

//Api Controller function to manage Clerk user with Database
//http://localhost:4000/api/user/webhooks

const clerkWebhooks = async (req,res) =>{
    
    try {

        console.log('Received webhook:', req.body);

        const whook =new Webhook(process.env.CLERK_WEBHOOK_SECRET)
        await whook.verify(JSON.stringify(req.body),{
            'svix-id' :req.headers["svix-id"],
            "svix-timestamp":req.headers["svix-timestamp"],
            "svix-signature":req.headers["svix-signature"]
        })

        console.log('Webhook verified successfully');

        const { data, type } = req.body

        switch ( type ) {

            case "user.created": {

                const userData ={
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url,
                }
                await userModel.create(userData)
                console.log('User created:', userData)
                res.json({})
                
                break;
            }        
            case "user.updated": {

                 const userData = {
                    email:data.email_addresses[0].email_address,
                    firstName:data.first_name,
                    lastName:data.last_name,
                    photo:data.image_url,
                }
                await userModel.findOneAndUpdate({clerkId:data.id},userData)
                console.log('User updated:', userData)
                res.json({})
                break;
            }        
            case "user.deleted": {
                await userModel.findOneAndDelete({clerkId:data.id})
                console.log('User deleted:', data.id)
                res.json({})
                break;
            }        
            default:
                console.log('Unhandled event type:', type);
                res.status(400).json({success: false, message: 'Unhandled event type'})
                break;
        }
    } catch (error) {
        console.error('Webhook error:', error)
        res.status(500).json({success: false, message: error.message})
    }
}


// API Controller function to get user available credits data
const userCredits = async (req, res) => {
    try {

        const { clerkId } = req.body

        // Fetching userdata using ClerkId
        const userData = await userModel.findOne({ clerkId })
        res.json({ success: true, credits: userData.creditBalance })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// Gateway initialize
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  // API to make payment for credits
  const paymentRazorpay = async (req, res) => {
  try {
    const { clerkId, planId } = req.body;

    const userData = await userModel.findOne({ clerkId });

    if (!userData || !planId) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    let credits, plan, amount;

    // Plan logic
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;
      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;
      default:
        return res.json({ success: false, message: "Invalid plan ID" });
    }

    // Declare and log date
    const date = Date.now();
    console.log("Date value:", date);

    const transactionData = {
      clerkId,
      plan,
      amount,
      credits,
      date,
    };

    const newTransaction = await transactionModel.create(transactionData);

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id,
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        return res.json({ success: false, message: error.message });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    console.error("Error in paymentRazorpay:", error.message);
    res.json({ success: false, message: error.message });
  }
};

  
  // API Controller function to verify razorpay payment
  const verifyRazorPay = async (req, res) => {
    try {
      const { razorpay_order_id } = req.body;
      console.log("Received order ID for verification:", razorpay_order_id);
  
      const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
      console.log("Order info from Razorpay:", orderInfo);
  
      if (orderInfo.status === "paid") {
        const transactionData = await transactionModel.findById(orderInfo.receipt);
        console.log("Transaction data from DB:", transactionData);
  
        if (transactionData.payment) {
          return res.json({ success: false, message: "Payment already processed." });
        }
  
        // Update user credits
        const userData = await userModel.findOne({ clerkId: transactionData.clerkId });
        if (!userData) {
          return res.json({ success: false, message: "User not found." });
        }
        console.log("User data before update:", userData);
  
        const creditBalance = (userData.creditBalance || 0) + transactionData.credits;
        await userModel.findByIdAndUpdate(userData._id, { creditBalance });
        console.log("Updated credit balance:", creditBalance);
  
        // Mark the transaction as paid
        await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });
        console.log("Transaction marked as paid.");
  
        return res.json({ success: true, message: "Credits added successfully." });
      } else {
        console.log("Order not paid. Status:", orderInfo.status);
        return res.json({ success: false, message: "Payment not successful." });
      }
    } catch (error) {
      console.error("Error in verifyRazorPay:", error);
      return res.json({ success: false, message: "Error verifying payment." });
    }
  };
  export { clerkWebhooks, userCredits, paymentRazorpay, verifyRazorPay };