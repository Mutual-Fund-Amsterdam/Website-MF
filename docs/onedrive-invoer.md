# Excelinvoer en OneDrive

## Eenmalige inrichting

1. Registreer bij Microsoft Entra een webapp die persoonlijke Microsoft-accounts ondersteunt.
2. Registreer exact `https://www.mutualfund.nl/api/portal/onedrive/callback` als web-redirect-URI. Gebruik voor een afzonderlijke testomgeving diens eigen HTTPS-adres en appregistratie.
3. Gebruik gedelegeerde `Files.Read` en `offline_access`. De koppeling downloadt het bestand; zij gebruikt niet de Excel workbook-API en schrijft niet terug in de master.
4. Stel uitsluitend op de server `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET` en `MF_SITE_URL=https://www.mutualfund.nl` in. Bewaar de geheime waarde buiten GitHub en Excel.
5. Open als hoofdbestuurder `/beheer/koppelingen`, kies **OneDrive verbinden** en meld aan met de eigenaar van de bestaande master. Rond de Microsoft-toestemming zelf af.
6. De map `Mutual Fund/Website invoer` en het bestand `Website invoer - MASTER.xlsx` worden op ID vastgelegd. Een ander bestand of account wordt niet automatisch gekozen.

De bestaande beveiligde import blijft bruikbaar voordat Microsoft verbonden is. Microsoft-meldingen kunnen vertraagd worden. De dagelijkse onderhoudstaak controleert ook het bestand en vernieuwt het abonnement. **Bestand controleren** kan door het hoofdbestuur worden gebruikt zonder Marketstack aan te roepen.

## Nieuwe invoer

Vul alleen gele cellen op **Invoer** in. Nieuwe regels beginnen als **Concept**; kies **Klaar** om een volledige regel te laten verwerken. De vooraf klaargezette regels bevatten vaste, beschermde invoer-ID's. Kopieer of verwijder die ID's niet. Achtergrondtabbladen bevatten de migratiebasis en oorspronkelijke historie.

- Aandelen: aantallen zijn positief; Koop/Verkoop bepaalt het teken. Kosten staan in de transactievaluta en moeten ook bij nul worden ingevuld. Bij een bestaand aandeel worden valuta en beursgegevens alvast ingevuld. Een nieuw aandeel vereist naam, beurs, ISIN, koerscode, TradingView-code en sector.
- Leden: gebruik een uniek Lid-ID. Inactief beëindigt toegang; het verwijdert geen deelbewijzen. De persoonlijke code blijft hoofdlettergevoelig.
- Ledenmutaties: het bedrag is positief; het type bepaalt het teken. De boekingsprijs is een gecontroleerde deelbewijsprijs. Een aanwezige officiële waarde op exact dezelfde datum kan worden gebruikt. Een andere geldontvangstdatum of afwikkeldatum vereist beoordeling voordat die regel automatisch kan worden verwerkt.
- Saldi: geef het totale saldo per fonds/rekening/valuta na alle boekingen van de peildag. Broker is de totale brokercash per valuta, inclusief de gebruikte brokers. Alleen strikt latere mutaties worden nog toegepast. ING en Overig gebruiken EUR.

Een fondswissel bestaat uit een gekoppelde opname en storting, met beide lid-ID's en boekingsprijzen. Bij volledige uitstap moeten alle deelbewijzen zijn opgenomen. Opnames die groter zijn dan het belang worden geweigerd. De hele nieuwe wijzigingsset wordt bij een fout niet gepubliceerd.

Verwerkte financiële regels blijven bewaard. Foutieve invoer wordt met een nieuwe tegenboeking en een nieuwe juiste regel hersteld; verander een eerder verwerkt bedrag niet. De website weigert gewijzigde of verdwenen eerder geaccepteerde financiële invoer-ID's.

**Stand** toont berekende aantallen en cash; **Risico** behoudt de berekeningen op administratiemetingen. De website gebruikt de opgeslagen koershistorie voor dagelijkse ontwikkeling en vermeldt de periode en eventuele indicatieve status. Nieuwe posities wijzigen actuele spreiding; zij herschrijven geen eerder gerealiseerde rendementen.

## Koersbudget

- Eén gedeelde productietaak: `15 5 * * *` UTC; Vercel Hobby mag binnen het uitvoeringsuur starten.
- De atomaire dagvergrendeling blijft na een gedeeltelijke fout staan. Er volgt geen automatische betaalde herhaling.
- Bezoeken, inloggen, Excelimport en OneDrive-opslag halen geen Marketstack-data op.
- Historische batches vereisen zowel `MARKETSTACK_HISTORY_ENABLED=1` als een expliciet bevestigd budget van 1–3 credits per batch. Deze instelling staat standaard uit.
- Bestuurders zien gereserveerde credits en taakuitkomsten op `/beheer/koppelingen`. Dit is geen uitlezing van het leveranciersdashboard. Oudere verbruikstellers bevatten een conservatieve openingsstand; die geldt niet als gemeten leveranciersverbruik.

## Controles voor vrijgave

Vergelijk alle oorspronkelijke leden, posities, cash en bronregels met de testmaster; test storting/opname/uitstap/fondswissel, dubbele invoer, Concept/Klaar, saldopeildagen en herstel na fouten. Test de Microsoft-koppeling met nagebootste Graph-antwoorden vóór echte aanmelding. Test beide grafiekmodi op een gezamenlijk 0%-beginpunt en controleer de zwevende tooltip op desktop en telefoon.
