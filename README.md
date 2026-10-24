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

## Credits

Sea-creature avatars (`assets/av-*.webp`) are from [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft, used under the MIT License.
