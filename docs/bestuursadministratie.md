# Gedeelde bestuursadministratie

De nieuwe route `/beheer/administratie` bevat Invoer, Leden en Aandelen in Platinum. Alleen actieve hoofdbestuurders met een bestaande individuele login én afgeronde tweestapsverificatie kunnen openen, lezen, boeken, importeren, downloaden of publiceren. Zij zien alle drie de fondsen. De knop Administratie verschijnt onder Bestuur op Mijn fonds zodra de feature is ingeschakeld.

Dit is een afzonderlijke uitbreiding. De overige pagina's en berekeningen zijn inhoudelijk niet gewijzigd. De bestaande Mijn fonds-pagina krijgt uitsluitend de voorwaardelijke navigatielink. Styles en nieuwe beveiligingsheaders zijn beperkt tot de bestuursroute. Openen, rondkijken en een import voorvertonen wijzigen geen fondsgegevens. Bestaande Excel-bestanden worden uitsluitend gelezen.

## Invoer en publicatie

1. De browser haalt de gedeelde werkstand op. Elke 10 seconden en bij terugkeren naar het venster verschijnt een bijgewerkte stand; ingevulde velden blijven staan.
2. Controleer een boeking en kies Boeken. De server controleert rol, MFA, herkomst van het verzoek, waarden en de verwachte revisie. Een oud verzoek krijgt een conflict; dezelfde aanvraagcode voert een boeking hoogstens één keer uit.
3. De werkstand is alleen zichtbaar voor het hoofdbestuur. Publicatie controleren toont de boekingen en drie fondsen. Publiceren controleert opnieuw de eigenaar van de controle, de werkstand en de vorige publicatie en wisselt de gepubliceerde snapshot atomair.
4. Vanaf de eerste publicatie vanuit deze administratie zijn oude Excel-publicaties en automatische OneDrive-invoer/terugschrijving uitgeschakeld. Dit voorkomt twee concurrerende bronnen. Een nieuwe bron gaat via Invoer → Bronbestand inlezen. De oorspronkelijke bestanden blijven intact.
5. Is de oude publicatie intussen buiten de werkstand gewijzigd, dan blokkeert verder boeken. Invoer → Gepubliceerde stand opnieuw inlezen toont de actuele publicatie ter controle. De gebruiker bevestigt expliciet het vervangen van nog niet gepubliceerde boekingen; oude versleutelde versies blijven bewaard.

De nieuwe administratie gebruikt de bestaande aandelen- en deelbewijzenlogica. Cash wordt per fonds, bank en valuta over de onveranderlijke beginstand herhaald. Een nieuwe transactie op de datum van de beginstand telt mee. Bij een absolute cashstand telt de volgorde van boekingen op dezelfde datum: een later geboekte transactie verandert die stand. Oudere boekingen dan een bestaande cashpeildatum worden geweigerd. Historische registratie legt een al verwerkte transactie vast zonder posities of cash opnieuw te veranderen. Boekingsprijzen en vreemdevaluta-afrekening worden expliciet ingevoerd.

Lidmaatschap beëindigen deactiveert toegang. Volledig belang uitbetalen boekt alle resterende deelbewijzen uit en deactiveert het lid. Inleg en opname zijn financiële ledenboekingen. De toepassing voert geen bankbetalingen of brokerorders uit.

## Ledenbestand en export

`Ledenbestand MF.xlsx` kan afzonderlijk via Invoer worden ingelezen. Alleen bestaande lid-ID's worden aangesloten; namen en expliciet afgeronde uitschrijvingen worden voorbereid. Rollen, codes, cash en deelbewijzen worden hierbij behouden. Afgeronde inschrijvingen zonder financiële aansluiting blijven archiefvermeldingen; zij krijgen geen verzonnen positie of account. `Ledenhistorie MF.json` voegt de oudere perioden toe. Jaarfilters gebruiken waargenomen perioden en boekingsjaren, geen verondersteld ononderbroken lidmaatschap. Archief is afzonderlijk herkenbaar.

Excel downloaden maakt een echte XLSX met leden, posities, cash, catalogus, historie en invoer. Het bestand bevat geen leesbare lidcodes, loginhashes, MFA-sleutels of herstelcodes. Een willekeurige uitvoerverwijzing koppelt het bestand aan een versleutelde kopie op de server. Herimport werkt in dezelfde bestuursomgeving, behoudt actuele lidcodes en weigert buiten de app aangepaste uitvoer. Bewerkingen lopen via Invoer. De uitvoer is bedoeld voor de nieuwe bestuursimport, niet voor de oude algemene Excel-import.

Een nieuwe lidcode wordt willekeurig op de server gemaakt, alleen als HMAC in de werkstand opgeslagen en eenmaal getoond. Na publicatie wordt zij geldig. Gaat de eerste respons verloren, dan wordt de boeking niet herhaald; geef via Invoer een nieuwe code uit. Hoofdbestuurscodes kunnen niet via de gewone lidcodeactie worden vervangen.

## Beveiliging en opslag

- `MF_ADMIN_ENABLED=1` schakelt de uitbreiding in; standaard staat zij uit.
- `MF_ADMIN_ENCRYPTION_KEY` is een aparte willekeurige sleutel van 32 bytes, gecodeerd als 64 hextekens. Maak per omgeving een eigen sleutel in de beveiligde omgevingconfiguratie; gebruik nooit de fictieve testwaarden. Bewaar een herstelkopie bij de vereniging, apart van de database.
- `MF_AUTH_PEPPER` blijft de bestaande toegangssleutel. Veranderen maakt bestaande codes en lokale opslag onbruikbaar.
- Werkstanden, tijdelijke imports, bewaarde exports en MFA-factoren worden met AES-256-GCM en contextbinding versleuteld. Grote bestanden worden in begrensde onderdelen opgeslagen; een atomaire revisievergelijking wijst pas na volledige opslag naar de nieuwe versie.
- De bestaande gepubliceerde snapshot, ledensessies en archieven vallen nog onder de bestaande portalopslag. Applicatieversleuteling van werkstanden vervangt dus niet de controle van databaseversleuteling, leveranciersrechten en back-ups.
- TOTP volgt RFC 6238 (zes cijfers, 30 seconden, één stap speling), weigert hergebruik en heeft account- en IP-limieten. Acht herstelcodes worden eenmaal getoond en uitsluitend gehasht bewaard. Een tweede-factor-sessie verloopt na vier uur en is gebonden aan het lid, de actuele loginhash, de gewone sessie en de ingestelde factor. De gewone fondspagina's krijgen geen nieuwe MFA-stap.
- Administratieresponses hebben no-store, geen referrer en geen indexering. De nieuwe pagina blokkeert framing en externe netwerkbestemmingen. De bestaande root-layout bevat Vercel Analytics: beoordeel dit en andere platformlogs bij leverancierscontrole; er is geen nieuwe analyse-instrumentatie toegevoegd en er worden geen codes in URL's gezet.
- Nieuwe serverroutes vragen Frankfurt (`fra1`) als uitvoerregio. Dit bewijst niet waar login, database, replica's, back-ups, logs of leverancierssupport gegevens verwerken.
- Bewaartermijn voor versiearchieven en exportreferenties is nog een verenigingsbesluit. De implementatie verwijdert ze niet automatisch; neem verwijdering en bewaartermijnen op in het productiebeheer.

Een alleen lokale proefstand gebruikt een versleutelde bestandsopslag. Die is bedoeld voor één serverproces op loopback. De gedeelde productieomgeving gebruikt Upstash en atomaire Redis-scriptcontroles; zet MF_LOCAL_PREVIEW nooit aan in hosting.

## Back-up en herstel

Versleutelde back-up downloaden levert een zelfstandig `.mfbackup` met de administratie. Het bestand kan via Invoer worden gecontroleerd en teruggezet met dezelfde encryptiesleutel, waarna expliciete publicatie nodig is. De applicatie weigert accounts of reeds verwerkte invoer te verwijderen en behoudt bestaande actuele lidcodes. Deze export is geen volledige platformback-up: MFA-factoren, gewone sessies en afgeleide koershistorie zitten er niet in.

Maak daarnaast een complete databaseback-up en bewaar beide configuratiesleutels apart. Test volledig herstel in een geïsoleerde omgeving met fictieve accounts, inclusief MFA en intrekken van sessies. Het terugzetten van een administratieve back-up met behoud van toegang is lokaal getest; volledig herstel van de echte Upstash-database is nog niet uitgevoerd.

## Productievoorwaarden

Nog vóór inschakeling met echte gegevens:

- Bevestig in de accountinstellingen de regio's van Vercel-functies (ook de bestaande login), Upstash primaire database, replica's, back-ups en logs. Controleer abonnement/versleuteling, toegangsrechten en toepasselijke verwerkersafspraken.
- Bevestig doel, bewaartermijnen en bestuursrollen namens de vereniging. Drie hoofdbestuurders gebruiken individuele accounts; geen gedeelde login.
- Maak en test een volledige databaseback-up in een afzonderlijke omgeving. Controleer twee bestuursaccounts en een gewoon lid op de werkelijke hosting.
- Vergelijk de gepubliceerde beginstand met de originele Excel-bestanden. De lokale broncontrole op 17 november sluit aan op 90 financiële accounts, 79 actief, 573 samengevoegde registervermeldingen na afzonderlijk ledenbestand en archief, 36 posities en 218 trades. Nieuwere orders zijn niet aangeleverd. Er is nog geen productiesnapshot hiermee vergeleken of veranderd.
- Zet pas daarna de sleutel en featureflag voor productie. Alleen inschakelen verandert geen financiële stand. De eerste gecontroleerde publicatie activeert de nieuwe bronkeuze.

Bij uitzetten verdwijnt de knop en weigeren alle nieuwe API-routes toegang. Dit maakt een eerdere publicatie niet ongedaan. Na de eerste bestuurspublicatie blijven oude automatische imports geblokkeerd: hervat eerst gecontroleerd de nieuwe administratie of herstel onder beheer een gecontroleerde snapshot. Wijzig nooit blind het `administration`-kenmerk.

Bronnen: [Next.js regio-instelling](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config), [Upstash beveiliging](https://upstash.com/docs/redis/features/security), [Upstash compliance](https://upstash.com/docs/common/help/compliance), [Upstash back-up en herstel](https://upstash.com/docs/redis/features/backup). Dit zijn productdocumenten, geen bewijs van de instellingen van dit account.

## Lokale controle

Met Node 24 en bestaande dependencies:

```sh
node --import ./scripts/register-types.mjs scripts/verify-administration.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build --webpack
node --import ./scripts/register-types.mjs scripts/preview-administration.mjs
# In een tweede terminal, eenmalig op de verse fictieve proefstand:
node --import ./scripts/register-types.mjs scripts/verify-administration-http.mjs
```

De proefsite is `http://127.0.0.1:49732`. De fixtures zijn nadrukkelijk fictief. De HTTP-test richt MFA in op beide fictieve bestuursaccounts, schrijft alleen naar de lokale testopslag en controleert alle nieuwe routes. Gebruik voor herhaling een nieuwe geïsoleerde checkout; verwijder geen bestaande persoonlijke administratie.

Aanvullende regressies: split-workbook, unit-ledger, current-fund-history, onedrive, onedrive-writeback en xlsx-results. Het bestaande script verify-input-workbook faalt op zijn laatste historische grafiekbaseline-assertie (2022 versus 2026); script en beide betrokken productiemodules zijn identiek aan de hoofdbranch. Dat bestaande grafiekgedrag valt buiten deze wijziging.
