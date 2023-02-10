import type { Context } from 'hono'
import { parse } from 'cookie';
import { Discord } from '../models'
import { UserForm } from '../forms/UserForm';
import { User } from '../models/User';
import { html } from 'hono/html'


export class AuthController {
  // STEP 1: User clicks the "Connect with Discord" button
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
      const userExists = (await User.findBy('discord_user_id', discord_user_id, c.env.DB)).length
      // If user does not exist, create it
      if (!Boolean(userExists)) {
        const userForm = new UserForm(new User({
          discord_user_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: (Date.now() + tokens.expires_in * 1000).toString()
        }))
        await User.create(userForm, c.env.DB)
      }

      // TODO: if user exists, update the access token
      
      c.status(200)

      // TODO: Redirect with UUID so we can associate the user with the wallet

      // send the user to the Wallet login dialog screen
			return c.redirect(`/auth/wallet/${discord_user_id}`)
    } catch (e) {
      // console.error(e);
      // res.sendStatus(500);
    }
  }

  // Step 2: User clicks the "Connect with Freighter" button
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
            console.log('discord_user_id', discord_user_id)

            window.freighterApi.getPublicKey().then((public_key) => {
              const body = JSON.stringify({ public_key, discord_user_id })
              console.log('body', body)
              fetch('/auth/account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body
              })
            })
          }
        </script>
        <button onclick="getPublicKey('${discord_user_id}')">Connect with Freighter</button>
      `
    )
  }
  // Step 3: Posts the public key to the server
  static async account(c: Context) {
    const { public_key, discord_user_id }: any = await c.req.json()

    const user = await User.findOne('discord_user_id', discord_user_id, c.env.DB)
    // Fetch the account
    const account: any = await (await fetch(`https://horizon-testnet.stellar.org/accounts/${public_key}`)).json()

    await User.update({ id: user.id , public_key: account.id }, c.env.DB)
    // TODO: Check for any NFTs on the account
    // IF NFTs exist, update discord metadata by calling the Discord API
    // use the discord tokens to update the user's profile


    // Redirect to discord
    return c.json({ message: public_key })
  }
}
