# Ledenomgeving: inrichting en dagelijks gebruik

## Lokale proefversie

De proefversie kan met `MF_LOCAL_PREVIEW=1` en `MF_AUTH_PEPPER` zonder externe database draaien op `127.0.0.1`. De eerste drie beheerders worden met `MF_TARGET_ENV=development` voorbereid via `scripts/seed-portal-admins.mjs`. Daarna logt een beheerder in en importeert het volledige bestand via de website. De lokale opslag staat versleuteld in `.private/portal`; `.private` en `.env.local` zijn uitgesloten van Git. Deze proefstand werkt alleen op de computer waar de server draait en is niet de live website.

## Eenmalige inrichting in Vercel

1. Voeg via **Vercel → project Website-MF → Storage / Marketplace** een Upstash Redis-database in een EU-regio aan het project toe. Controleer dat `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN` als omgevingsvariabelen beschikbaar zijn voor **Production** en eventueel **Preview**. Beide omgevingen gebruiken gescheiden sleutelnamen in de database.
2. Voeg één willekeurig geheim toe als omgevingsvariabele: `MF_AUTH_PEPPER` (minimaal 32 tekens). Gebruik een wachtwoordmanager en deel dit geheim niet via GitHub, Excel of e-mail. De lokale opstartstap gebruikt precies dezelfde waarde.
3. Start een nieuwe deployment zodat de variabelen actief worden.
4. Voer **eenmalig lokaal** `scripts/seed-portal-admins.mjs` uit met het MASTER-bestand. Controleer eerst met `--check`; gebruik daarna `--publish` met `MF_TARGET_ENV=preview` of `production` en dezelfde Upstash-variabelen. Het script bereidt uitsluitend de drie actieve hoofdbestuurders voor en weigert opnieuw te draaien als er al een portalversie bestaat. Er is geen openbare eerste Excelupload.
5. Een van de drie hoofdbestuurders logt in via `/inloggen`, opent vanuit het eigen fondsoverzicht `/beheer/import` en importeert daar het **volledige** MASTER-bestand. Controleer de aantallen en waarschuwingen vóór publicatie. Daarna moeten de drie beheerders opnieuw inloggen met hun eigen code.

## Bij een wijziging in Excel

1. Sla de nieuwe versie van het MASTER-bestand in OneDrive op en wacht tot OneDrive aangeeft dat het synchroniseren klaar is.
2. Log in met je eigen fonds en code. Alleen een account met de rol `Hoofdbestuurder` kan vanuit het fondsoverzicht `/beheer/import` openen.
3. Kies het bestand opnieuw en controleer de voorvertoning vóór publicatie.
4. Na publicatie moeten leden opnieuw inloggen. De vorige versie blijft 30 dagen in de afgeschermde opslag bewaard.

De website kijkt **niet rechtstreeks in OneDrive**. Bewerkingen in Excel verschijnen dus pas na een nieuwe import. Codes blijven in het Excelbestand; de website slaat voor het inloggen alleen een eenrichtingsafdruk van de code op. Bewaar het Excelbestand alleen voor het bestuur toegankelijk.

## Huidige inhoud en beperkingen

- De bestaande werkmap heeft geen kolom `Status`. Daardoor worden alle 80 ingelezen accounts als actief beschouwd. Voeg bij voorkeur `Status` toe en zet oud-leden op `inactief` vóór de eerste publicatie.
- De participaties van fonds 2 en 3 tellen niet op tot 100%. Daarom toont de ledenpagina geen persoonlijke eurobedragen of rendement.
- ING-, broker- en koerswaarden worden nog niet automatisch opgehaald. De pagina toont cash uit de laatst geïmporteerde Excelversie, met peildatum. Aandelen verschijnen zonder live koers of weging.
- De persoonlijke codes in de huidige Excel zijn korte woorden. Voor een publieke uitrol met echte ledengegevens zijn langere, unieke codes verstandig.
- Wanneer de koersleverancier en de berekening van participaties zijn gecontroleerd, kunnen fondswaarde, persoonlijke positie en grafiek worden geactiveerd.
