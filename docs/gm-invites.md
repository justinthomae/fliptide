# Grudge Match game invites

Every Grudge Match game uses the same rules for friend invites, so a friend can be invited from any game into any other.
Fliptide and Food Fight follow them. Another game joins in by adding the receiving side below.

## Channel

All messages go over the Supabase Realtime channel **`gm:social`** (project `zhfkcjzajazsrpqeyaea`), broadcast event `m`.
Each signed-in player also tracks presence there, keyed by their user id:

```js
{ uid, game: 'fliptide', name, st: 'menu' | 'room' | 'playing', code }
```

`game` is the game's id: `fliptide`, `foodfight`, `boomtown`, `riotrace`, `broadside`, `onbelay`, `lostempires`.

Act on a message only when `to` is your user id **and** `from` is an accepted friend (`public.friends`, status `accepted`, no `blocked` row).

## Invite

Sent by the host (or anyone in the lobby) to one friend:

```js
{ t: 'invite', v: 2, id: '<random id>', from, name, to,
  game: 'fliptide', gameName: 'Fliptide', code: 'QWER',
  url: 'https://fliptide.grudgematchgames.com/?join=QWER' }
```

The receiving game shows it whatever game it is:

- **Same game:** join by `code` with the game's own join flow.
- **Another game:** say "<name> invited you to play <gameName>". Joining opens `url`. Only follow a `url` on `https://grudgematchgames.com` or `https://<sub>.grudgematchgames.com`; ignore the invite otherwise.

Buttons:

| Button | When | What it does |
|---|---|---|
| **Accept and join now** | always | reply `now`, then join (a game in progress is left; save it if the game can) |
| **Join after this game** | only while the player is mid-game | reply `later`, show a reminder with Cancel, and join the moment the current game ends (a short countdown with "Stay here" is fine) |
| **Not now** | always | reply `no` |

Cancelling a "later" (or "Stay here" on the countdown) sends `no`.

## Reply

Back to whoever sent the invite, carrying the invite's own `game` and `id`:

```js
{ t: 'invite-reply', v: 2, id: '<invite id>', from, name, to: '<inviter>', game: '<invite game>', answer: 'now' | 'later' | 'no' }
```

The inviting game shows a short note and the friend's state in its invite list:

- `now`: "<name> accepted your invite and is on the way."
- `later`: "<name> accepted your invite. They'll join as soon as their current game ends."
- `no`: "<name> can't join right now."

## Invite list

One **Invite friends** button in the lobby opens a list of all friends, each with its own **Invite** button.
Friends online in any Grudge Match game (present on `gm:social`) can be invited. Offline friends are listed without a button.
After an invite: "Invited ✓", then "On the way", "After their game" or "Not now", with "Again" after 30 seconds.
