import { authClient } from "@/lib/auth-client"; //import the auth client

const { data,    error } = await authClient.signUp.email({
        email: "tranphucpy2005@gmail.com", // user email address
        name: "Tran Phuc", // user display name (required)
        password: "Uncensored ", // user password -> min 8 characters by default
        callbackURL: "/dashboard" // A URL to redirect to after the user verifies their email (optional)
    }, {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
            // display the error message
            alert(ctx.error.message);
        },
});



// // will use to tanstack query this down the line 
// const { data: session, error } = await authClient.getSession()
