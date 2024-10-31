V2.3 :
# - Finally a way to move invaders by naming new ones with the same ID ! 
# - Subtle change in web style (bootstrap5 implementation).
# - Button to center screen to current position.
# - Change static icon at current position.
- Websocket server for live invaders.
- Preferences for invaders states, ?marked, etc.
# - Admin tools (Flask-Admin) --> Remove unused accounts.
# - Option to mark invader directly in profile (potentially other options).
# - Dark/white theme.
- A way to rotate the map (like google maps).
- [Directions API](https://docs.mapbox.com/api/navigation/directions/) for up to 25 invaders...
- Change routes files organization and create a 'mapping' directory to divide tasks of mapping.js.
- - Séparer ce qui est relatif aux fonctions utilitaires (ajout d'invader pur et dur) et ce qui est relatif à la map elle-même (ajout du marker sur la map) => créer deux classes différentes initialisées.
- Compteur d'invaders qui change quand on ajoute ou retire un invader.
# - General class for modals (information and confirmation modals' base) [POSTPONED -> BOOTSTRAP]
## - Make a comment on an invader.
- Validate modal when pressing enter.
- MaJ release notes on main page.

V3 :
- Make VaderMap a more general and open service for people who want to share editable maps.
- - Private/public maps.
- - Map chat for contributors.
- - Global users can create X maps and then pay for more.
- Maps specificity :
- - Choose a set of icons you want to use...
- Make the invaders map into a specific section/fork of VaderMap (special case).
- Phone application (APK ?).
