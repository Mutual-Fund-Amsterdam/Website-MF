# Historische reconstructie: inrichting en controle

## Wat de import doet

De bestaande master blijft de invoerbron. `Bankmutaties` bevat bronmutaties plus afzonderlijke begin- en eindstanden. `Brokertransacties` bevat iedere afzonderlijke uitvoering, kosten, dividenden en de brokervertrekstand. `Overzicht` bevat de broncontroles. Bronbedragen worden niet automatisch over de bestaande financiële invoer geschreven.

Upload blijft uitsluitend beschikbaar voor een ingelogde hoofdbestuurder. De server slaat bronregels in blokken van 100 op in de bestaande private opslag. Git bevat geen werkmappen, bankafschriften, persoonlijke codes of daadwerkelijke bronregels. Een herhaalde volledige import vervangt de versie; hij voegt geen mutaties toe. Dubbele bron-ID's binnen een werkmap worden geweigerd. Twee identieke uitvoeringen op verschillende oorspronkelijke bronregels blijven afzonderlijk bestaan.

Na import is `/beheer/reconstructie` alleen voor het hoofdbestuur zichtbaar. Daar staan bankcontroles, verschillen, ontbrekende gegevens en een afgeschermde CSV-download van de berekende dagen.

## Beoordelen in Excel

- Bewaar bronhash, bronregel en Bron-ID. Ze identificeren de oorspronkelijke import.
- `Beoordeling = Goedgekeurd` bevestigt een beoordeelde koppeling of bedrijfsactie.
- `Tegenboeking-ID` koppelt een banktransfer aan precies één brokerregel. Voor een ledenbetaling wordt bij herhaalde bedragen de ledenmutatiekoppeling uit de bestuurderspagina gebruikt. Behoud de oorspronkelijke administratiedatum.
- Splitsingen gebruiken `Verwerking = Split` en een positieve `Factor`. `Hernoeming` gebruikt `Nieuwe ticker`. Een aantalscorrectie vraagt expliciete goedkeuring. Een vervallen of tegengeboekte regel wordt alleen met een beoordeelde `Negeren` uitgesloten.
- Brokercash vraagt `Cashvaluta`, de werkelijke netto `Cashmutatie` en bij transacties de `Afwikkeldatum`. EUR-rapportagebedragen uit een andere valuta worden nooit als native cash overgenomen. De juiste cashconventie en eventuele openstaande transacties op de vertrekdatum moeten eerst worden bevestigd.
- `Beurs` wordt voor inmiddels verkochte instrumenten pas na controle gekoppeld. Zo gebruiken we geen koers van een andere beurs of valuta.

Onbekende Saxo-transacties, fondsoverschrijvingen, native cash, onopgeloste bedrijfsacties, ontbrekende koersen of ontbrekende ledenafstemming blokkeren het label gecontroleerd. Transfers naar Saxo worden niet als beleggingsverlies geboekt. De masterposities blijven beschikbaar als huidige ingevoerde stand.

## Dagwaarden en grafieken

De rekenkern draait aantallen vanuit het anker achteruit en vooruit. Gewone slotkoersen waarderen de aandelen; dividend komt uitsluitend in cash. Een latere bankontvangst tegenover een reeds geboekte deelname geeft tijdelijk een vordering. Een eerdere betaling geeft tijdelijk een schuld. Interne overboekingen kunnen geld onderweg opleveren. Afwikkeling gebruikt een afzonderlijke vordering of verplichting.

Per dag worden onderdelen, fondswaarde, deelbewijzen, deelbewijsprijs en dekkingsredenen bewaard. Onvolledige uitkomsten komen alleen in de bestuurderscontrole. Gecontroleerde dagen voeden fonds- en ledenhistorie. Oudere administratiestanden blijven apart beschikbaar in de fondsgrafiek. Een wijziging in huidige aantallen herschrijft niet vanzelf de gecontroleerde historische transacties.

Dagelijkse risicocijfers vragen minimaal 200 rendementen en een volledige gemeenschappelijke handelsdagreeks binnen twaalf maanden. Beta gebruikt de S&P 500-prijsindex omgerekend naar EUR. Volatiliteit en Sharpe annualiseren met 252; historische €STR wordt per kalenderdag met ACT/360 samengesteld. Onvoldoende dekking geeft geen verzonnen risicocijfer.

## Koerstaak en kostenbeheersing

Vanaf 23 oktober 2026 is de ingestelde taak eenmaal per dag om 05:15 UTC (06:15 Nederlandse wintertijd, 07:15 zomertijd). Alleen deze taak haalt koersen op. Inloggen en paginaweergaven lezen de cache. De atomaire dagvergrendeling blijft bij fouten behouden om herhaald betaald ophalen te voorkomen.

Historische downloads en paginering zijn uitgeschakeld. Dagelijks maximaal één credit per uniek aandeel plus één indexcredit; bestaande historie blijft behouden. Eenmalige historische uitbreiding vereist apart afgebakend werk en is geen onderdeel van deze dagelijkse taak. De reeds aanwezige maandteller is een extra bovengrens; gebruik buiten deze toepassing wordt niet vanzelf meegeteld.

De fondsgrafiek gebruikt de meetingbaseline van 16 september 2026 en stopt bij de laatste vergelijkbare fondswaarneming. Zij extrapoleert geen fondsrendement naar latere beursdatums.
## Testen en uitrol

`scripts/verify-reconstruction.mjs` bevat uitsluitend fictieve rekenvoorbeelden. `scripts/verify-fund-performance.mjs` controleert rendement, EUR-benchmark, risicocijfers en ontbrekende dagen. De lokale integratiecontrole met de private master staat in `scripts/verify-reconstruction-import.mjs`; deze vereist expliciet de lokale proefomgeving en importeert niet in productie.

Eerst het verschillenoverzicht beoordelen. Daarna pas native cash, bedrijfsacties, historische beurskoppelingen en ontbrekende transacties aanvullen en nieuwe gecontroleerde dagwaarden vrijgeven. De huidige wijziging is lokaal voorbereid; deployment en productie-import zijn afzonderlijke stappen.
