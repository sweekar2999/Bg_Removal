import { Webhook } from 'svix'
import userModel from '../models/userModel.js'

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


export { clerkWebhooks, userCredits }