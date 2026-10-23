# Ledenomgeving: inrichting en dagelijks gebruik

## Lokale proefversie

De proefversie kan met `MF_LOCAL_PREVIEW=1` en `MF_AUTH_PEPPER` zonder externe database draaien op `127.0.0.1`. De eerste drie beheerders worden met `MF_TARGET_ENV=development` voorbereid via `scripts/seed-portal-admins.mjs`. Daarna logt een beheerder in en importeert het volledige bestand via de website. De lokale opslag staat versleuteld in `.private/portal`; `.private` en `.env.local` zijn uitgesloten van Git. Deze proefstand werkt alleen op de computer waar de server draait en is niet de live website.

## Eenmalige inrichting in Vercel

1. Voeg via **Vercel → project Website-MF → Storage / Marketplace** een Upstash Redis-database in een EU-regio aan het project toe. De Vercel Marketplace-koppeling maakt `KV_REST_API_URL` en `KV_REST_API_TOKEN` aan voor **Production** en eventueel **Preview**. Rechtstreeks via Upstash aangemaakte databases kunnen ook `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN` gebruiken. Beide omgevingen gebruiken gescheiden sleutelnamen in de database.
2. Voeg één willekeurig geheim toe als omgevingsvariabele: `MF_AUTH_PEPPER` (minimaal 32 tekens). Gebruik een wachtwoordmanager en deel dit geheim niet via GitHub, Excel of e-mail. De lokale opstartstap gebruikt precies dezelfde waarde.
3. Start een nieuwe deployment zodat de variabelen actief worden.
4. Voer **eenmalig lokaal** `scripts/seed-portal-admins.mjs` uit met het MASTER-bestand. Controleer eerst met `--check`; gebruik daarna `--publish` met `MF_TARGET_ENV=preview` of `production` en dezelfde Upstash-variabelen. Het script bereidt uitsluitend de drie actieve hoofdbestuurders voor en weigert opnieuw te draaien als er al een portalversie bestaat. Er is geen openbare eerste Excelupload.
5. Een van de drie hoofdbestuurders logt in via `/inloggen`, opent vanuit het eigen fondsoverzicht `/beheer/import` en importeert daar het **volledige** MASTER-bestand. Controleer de aantallen en waarschuwingen vóór publicatie. Daarna moeten de drie beheerders opnieuw inloggen met hun eigen code.

De eerste opstart gebeurt dus via het beheerdersscript, zonder openbare Excelupload vóór het inloggen. Zonder opslag en geheimen in Vercel kan niemand veilig inloggen of een bestand importeren.

## Bij een wijziging in Excel

1. Sla de nieuwe versie van het MASTER-bestand in OneDrive op en wacht tot OneDrive aangeeft dat het synchroniseren klaar is.
2. Log in met je lid-ID en persoonlijke code. Alleen de code is hoofdlettergevoelig. Alleen een account met de rol `Hoofdbestuurder` kan vanuit het fondsoverzicht `/beheer/import` openen.
3. Kies het bestand opnieuw en controleer de voorvertoning vóór publicatie.
4. Na publicatie moeten leden opnieuw inloggen. De vorige versie blijft 30 dagen in de afgeschermde opslag bewaard.

De website kijkt **niet rechtstreeks in OneDrive**. Bewerkingen in Excel verschijnen dus pas na een nieuwe import. Codes blijven in het Excelbestand; de website slaat voor het inloggen alleen een eenrichtingsafdruk van de combinatie lid-ID en code op. Bewaar het Excelbestand alleen voor het bestuur toegankelijk.

## Huidige inhoud en beperkingen

- De bestaande werkmap heeft geen kolom `Status`. Daardoor worden alle 80 ingelezen accounts als actief beschouwd. Voeg bij voorkeur `Status` toe en zet oud-leden op `inactief` vóór de eerste publicatie.
- De participaties van fonds 2 en 3 tellen in de gecontroleerde bronversie niet op tot 100%. De site toont de actuele persoonlijke berekening zodra fondswaarde en wisselkoersen beschikbaar zijn, maar markeert deze in die fondsen als voorlopig met het afwijkende participatietotaal. Als actuele koersen ontbreken, verschijnt de duidelijk als bronwaarde gemarkeerde Excelwaarde. Rendement, Sharpe, beta, volatiliteit en maximale daling vragen een gecontroleerde reeks dagelijkse fondswaarden en fondsbewegingen; een huidige portefeuille alleen is daarvoor onvoldoende.
- ING- en brokerstanden worden niet automatisch opgehaald. De pagina toont één cashbedrag op basis van de laatst geïmporteerde Excelversie, omgerekend naar euro met ECB-referentiekoersen. De ING- en brokerpeildata blijven zichtbaar. `Overige waarde` zoals obligaties telt mee in het fondstotaal, maar niet bij cash.
- De persoonlijke codes in de huidige Excel zijn korte woorden. Voor een publieke uitrol met echte ledengegevens zijn langere, unieke codes verstandig.
- De sectorverdeling gebruikt een indicatieve indeling voor de huidige aandelen. Voeg desgewenst een optionele kolom `Sector` toe aan `Posities`; de website neemt die waarde bij de volgende Excelimport over.

## Dagelijkse slotkoersen

De server gebruikt geheime instellingen `MARKETSTACK_API_KEY` en `CRON_SECRET`. Er is één dagelijkse Vercel-taak om **05:15 UTC**: 06:15 Nederlandse wintertijd, 07:15 zomertijd. Dit is na de reguliere Amerikaanse beursdag. Vercel kan binnen het volgende uur starten. Een atomaire dagvergrendeling voorkomt dubbele uitvoering, ook bij gelijktijdige verzoeken. De vergrendeling blijft na fouten staan, zodat gedeeltelijk uitgevoerde aanvragen niet dezelfde dag worden herhaald.

De taak haalt alleen de laatste beschikbare slotkoers per uniek aandeel op, plus één korte recente S&P 500-reeks. Automatische historische downloads, paginering en de losse eerste koersimport zijn uitgeschakeld. Inloggen, paginaweergaven en Excelimport veroorzaken geen Marketstack-aanvragen. Bestaande historie blijft bewaard; per dag komen alleen de nieuwe beschikbare waarnemingen erbij. Een nog ontbrekende slotkoers wordt niet verzonnen of door een intraday-koers vervangen.

Bij 31 unieke tickers en één index kost één succesvolle dagelijkse ronde maximaal **32 credits**, circa **960 per 30 dagen**. Een ticker die in meerdere fondsen voorkomt, wordt eenmaal opgehaald. Marketstack rekent per opgezocht symbool; 747 verbruikte credits betekenen daarom niet 747 verversingen. Verbruik door eerdere historische imports of andere toepassingen met dezelfde sleutel valt buiten dit dagelijkse aantal.

De fondsgrafiek begint op de vaste meetingbaseline van 16 september 2026 met beide reeksen op 0%. Zij gebruikt alleen werkelijke fondsmeetpunten en bijbehorende S&P 500-prijsindexwaarden in EUR. Er verschijnen geen datums voorbij de laatste vergelijkbare fondsmeting. Ontbreekt het startpunt, dan verschijnt geen verzonnen startwaarde. De meetingdatum is bevestigd. Bij een ontbrekende fondsmeting op de startdatum wordt de laatst bekende eerdere administratiestand als beginreferentie gebruikt, met de oorspronkelijke datum zichtbaar en het fondsverloop als indicatief. Voor de index wordt de echte slotkoers op 16 september gebruikt; ontbrekende indexdata blijven leeg. De basisdatum wordt binnen de ene dagelijkse indexaanvraag meegenomen, zonder extra credits of paginering.
