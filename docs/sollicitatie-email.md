# Sollicitatieformulier: e-mailverzending

De route `/api/apply` stuurt de ingevulde gegevens, CV en motivatiebrief via Resend naar `secretaris@mutualfund.nl`. Zonder beide onderstaande Vercel-variabelen geeft de route een 503 en toont het formulier de handmatige e-mailoptie.

1. Verifieer `mutualfund.nl` (of een gekozen verzendsubdomein) in Resend. Gebruik een afzenderadres op precies dat geverifieerde domein. Zie [Resend: afzenderdomein](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend).
2. Maak in Resend een API-sleutel met alleen verzendrechten. Bewaar die sleutel uitsluitend als geheime environment variable in het Vercel-project `website-mf`, onder `RESEND_API_KEY`. Zet een afzender zoals `Mutual Fund <sollicitaties@mutualfund.nl>` in `RESEND_FROM`. Zet deze variabelen minimaal voor Production.
3. Herdeploy `main` nadat de variabelen zijn opgeslagen. Commit nooit de sleutel in GitHub.
4. Verstuur één proefsollicitatie met twee wegwerp-PDF's van samen minder dan 3,5 MB. Controleer de ontvangst van beide bijlagen in de secretariaatsmailbox en controleer de Resend-verzendstatus. Gebruik geen echte sollicitantgegevens voor deze test.

Resend accepteert Base64-bijlagen; de route controleert dat beide bestanden echte PDF's zijn. De limiet van 3,5 MB samen houdt het multipart-verzoek onder de [Vercel Edge-limiet van 4 MB](https://vercel.com/docs/functions/runtimes/edge/edge-functions).
