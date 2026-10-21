# Ledenomgeving: inrichting en dagelijks gebruik

## Eenmalige inrichting in Vercel

1. Voeg via **Vercel → project Website-MF → Storage / Marketplace** een Upstash Redis-database in een EU-regio aan het project toe. Controleer dat `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN` als omgevingsvariabelen beschikbaar zijn voor **Production** en eventueel **Preview**. Beide omgevingen gebruiken gescheiden sleutelnamen in de database.
2. Voeg twee eigen, willekeurige geheimen toe aan de omgevingsvariabelen: `MF_AUTH_PEPPER` (minimaal 32 tekens) en `MF_IMPORT_SECRET` (minimaal 24 tekens). Gebruik voor elk een andere reeks uit een wachtwoordmanager. Zet ze voor Production en eventueel Preview. Deel ze niet via GitHub, Excel of e-mail.
3. Start een nieuwe deployment zodat de variabelen actief worden.
4. Open `/beheer/import` en kies het bestand **Website invoer - MASTER.xlsx** uit `OneDrive/Mutual Fund/Website invoer`. Vul de beheersleutel in. Bekijk de aantallen per fonds en waarschuwingen. Publiceer alleen na controle.
5. Test met één eigen lidcode via `/inloggen`. Daarna kunnen leden hun fondsgegevens zien.

## Bij een wijziging in Excel

1. Sla de nieuwe versie van het MASTER-bestand in OneDrive op en wacht tot OneDrive aangeeft dat het synchroniseren klaar is.
2. Log in als hoofdbestuurder en open `/beheer/import`.
3. Kies het bestand opnieuw en controleer de voorvertoning vóór publicatie.
4. Na publicatie moeten leden opnieuw inloggen. De vorige versie blijft 30 dagen in de afgeschermde opslag bewaard.

De website kijkt **niet rechtstreeks in OneDrive**. Bewerkingen in Excel verschijnen dus pas na een nieuwe import. Codes blijven in het Excelbestand; de website slaat voor het inloggen alleen een eenrichtingsafdruk van de code op. Bewaar het Excelbestand alleen voor het bestuur toegankelijk.

## Huidige inhoud en beperkingen

- De bestaande werkmap heeft geen kolom `Status`. Daardoor worden alle 80 ingelezen accounts als actief beschouwd. Voeg bij voorkeur `Status` toe en zet oud-leden op `inactief` vóór de eerste publicatie.
- De participaties van fonds 2 en 3 tellen niet op tot 100%. Daarom toont de ledenpagina geen persoonlijke eurobedragen of rendement.
- ING-, broker- en koerswaarden worden nog niet automatisch opgehaald. De pagina toont cash uit de laatst geïmporteerde Excelversie, met peildatum. Aandelen verschijnen zonder live koers of weging.
- De persoonlijke codes in de huidige Excel zijn korte woorden. Houd de beheersleutel strikt apart. Voor een publieke uitrol met echte ledengegevens zijn langere, unieke codes verstandig.
- Wanneer de koersleverancier en de berekening van participaties zijn gecontroleerd, kunnen fondswaarde, persoonlijke positie en grafiek worden geactiveerd.
