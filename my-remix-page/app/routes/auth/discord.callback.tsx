import type { LinksFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import {
  Link,
  Outlet,
  useLoaderData,
} from "@remix-run/react";
import { Discord, User } from '~/models'

export const loader = async () => {

    // try {
    //     // Set HTTP status code
    //     const cookies = parse(ctx.req.header('Cookie'))
    //     const code = ctx.req.query('code')
    //     const discordState = ctx.req.query('state')
    // // make sure the state parameter exists
    // const { clientState } = cookies;
    // console.log('clientState !== discordState', clientState !== discordState)
    // if (clientState !== discordState) {
    // console.error('State verification failed.');
    // // return res.sendStatus(403);
    // }
    // const tokens: any = await Discord.getOAuthTokens(code);  
    // // 2. Uses the Discord Access Token to fetch the user profile
    // const meData: any = await Discord.getUserData(tokens);
    // const discord_user_id = meData.user.id;
    //     // store the user data on the db      
    // const userExists = (await User.findBy('discord_user_id', discord_user_id, ctx.env.DB)).length
    // // If user does not exist, create it
    // if (!Boolean(userExists)) {
    // const userForm = new UserForm(new User({
    //   discord_user_id,
    //   access_token: tokens.access_token,
    //   refresh_token: tokens.refresh_token,
    //   expires_at: (Date.now() + tokens.expires_in * 1000).toString()
    // }))
    // await User.create(userForm, ctx.env.DB)
    // }
    
    // // TODO: if user exists, update the access token
    
    // ctx.status(200)
    
    // // TODO: Redirect with UUID so we can associate the user with the wallet
    
    // // send the user to the Wallet login dialog screen
    //     return ctx.redirect(`/auth/wallet/${discord_user_id}`)
    // } catch (e) {
    // // console.error(e);
    // // res.sendStatus(500);
    // }
  return json({

  })
}


