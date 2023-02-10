import type { Context } from 'hono'
import { Discord } from '../models'

export class RolesController {
  static async link(ctx: Context) {
    const { url, state } = await Discord.getOAuthUrl();
    console.log('url', url)
    const response = new Response(null, {
      status: 301,
      headers: {
        'Location': url,
      }
    });
    response.headers.set("Set-Cookie", `clientState=${state}; Max-Age=300000;}`)
    return response;
  }
}
