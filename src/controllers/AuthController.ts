import type { Context } from 'hono'
import { parse } from 'cookie';
import { Discord } from '../models'
import { UserForm } from '../forms/UserForm';
import { User } from '../models/User';
import { html } from 'hono/html';


export class AuthController {
  // STEP 1: User clicks the "Connect with Discord" button
  static async discord(ctx: Context) {
    try {
			// Set HTTP status code
			const cookies = parse(ctx.req.header('Cookie'))
			const code = ctx.req.query('code')
			const discordState = ctx.req.query('state')
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
      const userExists = (await User.findBy('discord_user_id', discord_user_id, ctx.env.DB)).length
      // If user does not exist, create it
      if (!Boolean(userExists)) {
        const userForm = new UserForm(new User({
          discord_user_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: (Date.now() + tokens.expires_in * 1000).toString()
        }))
        await User.create(userForm, ctx.env.DB)
      }

      // TODO: if user exists, update the access token
      
      ctx.status(200)

      // TODO: Redirect with UUID so we can associate the user with the wallet

      // send the user to the Wallet login dialog screen
			return ctx.redirect(`/auth/wallet/${discord_user_id}`)
    } catch (e) {
      // console.error(e);
      // res.sendStatus(500);
    }
  }

  // Step 2: User clicks the "Connect with Freighter" button
  static async wallet(ctx: Context) {
    const { discord_user_id } = ctx.req.param()
    return ctx.html(
      html`
        <!DOCTYPE html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.3.1/index.min.js"></script>
        </head>
        <script>
          

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
  static async account(ctx: Context) {
    const { public_key, discord_user_id }: any = await ctx.req.json()

    const user = await User.findOne('discord_user_id', discord_user_id, ctx.env.DB)
    // Fetch the account
    const account: any = await (await fetch(`https://horizon-testnet.stellar.org/accounts/${public_key}`)).json()
    let theAssetToVerify = "MYNT";
    let theIssuerToVerify = "GBPQHGMDPMSG5RY44AD664CVQSFUA7VD432A3DNFUAJSLGPL424W34L3";
    //[{"MYNT":"GBPQHGMDPMSG5RY44AD664CVQSFUA7VD432A3DNFUAJSLGPL424W34L3"}, {"second":"secondissuer"}, {"etc":"etc"}]
  console.log(JSON.stringify(account.balances));
  try{
    for (let balances in account.balances){
      let theobject = account.balances[balances]
      if (theobject.asset_code == theAssetToVerify && theobject.asset_issuer == theIssuerToVerify){
        console.log("the asset has been found!\n", JSON.stringify(account.balances[balances]));
        let loggingdata = await Discord.getMetadata(discord_user_id, {}, ctx);
        console.log(loggingdata);
        console.log(JSON.stringify(loggingdata.metadata));
      };
       
        // Tier 1 example
        let metadata = {
          ambassador: 1,
          pilot: undefined,
          captain: undefined,
         // Tier2: 1
        //  Tier3: 1
        }
        await Discord.pushMetadata(discord_user_id, {}, metadata, ctx)
      };
  }  catch(err: any){
    console.error('therewas an error\n', err)
  }
  
    //await User.update({ id: user.id , public_key: account.id }, ctx.env.DB)
    // 3 test assets
    //we'll need to register the tests
    // tier1
    // tier2
    // tier3
    // discord.bot.actions.user.setrole()
    /*Object {
      platform_name: Stellar Discord Bot,
      platform_username: null,
      metadata: Object
    }*/
    // TODO: Check for any NFTs on the account
    //let metadata: ApplicationRoleConnectionMetadataType = {}

    // IF NFTs exist, update discord metadata by calling the Discord API
    // use the discord tokens to update the user's profile
    // let metadata = {
    //   ambassador: {
    //     type: 7
    //   }
    // }

    // Redirect to discord
    return ctx.json({ message: public_key })
  }
}
