# Excelinvoer en OneDrive

## Eenmalige inrichting

Voor een verenigingsadres zonder Microsoft-account kan eerst een afzonderlijk gratis Microsoft-account met dat bestaande e-mailadres worden geregistreerd. Upload de gecontroleerde master naar de OneDrive van dat account; alleen een gedeelde link naar een bestand dat privébezit blijft verandert het eigendom niet. Houd de bestaande master aan totdat de nieuwe locatie is gecontroleerd. Voor de appregistratie is daarnaast een eigen Entra-beheeromgeving nodig; Microsoft kan daarvoor een Azure-account met identiteitscontrole vragen.

1. Registreer bij Microsoft Entra een webapp die persoonlijke Microsoft-accounts ondersteunt.
2. Registreer exact `https://www.mutualfund.nl/api/portal/onedrive/callback` als web-redirect-URI. Gebruik voor een afzonderlijke testomgeving diens eigen HTTPS-adres en appregistratie.
3. Gebruik gedelegeerde `Files.ReadWrite` en `offline_access`. De koppeling leest de vaste master en schrijft uitsluitend de resultaatvelden op Risico terug. Zij gebruikt niet de Excel workbook-API. Een bestaande leesverbinding moet opnieuw toestemming krijgen.
4. Stel uitsluitend op de server `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET` en `MF_SITE_URL=https://www.mutualfund.nl` in. Bewaar de geheime waarde buiten GitHub en Excel.
5. Open als hoofdbestuurder `/beheer/koppelingen`, kies **OneDrive verbinden** en meld aan met de eigenaar van de bestaande master. Rond de Microsoft-toestemming zelf af.
6. De map `Website invoer` en het bestand `Website invoer - MASTER.xlsx` in de OneDrive van `voorzitter@mutualfund.nl` worden op ID vastgelegd. De lokale gedeelde map is `C:\Users\Gebruiker\OneDrive\Website invoer`. De oude map onder `Mutual Fund` wordt niet meer gebruikt. Een ander bestand of account wordt niet automatisch gekozen.

De bestaande beveiligde import blijft bruikbaar voordat Microsoft verbonden is. Microsoft-meldingen kunnen vertraagd worden. De dagelijkse onderhoudstaak controleert ook het bestand en vernieuwt het abonnement. **Bestand controleren** kan door het hoofdbestuur worden gebruikt zonder Marketstack aan te roepen.

## Nieuwe invoer

De master gebruikt losse tabbladen: **Uitleg, Risico, Leden, Toegang, Aandelen, Aan- en verkopen, Ledenmutaties, Cash en Stand**. Vul de gele velden in; er is geen publicatiestatus per regel. Alle werkblad- en werkmapbeveiliging is verwijderd, ook op berekende cellen. Dropdowns, kopregels en verborgen technische ID's blijven behouden. Een onvolledige of ongeldige wijziging wordt niet gepubliceerd; de vorige geldige versie blijft beschikbaar. Achtergrondtabbladen bewaren de migratiebasis en oorspronkelijke historie. Dit bestand dient alleen de website en vervangt de fondsadministratie niet.

- Aandelen: de aandelenlijst bevat elke ticker één keer. Vul alleen ticker, naam, beurs, valuta en sector in. De verborgen koers- en grafiekcodes worden automatisch ingevuld voor de aangeboden beurzen; bestaande ISIN-gegevens blijven behouden. Aan- en verkopen staan apart; kies een ticker uit de lijst. Aantallen zijn positief; Koop/Verkoop bepaalt het teken. Kosten staan in de transactievaluta en moeten ook bij nul worden ingevuld. Valuta en beursgegevens volgen de aandelenlijst.
- Leden: gebruik een uniek Lid-ID. Inactief beëindigt toegang; het verwijdert geen deelbewijzen. De persoonlijke code blijft hoofdlettergevoelig.
- Ledenmutaties: het bedrag is positief; het type bepaalt het teken. De boekingsprijs is een gecontroleerde deelbewijsprijs. Een aanwezige officiële waarde op exact dezelfde datum kan worden gebruikt. Een andere geldontvangstdatum of afwikkeldatum vereist beoordeling voordat die regel automatisch kan worden verwerkt.
- Cash: gebruik één rij per fonds/rekening/valuta. Werk het totale saldo én de peildatum bij na alle boekingen van die dag. Broker is de totale brokercash per valuta, inclusief de gebruikte brokers. Alleen strikt latere mutaties worden toegepast. ING en Overig gebruiken EUR. Andere brokersaldi en aandelenvaluta worden met opgeslagen ECB-rates omgerekend; ontbrekende of verouderde koersen blijven ontbrekend. De dropdown bevat 30 valuta.

Een fondswissel bestaat uit een gekoppelde opname en storting, met beide lid-ID's en boekingsprijzen. Bij volledige uitstap moeten alle deelbewijzen zijn opgenomen. Opnames die groter zijn dan het belang worden geweigerd. De hele nieuwe wijzigingsset wordt bij een fout niet gepubliceerd.

In dit gesplitste formaat mag een eerder verwerkte transactie rechtstreeks worden gecorrigeerd of verwijderd. Iedere import speelt alle invoer opnieuw af vanaf dezelfde migratiebasis. Een vorige gepubliceerde versie blijft in de afgeschermde opslag bewaard. Leden met financiële historie blijven op Leden staan; kies Inactief bij vertrek. Het oude gecombineerde invoerformaat behoudt zijn oorspronkelijke correctieregels.

**Stand** toont berekende aantallen; berekende cash staat naast de invoer op **Cash**. **Risico** en de website krijgen dezelfde resultaten uit één serverberekening. Huidige portefeuille — model gebruikt vaste huidige EUR-gewichten, dagelijks herwogen over twaalf maanden. Aandelen gebruiken splitsingsveilige, waar beschikbare dividendgecorrigeerde rendementen. Cashrente is in dit model 0%; vreemde cash draagt valutarisico. Onbekende overige bezittingen worden niet stilzwijgend risicovrij. Historisch fonds gebruikt de deelbewijsreeks; niet-gecontroleerde reconstructies blijven indicatief. Een dagelijkse statistiek vereist minstens 200 gezamenlijke rendementen over minstens 330 dagen. Ontbrekende €STR verbergt Sharpe. Nieuwe aankopen herschrijven eerdere fondsresultaten niet.

### Resultaten veilig terugschrijven

De resultaatversie is gekoppeld aan invoerdigest, koersgegevens en rekenmethode. Risico is bij het nieuwe formaat uitvoer en telt niet mee voor de invoerdigest. Daardoor veroorzaakt terugschrijven geen nieuwe financiële import. Alleen B6:K8, B13:K15 en D17:D18 op Risico worden aangepast; de rest van het OOXML-pakket blijft inhoudelijk gelijk. Tijden in Excel zijn Amsterdamse tijd.

Voor persoonlijk OneDrive gebruikt de server een uitgestelde upload met `If-Match` bij zowel sessieaanmaak als de definitieve commit. Nieuwe invoer, een nieuwere berekening, een 412-conflict of een vergrendeling mag niet worden overschreven. Resultaten blijven dan wachten; bestuurders zien de fout en de laatste schrijftijd. Alleen de dagelijkse taak, een bestandsmelding of de bestuurderscontrole herneemt dit; een ledenbezoek niet. De dagelijkse onderhoudstaak vernieuwt de Microsoft-subscriptie en controleert gemiste wijzigingen. Microsoft-meldingen zijn niet gegarandeerd direct.

## Koersbudget

- Eén gedeelde productietaak: `15 5 * * *` UTC; Vercel Hobby mag binnen het uitvoeringsuur starten.
- De atomaire dagvergrendeling blijft na een gedeeltelijke fout staan. Er volgt geen automatische betaalde herhaling.
- Bezoeken, inloggen, Excelimport en OneDrive-opslag halen geen Marketstack-data op.
- Historische batches vereisen zowel `MARKETSTACK_HISTORY_ENABLED=1` als een expliciet bevestigd budget van 1–3 credits per batch. Deze instelling staat standaard uit.
- Afzonderlijk toegestaan: ontbrekende eenjaarshistorie van huidige aandelen/index wordt uitsluitend in de dagelijkse taak gevuld, maximaal drie symbolen per dag en 100 extra credits per kalendermaand. Iedere instrumentidentiteit wordt maximaal één keer per maand geprobeerd. De bestaande gezamenlijke budgetbewaking geldt ook; er zijn geen betaalde retries op import of login.
- Bestuurders zien gereserveerde credits en taakuitkomsten op `/beheer/koppelingen`. Dit is geen uitlezing van het leveranciersdashboard. Oudere verbruikstellers bevatten een conservatieve openingsstand; die geldt niet als gemeten leveranciersverbruik.

## Controles voor vrijgave

Vergelijk alle oorspronkelijke leden, posities, cash en bronregels met de testmaster; test storting/opname/uitstap/fondswissel, dubbele en onvolledige invoer, saldopeildagen en herstel na fouten. Het eerdere werkmapformaat blijft leesbaar. Test de Microsoft-koppeling met nagebootste Graph-antwoorden vóór echte aanmelding. Test beide grafiekmodi op een gezamenlijk 0%-beginpunt en controleer de zwevende tooltip op desktop en telefoon.

## Lokale verificatie

Gebruik de gebundelde Node 24-runtime. Tests voor de rekenkern en het gesplitste formaat draaien met `node --import ./scripts/register-types.mjs scripts/verify-current-risk.mjs` respectievelijk `scripts/verify-split-workbook.mjs`. Microsoft wordt nagebootst met `scripts/verify-onedrive.mjs` en `scripts/verify-onedrive-writeback.mjs`. Geen van deze tests gebruikt echte Marketstack-data of Microsoft-credentials. De daadwerkelijke Graph-commit moet na de eenmalige Microsoft-inrichting nog met het voorzitteraccount worden gecontroleerd.
