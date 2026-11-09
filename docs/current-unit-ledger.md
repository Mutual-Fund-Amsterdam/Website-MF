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
