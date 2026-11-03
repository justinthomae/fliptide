# Fliptide

A push-your-luck memory game for 2 to 8 players: pass-and-play on one device, AI opponents, and online play with friends on their own devices (powered by Firebase Realtime Database).

Created by Lydia Lichti in partnership with Grudge Match Games.

Copyright © 2026 Grudge Match Games

## Grudge Match account (profile, friends)

The round profile button at the top of the home screen signs players in with the same Grudge Match account as Food Fight and BoomTown
(Supabase project `zhfkcjzajazsrpqeyaea`: email and password, Google, Facebook). Guests can still play without one.

- `public.gm_app_profiles` (app `fliptide`): this game's own picture (a sea creature or an uploaded photo), name and stats. Each game keeps its own row, so pictures never carry over between games. Migration: `supabase/migrations/20261021000001_gm_app_profiles.sql`.
- `public.friends`: the shared friend list (requests, accept, decline, remove). `public.users_public`: usernames for friend search.
- Realtime channel `gm:social`, shared by all the Grudge Match games: presence `{uid, game, name, st, code}` and invites carrying `game`. Fliptide only acts on invites for `fliptide` from accepted friends; a friend in another game shows where they are, with no Join button. `public.user_statuses` (read only) shows friends online in BoomTown.
- Invites go through the shared Grudge Match invites: `gm-invites.js` (the same file as Food Fight's `js/gm-invites.js`, loaded before the main script; rules in justinthomae/Food-Fight `docs/grudge-match-invites.md`) and the `public.gm_invites` table. One Invite friends button in the lobby lists every friend. A friend in any Grudge Match game gets a pop-up there with Join now or After this game, and the host is told the answer. If the table can't be reached, a live message on `gm:social` reaches friends who are online.
- Uploaded photos go to the `uploads` bucket under `<user id>/fliptide/`.
- The leaderboard gets a Friends tab with each friend's best score.

One dashboard step for Google and Facebook sign-in: Supabase → Authentication → URL Configuration → Redirect URLs, add `https://fliptide.grudgematchgames.com/**`.

## Admin dashboard

`admin.html` (fliptide.grudgematchgames.com/admin.html) is the admin dashboard. Sign in with a Grudge Match Games account that has
the admin role (or a row in `public.gm_app_admins`). It shows:

- **Overview:** players, time played, average visit, games played and accounts, each compared with the period before; players,
  time and games per day; visits by hour of day; most played modes; phones, tablets and computers (and how many play from the
  installed app); the players with the most time played. 7, 30 or 90 days, on Mountain Time.
- **Online now:** who has the game open right now and what they're doing (menu, lobby, playing which mode). Updates every 15 seconds.
- **Players:** every player who has played signed in, with search. Open one for their time per day, recent games and stats, and to
  rename them, remove their picture or reset their stats.
- **Game modes:** pass and play, vs AI (by level) and online: share of games, finish rate, average length and players.
- **Customize:** opens the game's Studio straight at a section (`/?studio=colors` and so on) for logos, artwork, token icons,
  narrators, cards, backgrounds, colors, fonts, text and sounds.

The game sends the usage data only on grudgematchgames.com: a small ping about every 30 seconds while it's on screen (time is
counted only while someone has touched it in the last 2 minutes) and one record per game. Guests are an anonymous device id;
signed-in players are linked to their account. Tables and functions: `supabase/migrations/20261102000001_gm_usage_and_admin.sql`.

## Credits

Music and sound effects (`assets/audio/*.mp3`) were made with ElevenLabs (Music v2.5 and Sound Effects v2) for Grudge Match Games, then trimmed and level-matched. The music loops seamlessly every 105.37 s. A sound or track uploaded in Studio replaces the built-in one; if the files can't load, the game falls back to its synthesized sounds.

Sea-creature avatars (`assets/av-*.webp`) are from [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft, used under the MIT License.
