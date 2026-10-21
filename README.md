# Fliptide

A push-your-luck memory game for 2 to 8 players: pass-and-play on one device, AI opponents, and online play with friends on their own devices (powered by Firebase Realtime Database).

Created by Lydia Lichti in partnership with Grudge Match Games.

Copyright © 2026 Grudge Match Games

## Grudge Match account (profile, friends)

The round profile button at the top of the home screen signs players in with the same Grudge Match account as Food Fight and BoomTown
(Supabase project `zhfkcjzajazsrpqeyaea`: email and password, Google, Facebook). Guests can still play without one.

- `public.gm_app_profiles` (app `fliptide`): this game's own picture (a sea creature or an uploaded photo), name and stats. Each game keeps its own row, so pictures never carry over between games. Migration: `supabase/migrations/20261021000001_gm_app_profiles.sql`.
- `public.friends`: the shared friend list (requests, accept, decline, remove). `public.users_public`: usernames for friend search.
- `public.user_statuses` (read only) and Realtime presence on `ff:social` (listen only) show friends who are online in BoomTown or Food Fight. `ft:social` carries Fliptide presence and game invites, acted on only from accepted friends.
- Uploaded photos go to the `uploads` bucket under `<user id>/fliptide/`.
- The leaderboard gets a Friends tab with each friend's best score.

One dashboard step for Google and Facebook sign-in: Supabase → Authentication → URL Configuration → Redirect URLs, add `https://fliptide.grudgematchgames.com/**`.

## Credits

Sea-creature avatars (`assets/av-*.webp`) are from [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft, used under the MIT License.
