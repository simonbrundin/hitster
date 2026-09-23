# Hitster-regler och implementation

Följ den svenska officiella Hitster Original-regeln när spelet ändras. Källa:

- https://nordics.hitstergame.com/sv-se/how-to-play/
- https://hitstergame.com/en-us/pages/how-to-play-original

## Tidslinjer och turer

- Varje lag/spelare har en **egen** tidslinje. Låsta kort från lag A får aldrig visas på lag B:s tidslinje.
- Alla lag börjar med ett öppet musikkort som referens och tre Hitsterkort/tokens.
- Det aktiva laget får exakt ett nytt musikkort per tur. Kortet placeras med dold information i lagets vertikala tidslinje.
- Kortet får flyttas fritt tills laget väljer att rätta. Det får inte avslöjas eller låsas automatiskt när det dras.
- Rättning sker en gång för det aktuella kortet. Rätt placering låser kortet på det aktiva lagets tidslinje och turen går vidare efter att resultatet har visats. Fel placering förbrukar kortet och turen går vidare efter resultatet.
- UI:t ska visa en tydlig rätt/fel-animation och kräva ett klick på **Nästa låt** innan nästa lag får sin tur.
- Ett lag kan aldrig förlora kort som redan är låsta på dess tidslinje på grund av motståndarens senare fel.
- Det första laget med 10 hits i rätt tidsordning vinner.

## Valbart spelläge: Lås in-variant

Vid skapandet av ett spel kan `rulesMode` vara `original` eller `lock-in`.

- `original`: rätt kort låses direkt och resultatet avslutas med **Nästa låt**.
- `lock-in`: ett rätt kort är först obankat. Laget kan välja **Lås in** för att låsa alla rätta kort från turen och passa, eller **Ta nästa låt** för att fortsätta samma tur.
- Ett fel i `lock-in` förbrukar det aktuella kortet och alla rätta men olåsta kort från samma tur.
- Endast kort med `isLocked` och rätt `lockedByTeamId` får bli permanenta på lagets tidslinje.

## Dold information

Före rättning får UI:t inte visa det aktuella kortets:

- låttitel
- artist
- albumomslag
- releaseår
- Spotify-länk som avslöjar låten

Efter rättning ska kortets information och releaseår visas. Ett felaktigt kort kan visas i resultatmeddelandet efter rättning, men får inte ligga kvar på tidslinjen.

## Hitsterkort / tokens

Varje lag börjar med tre tokens:

1. På den egna turen kan laget använda en token för att byta den aktuella låten mot en ny.
2. På motståndarens tur kan laget utmana innan kortet rättas. En lyckad utmaning ger kortet till utmanaren på utmanarens egen tidslinje; en misslyckad utmaning förbrukar token.
3. När som helst kan laget byta tre tokens mot ett musikkort som säkras på korrekt plats utan årsgissning.

Tokens ska dras från rätt lag och får inte delas mellan lag. En utmaning får bara göras före rättning och ska inte avslöja kortets information.

## State-invarianter

- `lockedByTeamId` äger ett låst kort. `isReference` markerar startkortet som visas som referens för alla lag.
- Ett låst kort från ett annat lag får inte ingå i `getTimelineCards()` för det aktiva laget.
- Ett kort som ännu inte rättats ska ha dold presentation och får flyttas flera gånger.
- `isDiscarded` innebär att kortet inte längre får visas på någon tidslinje.
- Blanda inte ihop placering, rättning, låsning och förbrukning av tokens.
