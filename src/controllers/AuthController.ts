import type { Context } from 'hono'
import { parse } from 'cookie';
import { Discord } from '../models'
import { UserForm } from '../forms/UserForm';
import { User } from '../models/User';
import { html } from 'hono/html'


export class AuthController {
  static async discord(c: Context) {
    try {
			// Set HTTP status code
			const cookies = parse(c.req.header('Cookie'))
			const code = c.req.query('code')
			const discordState = c.req.query('state')
      // make sure the state parameter exists
      const { clientState } = cookies;
      console.log('clientState !== discordState', clientState !== discordState)
      if (clientState !== discordState) {
        console.error('State verification failed.');
        // return res.sendStatus(403);
      }
  
      const tokens: any = await Discord.getOAuthTokens(code);  
      // 2. Uses the Discord Access Token to fetch the user profile
      const meData: any = await Discord.getUserData(tokens);
      const discord_user_id = meData.user.id;

			// store the user data on the db      
      const userExists = await User.findBy('discord_user_id', discord_user_id, c.env.DB)
      // If user does not exist, create it
      if (!Boolean(userExists.length)) {
        const userForm = new UserForm(new User({
          discord_user_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: (Date.now() + tokens.expires_in * 1000).toString()
        }))
        await User.create(userForm, c.env.DB)
      }

      // start the fitbit OAuth2 flow by generating a new OAuth2 Url
      // const { url, codeVerifier, state } = fitbit.getOAuthUrl();
  
      // // store the code verifier and state arguments required by the fitbit url
      // await storage.storeStateData(state, {
      //   discordUserId: userId,
      //   codeVerifier,
      // });
  
      c.status(200)
      // send the user to the Wallet login dialog screen
			return c.redirect(`/auth/wallet/${discord_user_id}`)
    } catch (e) {
      // console.error(e);
      // res.sendStatus(500);
    }
  }

  static async wallet(c: Context) {
    const { discord_user_id } = c.req.param()
    return c.html(
      html`
        <!DOCTYPE html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.3.1/index.min.js"></script>
        </head>
        <script>
          if (window.freighterApi.isConnected()) {
            alert("User has Freighter!");
          }
          function getPublicKey(discord_user_id) {
            window.freighterApi.getPublicKey().then((public_key) => {
              fetch('/auth/account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ public_key, discord_user_id })
              })
            })
          }
        </script>
        <button onclick="getPublicKey(${discord_user_id})">Connect with Freighter</button>
      `
    )
  }

  static async account(c: Context) {
    const { public_key, discord_user_id }: any = await c.req.json()
    console.log('public_key', public_key, discord_user_id)

    // get given account
    const account = await (await fetch(`https://horizon-testnet.stellar.org/accounts/${public_key}`)).json()

    
    console.log('account', account)


    return c.json({ message: public_key })
  }
}
