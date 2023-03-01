//import fetch from 'node-fetch';
const DISCORD_BOT_TOKEN = 'MTA4MDE0MTUwMjE0OTMwMDIyNQ.GK4No9.7gJxFC5dB-i_3gzKhg0olzeXBGnVLyAljVn9d0';
const DISCORD_CLIENT_ID = '1080141502149300225'
/**
 * Register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */
const url = `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/role-connections/metadata`;
// supported types: number_lt=1, number_gt=2, number_eq=3 number_neq=4, datetime_lt=5, datetime_gt=6, boolean_eq=7, boolean_neq=8
const body = [
  {
    "key":"pilot",
    "name":"Pilot",
    "description":"Is a Pilot",
    "type":7
},
{
    "key":"captain",
    "name":"Stellar Captain",
    "description":"Is a Captain",
    "type":7
},
{
    "key":"navigator",
    "name":"Stellar Navigator",
    "description":"Is a Stellar Navigator",
    "type":7
},
];

const response = await fetch(url, {
  method: 'PUT',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
  },
});
if (response.ok) {
  const data = await response.json();
  console.log(data);
} else {
  //throw new Error(`Error pushing discord metadata schema: [${response.status}] ${response.statusText}`);
  const data = await response.text();
  console.log(data);
}