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
- De participaties van fonds 2 en 3 tellen in de gecontroleerde bronversie niet op tot 100%. Ieder lid ziet wel zijn eigen, duidelijk als bronwaarde gemarkeerde Excelbedrag. Een **actuele** persoonlijke waarde verschijnt pas als alle koersen, valuta en participaties van dat fonds aansluiten. Rendement, Sharpe, beta, volatiliteit en maximale daling vragen een gecontroleerde reeks dagelijkse fondswaarden en fondsbewegingen; een huidige portefeuille alleen is daarvoor onvoldoende.
- ING- en brokerstanden worden niet automatisch opgehaald. De pagina toont één cashbedrag op basis van de laatst geïmporteerde Excelversie, omgerekend naar euro met ECB-referentiekoersen. De ING- en brokerpeildata blijven zichtbaar. `Overige waarde` zoals obligaties telt mee in het fondstotaal, maar niet bij cash.
- De persoonlijke codes in de huidige Excel zijn korte woorden. Voor een publieke uitrol met echte ledengegevens zijn langere, unieke codes verstandig.
- De sectorverdeling gebruikt een indicatieve indeling voor de huidige aandelen. Voeg desgewenst een optionele kolom `Sector` toe aan `Posities`; de website neemt die waarde bij de volgende Excelimport over.

## Dagelijkse slotkoersen

De server heeft `MARKETSTACK_API_KEY` nodig als geheime Vercel-variabele. Plaats de sleutel niet in GitHub, Excel of frontendcode. Stel daarnaast `CRON_SECRET` in (minimaal 16 willekeurige tekens). Er zijn twee dagelijkse Vercel-triggers, om 15:15 en 16:15 UTC. De server voert **maximaal één** koersverversing per Amsterdamse kalenderdag uit, vanaf 17:15 plaatselijke tijd. Zo blijft de kloktijd werken bij zomer- en wintertijd. Op Vercel Hobby kan de uitvoering binnen het uur na de ingestelde trigger vallen. Een paginabezoek doet nooit een Marketstack-aanvraag.

De verversing haalt maximaal 180 kalenderdagen aan historie bij de eerste run op en daarna alleen de recente handelsdagen. De aandelenhistorie komt uit Marketstack v2; S&P 500-historie komt voorlopig uit de nog werkende v1-indexroute, omdat v2 EOD de indexcode afwijst. De indexroute moet daarom bij een toekomstige v1-uitfasering opnieuw worden gecontroleerd. De website slaat grafiekpunten en slotkoersen centraal op. De koersen van de lopende Amsterdamse kalenderdag worden bij de verversing om 17:15 niet als definitieve slotkoers overgenomen: Europese markten sluiten later en de Amerikaanse markt is dan nog open.

Marketstack telt elk symbool per HTTP-verzoek als een aanvraag; paginering kan vooral bij de eerste historische import extra credits kosten. De huidige 31 unieke tickers en één index vragen daarna gewoonlijk ongeveer 32 credits per dag, circa 960 per 30 dagen, ruim onder Basic's 10.000 per maand. De getoonde prijs blijft een **slotkoers met beursdatum**, geen realtime prijs. Bij ontbrekende koers, verkeerde valuta of ontbrekende ECB-koers wordt geen gedeeltelijke fondsweging of actuele ledenwaarde berekend. De Excelkolom `Koerscode` bepaalt de Europese Marketstack-code, bijvoorbeeld `ASML.AS`; voor Amerikaanse noteringen wordt de ticker gebruikt. Een paar Amerikaanse symbolen worden door Marketstack onder een andere beurscode teruggegeven dan de Exceladministratie vermeldt; de administratie blijft ongewijzigd en de leveranciercode is gericht gecorrigeerd in de serverkoppeling.
