import type { Context } from 'hono'
import { parse } from 'cookie';
import { Discord } from '../models'
import { UserForm } from '../forms/UserForm';
import { User } from '../models/User';
import { html } from 'hono/html';
import { IntegrationAccount } from 'discord.js';
import { Horizon } from './horizon_api'
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
              fetch('/auth/account', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body
              })
              console.log('body', body)
            })
          }
        </script>
        <button onclick="getPublicKey('${discord_user_id}')">Connect with Freighter</button>
      `
    )
  }
  // Step 3: Posts the public key to the server
  static async account(ctx: Context) {
    let mainnet=0;
    let server = "https://horizon-testnet.stellar.org";
    if(mainnet){let server = "https://horizon.stellar.org"};
    let theAssets: Array<Array<string>> = [
      ["Pilot", "GBPQHGMDPMSG5RY44AD664CVQSFUA7VD432A3DNFUAJSLGPL424W34L3"],
      ["Captain", "GBPQHGMDPMSG5RY44AD664CVQSFUA7VD432A3DNFUAJSLGPL424W34L3"],
      ["Navigator", "GBPQHGMDPMSG5RY44AD664CVQSFUA7VD432A3DNFUAJSLGPL424W34L3"]
    ]
    const { public_key, discord_user_id }: any = await ctx.req.json();

    const user = await User.findOne('discord_user_id', discord_user_id, ctx.env.DB)
    // Fetch the account
    
    const account: Horizon.AccountResponse = await (await fetch(`${server}/accounts/${public_key}`)).json()
    const balances: Horizon.BalanceLine[] = account.balances
    console.log(JSON.stringify(account.balances));
    // check for the NFT
   //let metadata = new Map()
   

   let metadata = {      
      pilot: 0,
      captain: 0,
      navigator: 0,
    }
    function updateMetadata(role: string){
      switch(role){
        case 'Pilot':
          console.log('found pilot')
          metadata.pilot = 1
        case 'Captain':
          console.log('found captain')
          metadata.captain = 1
        case 'Navigator':
          console.log('found navigator')
          metadata.navigator = 1
      }
      
    }
  try{
     
    balances.map(async(balance)=>{
      for (let asset in theAssets){
        let AssetCode: string = theAssets[asset][0];
        let AssetIssuer: string = theAssets[asset][1];
        console.log(`the asset ${AssetCode}:${AssetIssuer} is being checked against ${JSON.stringify(balance)}\n`)
        if( balance.asset_code == AssetCode && balance.asset_issuer == AssetIssuer ){
          console.log(`i found the ${AssetCode}:${AssetIssuer} in account ${public_key}`)
          updateMetadata(AssetCode)
        }else{
          
        }}
      });

      
      console.log(JSON.stringify(metadata))
    await Discord.pushMetadata(discord_user_id, {}, metadata, ctx)
    }
  catch(err: any){
    console.error('therewas an error\n', err)
  }
    // Redirect to discord
    return ctx.json({ message: public_key })
  }
}
