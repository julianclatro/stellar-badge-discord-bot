import { Hono } from 'hono'
import { RolesController, AuthController } from './controllers'
const app = new Hono()

app.get('/roles/link', RolesController.link)
app.get('/auth/discord/callback', AuthController.discord)
app.get('/auth/wallet/:discord_user_id', AuthController.wallet)
app.post('/auth/account', AuthController.account)

export default app