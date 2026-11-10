# Actuele waardering vanuit deelbewijzen

De actuele administratie gebruikt de deelbewijzen van de huidige lid-ID's uit de
drie financiële bronbestanden. De EUR-totalen in die oude admins zijn berekeningen
voor uitgifte en intrekking van deelbewijzen. Ze zijn geen actuele brokerstanden.

De huidige fondswaarde is aandelen tegen opgeslagen dagkoersen plus werkelijke
ING- en brokersaldi plus overige participaties, verminderd met nog uit te betalen
bedragen waarvoor de deelbewijzen al zijn ingetrokken. Het totaal aantal huidige
deelbewijzen moet aansluiten op de huidige ledenboekingen. Toegang en financieel
belang blijven afzonderlijk: een inactief account kan geen sessie krijgen.

Het optionele blok L:P in Fondsindex heeft marker MF-UNITS-1. L5:L7 bevat de datum
van de deelbewijzen, M5:M7 de nog te betalen EUR, N de bron en O de peildatum.
Overzicht controleert brondeelbewijzen in K en de expliciete tolerantie in L.
De oorspronkelijke bronbedragen blijven beschikbaar als historische referentie.
De migratiedatum en bestaande technische IDs veranderen niet.

Een ontbrekende koers kan via Koersen worden aangevuld met een echte, gedateerde
waarneming. Import controleert ticker, beurs, valuta, datum en prijs. Alleen een
nieuwere waarneming komt in de gedeelde koerscache. Dit vraagt geen Marketstack
data op. AIRBUS gebruikt volgens de Marketstack-catalogus AIR.XPAR, niet AIR.PA.

De actuele fondskaart, ledenkaart, grafiekpunt en read-only controle-API gebruiken
dezelfde berekening. De dagelijkse taak bewaart de punten voor volgende dagen.
De bestaande dagelijkse vergrendeling en het aanvraagbudget blijven intact.

GET /api/portal/valuation-audit is alleen toegankelijk voor ingelogd hoofdbestuur
en geeft de waarden en deelbewijzen van alle leden en fondsen, zonder codes of
rekeningnummers. Deze controle vervangt de afzonderlijke logincontrole niet.


## Kalenderdagen en bronbegrenzing

Dagwaarden tonen elke kalenderdag vanaf 16 september 2026 tot de huidige
Amsterdamse datum, met de vorige echte slotkoers op niet-handelsdagen. Het
waardepeil en de datum van de onderliggende koers blijven afzonderlijk zichtbaar.
Historische tussenstanden worden met gedateerde koersen en administratieve
indexankers gereconstrueerd en zijn expliciet indicatief. Zij zijn geen bewezen
brokerafsluitingen per dag. Elke historische noemer gebruikt de som van de
gecontroleerde individuele deelbewijsboekingen tot die datum; oude index-totalen
worden daarvoor niet overgenomen. Oud uitgeschreven personen blijven vóór hun
intrekking in die som aanwezig. Huidige fondskaart en historisch eindpunt sluiten aan.

Het optionele Q:V-blok in Fondsindex (MF-PRICE-HISTORY-1) bevat echte gedateerde
waarnemingen met bron, ook wanneer de cache al een nieuwere koers heeft. Een
tegenstrijdige waarneming voor dezelfde datum wordt geweigerd. W4 bevat optioneel
MF-CASH-BASIS-1 met de gebruikte boekbasis per fonds in W5:W7.

Een EUR-brokerrapport over alle valuta is één cashcomponent. Afzonderlijke native
USD/CAD-bedragen mogen daar niet naast worden meegeteld. De bronpeildatum blijft
zichtbaar. Bij een nieuwe vreemdevalutatransactie kan een vastgelegde omrekening
via Cashvaluta/Cashbedrag de EUR-boekwaarde wijzigen. Dit blijft een boekraming tot
een nieuwe absolute brokerstand deze vervangt; de koers verandert niet bij replay.
Dagwaarden en downloads gebruiken bestaande gedeelde koersdata en doen geen
extra Marketstack-aanvragen.
