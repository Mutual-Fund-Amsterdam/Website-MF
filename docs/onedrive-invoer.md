# Excelinvoer en OneDrive

## Eenmalige inrichting

Voor een verenigingsadres zonder Microsoft-account kan eerst een afzonderlijk gratis Microsoft-account met dat bestaande e-mailadres worden geregistreerd. Upload de gecontroleerde master naar de OneDrive van dat account; alleen een gedeelde link naar een bestand dat privébezit blijft verandert het eigendom niet. Houd de bestaande master aan totdat de nieuwe locatie is gecontroleerd. Voor de appregistratie is daarnaast een eigen Entra-beheeromgeving nodig; Microsoft kan daarvoor een Azure-account met identiteitscontrole vragen.

1. Registreer bij Microsoft Entra een webapp die persoonlijke Microsoft-accounts ondersteunt.
2. Registreer exact `https://www.mutualfund.nl/api/portal/onedrive/callback` als web-redirect-URI. Gebruik voor een afzonderlijke testomgeving diens eigen HTTPS-adres en appregistratie.
3. Gebruik gedelegeerde `Files.Read` en `offline_access`. De koppeling downloadt het bestand; zij gebruikt niet de Excel workbook-API en schrijft niet terug in de master.
4. Stel uitsluitend op de server `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET` en `MF_SITE_URL=https://www.mutualfund.nl` in. Bewaar de geheime waarde buiten GitHub en Excel.
5. Open als hoofdbestuurder `/beheer/koppelingen`, kies **OneDrive verbinden** en meld aan met de eigenaar van de bestaande master. Rond de Microsoft-toestemming zelf af.
6. De map `Website invoer` en het bestand `Website invoer - MASTER.xlsx` in de OneDrive van `voorzitter@mutualfund.nl` worden op ID vastgelegd. De lokale gedeelde map is `C:\Users\Gebruiker\OneDrive\Website invoer`. De oude map onder `Mutual Fund` wordt niet meer gebruikt. Een ander bestand of account wordt niet automatisch gekozen.

De bestaande beveiligde import blijft bruikbaar voordat Microsoft verbonden is. Microsoft-meldingen kunnen vertraagd worden. De dagelijkse onderhoudstaak controleert ook het bestand en vernieuwt het abonnement. **Bestand controleren** kan door het hoofdbestuur worden gebruikt zonder Marketstack aan te roepen.

## Nieuwe invoer

De master gebruikt losse tabbladen: **Uitleg, Leden, Toegang, Aandelen, Aan- en verkopen, Ledenmutaties, Cash, Stand en Risico**. Vul de gele velden in; er is geen publicatiestatus per regel. Een onvolledige of ongeldige wijziging blokkeert de nieuwe import, zodat de vorige geldige versie beschikbaar blijft. Beschermde, verborgen invoer-ID's voorkomen dubbele verwerking. Achtergrondtabbladen bewaren de migratiebasis en oorspronkelijke historie. Dit bestand dient alleen de website en vervangt de fondsadministratie niet.

- Aandelen: de aandelenlijst bevat elke ticker één keer. Een nieuw aandeel vereist naam, beurs, valuta, ISIN, koerscode, TradingView-code en sector. Aan- en verkopen staan apart; kies een ticker uit de lijst. Aantallen zijn positief; Koop/Verkoop bepaalt het teken. Kosten staan in de transactievaluta en moeten ook bij nul worden ingevuld. Valuta en beursgegevens volgen de aandelenlijst.
- Leden: gebruik een uniek Lid-ID. Inactief beëindigt toegang; het verwijdert geen deelbewijzen. De persoonlijke code blijft hoofdlettergevoelig.
- Ledenmutaties: het bedrag is positief; het type bepaalt het teken. De boekingsprijs is een gecontroleerde deelbewijsprijs. Een aanwezige officiële waarde op exact dezelfde datum kan worden gebruikt. Een andere geldontvangstdatum of afwikkeldatum vereist beoordeling voordat die regel automatisch kan worden verwerkt.
- Cash: gebruik één rij per fonds/rekening/valuta. Werk het totale saldo én de peildatum bij na alle boekingen van die dag. Broker is de totale brokercash per valuta, inclusief de gebruikte brokers. Alleen strikt latere mutaties worden toegepast. ING en Overig gebruiken EUR. Andere brokersaldi en aandelenvaluta worden met opgeslagen ECB-rates omgerekend; ontbrekende of verouderde koersen blijven ontbrekend. De dropdown bevat 30 valuta.

Een fondswissel bestaat uit een gekoppelde opname en storting, met beide lid-ID's en boekingsprijzen. Bij volledige uitstap moeten alle deelbewijzen zijn opgenomen. Opnames die groter zijn dan het belang worden geweigerd. De hele nieuwe wijzigingsset wordt bij een fout niet gepubliceerd.

Verwerkte aan-/verkopen en ledenmutaties blijven bewaard. Foutieve invoer wordt met een nieuwe tegenboeking en een nieuwe juiste regel hersteld; verander een eerder verwerkt bedrag niet. De website weigert gewijzigde of verdwenen eerder geaccepteerde financiële invoer-ID's. Een cashrij is juist een bijwerkbare, gedateerde eindstand.

**Stand** toont berekende aantallen; de berekende cash staat naast de invoer op **Cash**. **Risico** behoudt de berekeningen op administratiemetingen, met een compacte resultaatweergave. De website gebruikt de opgeslagen koershistorie voor dagelijkse ontwikkeling en vermeldt de periode en eventuele indicatieve status. Nieuwe posities wijzigen actuele spreiding; zij herschrijven geen eerder gerealiseerde rendementen.

## Koersbudget

- Eén gedeelde productietaak: `15 5 * * *` UTC; Vercel Hobby mag binnen het uitvoeringsuur starten.
- De atomaire dagvergrendeling blijft na een gedeeltelijke fout staan. Er volgt geen automatische betaalde herhaling.
- Bezoeken, inloggen, Excelimport en OneDrive-opslag halen geen Marketstack-data op.
- Historische batches vereisen zowel `MARKETSTACK_HISTORY_ENABLED=1` als een expliciet bevestigd budget van 1–3 credits per batch. Deze instelling staat standaard uit.
- Bestuurders zien gereserveerde credits en taakuitkomsten op `/beheer/koppelingen`. Dit is geen uitlezing van het leveranciersdashboard. Oudere verbruikstellers bevatten een conservatieve openingsstand; die geldt niet als gemeten leveranciersverbruik.

## Controles voor vrijgave

Vergelijk alle oorspronkelijke leden, posities, cash en bronregels met de testmaster; test storting/opname/uitstap/fondswissel, dubbele en onvolledige invoer, saldopeildagen en herstel na fouten. Het eerdere werkmapformaat blijft leesbaar. Test de Microsoft-koppeling met nagebootste Graph-antwoorden vóór echte aanmelding. Test beide grafiekmodi op een gezamenlijk 0%-beginpunt en controleer de zwevende tooltip op desktop en telefoon.
