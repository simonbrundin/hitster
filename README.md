# Hitster Battle

An online, team-based music timeline game inspired by Hitster. The app is in [`src/nuxt`](src/nuxt/README.md).

## Regler

Appen använder Hitster Original som standard och erbjuder även en valbar Lås in-variant:

- Varje lag har en egen vertikal tidslinje, börjar med ett öppet musikkort och får tre Hitsterkort/tokens.
- Ett nytt musikkort placeras med dold information. Laget kan ändra placeringen tills kortet rättas.
- Rätt placering låser kortet på det aktiva lagets tidslinje. Fel placering gör att kortet förloras. Därefter går turen vidare.
- Första laget med 10 hits i rätt tidsordning vinner.
- Tokens kan användas för att byta låt, utmana ett motståndarkort eller byta tre tokens mot ett säkrat kort.
- Låtens titel, artist, omslag och år visas först efter att kortet har rättats.

Vid skapandet av ett nytt spel kan man välja **Lås in-variant**. Då kan laget efter ett rätt svar välja **Lås in** eller **Ta nästa låt**. Olåsta rätta kort förloras om nästa gissning blir fel.

Se [appens README](src/nuxt/README.md#officiella-regler) för setup och fullständig dokumentation. Officiell svensk källa: [HITSTER Nordic – Så här spelar du](https://nordics.hitstergame.com/sv-se/how-to-play/).
