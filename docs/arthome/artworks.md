# Artwork list

The 42 works in **My Photos** on the TV's Art Mode, as of 2026-10-25. They come from a USB
stick (`content_type: usb`) and are shown without a mat. The TV knows each one only by its ID
(`MY_F0001`…); it has no title or author. ArtHome's gallery label comes from this list,
built into `launcher/js/obras.js`.

34 were identified by eye and 8 with Google's image search (Google Lens). The label on the
TV shows the Spanish title.

| ID | Title | Title on the TV (Spanish) | Artist | Year | Identified |
|---|---|---|---|---|---|
| MY_F0001 | The Shipwreck | El naufragio | Claude-Joseph Vernet | 1772 | by eye |
| MY_F0002 | The Ponte Salario | El Ponte Salario | Hubert Robert | c. 1775 | by eye |
| MY_F0003 | The Marquise de Pezay and the Marquise de Rougé with Her Sons | La marquesa de Pezay y la marquesa de Rougé con sus hijos | Élisabeth Vigée Le Brun | 1787 | by eye |
| MY_F0004 | The Longshoremen's Noon | El mediodía de los estibadores | John George Brown | 1879 | by eye |
| MY_F0005 | The Juniata, Evening | El Juniata al atardecer | Thomas Moran | 1864 | Google Lens |
| MY_F0006 | The Artist Sketching at Mount Desert, Maine | El artista dibujando en Mount Desert, Maine | Sanford Robinson Gifford | 1864-1865 | Google Lens |
| MY_F0007 | Italian Coast Scene with Ruined Tower | Costa italiana con torre en ruinas | Thomas Cole | 1838 | by eye |
| MY_F0008 | Hunting in the Pontine Marshes | Caza en las marismas pontinas | Horace Vernet | 1833 | Google Lens |
| MY_F0009 | Forest of Fontainebleau | Bosque de Fontainebleau | Camille Corot | 1834 | by eye |
| MY_F0010 | Setting Out to Fish | Saliendo a pescar | John Singer Sargent | 1878 | by eye |
| MY_F0011 | View of Paris with the Île de la Cité | Vista de París con la Île de la Cité | Nicolas-Jean-Baptiste Raguenet | 1763 | by eye |
| MY_F0012 | Nighthawks | Nighthawks | Edward Hopper | 1942 | by eye |
| MY_F0013 | The Garden of Eden | El jardín del Edén | Thomas Cole | 1828 | by eye |
| MY_F0014 | The Last Day of Pompeii | El último día de Pompeya | Karl Bryullov | 1833 | by eye |
| MY_F0015 | The Birth of Venus | El nacimiento de Venus | Sandro Botticelli | c. 1485 | by eye |
| MY_F0016 | Ophelia | Ofelia | John Everett Millais | 1852 | by eye |
| MY_F0017 | Girl with a Pearl Earring | La joven de la perla | Johannes Vermeer | c. 1665 | by eye |
| MY_F0018 | The Bucentaur's Return to the Molo on Ascension Day | El regreso del Bucentauro al Molo el día de la Ascensión | Canaletto | c. 1730 | by eye |
| MY_F0019 | Netherlandish Proverbs | Los proverbios flamencos | Pieter Bruegel the Elder | 1559 | by eye |
| MY_F0020 | The Fall of the Rebel Angels | La caída de los ángeles rebeldes | Pieter Bruegel the Elder | 1562 | by eye |
| MY_F0021 | The Tower of Babel | La torre de Babel | Pieter Bruegel the Elder | 1563 | by eye |
| MY_F0022 | Hunting Party in the Pontine Marshes | Salida de caza en las marismas pontinas | Horace Vernet | 1833 | Google Lens |
| MY_F0023 | A Hare in the Forest | Una liebre en el bosque | Hans Hoffmann | c. 1585 | by eye |
| MY_F0024 | Alpine Mastiffs Reanimating a Distressed Traveller | Mastines alpinos reanimando a un viajero | Edwin Landseer | 1820 | by eye |
| MY_F0025 | The School of Athens | La escuela de Atenas | Raphael | 1511 | by eye |
| MY_F0026 | The Garden of Earthly Delights | El jardín de las delicias | Hieronymus Bosch | c. 1500 | by eye |
| MY_F0027 | The Well-Stocked Kitchen | La cocina bien surtida | Joachim Beuckelaer | 1566 | by eye |
| MY_F0028 | Minnehaha Falls | Las cataratas de Minnehaha | Albert Bierstadt | 19th c. | Google Lens |
| MY_F0029 | Las Meninas | Las meninas | Diego Velázquez | 1656 | by eye |
| MY_F0030 | The Swing | El columpio | Jean-Honoré Fragonard | 1767 | by eye |
| MY_F0031 | Liberty Leading the People | La Libertad guiando al pueblo | Eugène Delacroix | 1830 | by eye |
| MY_F0032 | The Third of May 1808 | El tres de mayo de 1808 | Francisco de Goya | 1814 | by eye |
| MY_F0033 | Argenteuil | Argenteuil | Claude Monet | 1872 | by eye |
| MY_F0034 | The Great Wave off Kanagawa | La gran ola de Kanagawa | Katsushika Hokusai | c. 1831 | by eye |
| MY_F0035 | Cattleya Orchid and Three Hummingbirds | Orquídea Cattleya y tres colibríes | Martin Johnson Heade | 1871 | by eye |
| MY_F0036 | Castel Gandolfo, Lake Albano | Castel Gandolfo, lago Albano | Christopher Pearse Cranch | 1852 | Google Lens |
| MY_F0037 | A Sunday Afternoon on the Island of La Grande Jatte | Tarde de domingo en la isla de la Grande Jatte | Georges Seurat | 1886 | by eye |
| MY_F0038 | The Abduction of Europa | El rapto de Europa | Rembrandt | 1632 | by eye |
| MY_F0039 | The Starry Night | La noche estrellada | Vincent van Gogh | 1889 | by eye |
| MY_F0040 | View of Olinda, Brazil | Vista de Olinda, Brasil | Frans Post | 1662 | by eye |
| MY_F0041 | The Grand Canal from Palazzo Flangini to Campo San Marcuola | El Gran Canal desde el Palazzo Flangini hasta el Campo San Marcuola | Canaletto | c. 1738 | Google Lens |
| MY_F0042 | Wooded Landscape with Travellers on a Path through a Hamlet | Paisaje boscoso con viajeros en un camino por una aldea | Meindert Hobbema | c. 1665 | Google Lens |

## Editing the list

The list is JSON, keyed by ID:

```json
{ "obras": { "MY_F0039": { "titulo": "La noche estrellada", "autor": "Vincent van Gogh", "anio": "1889" } } }
```

- **Without reinstalling:** push it to the TV as
  `/home/owner/share/tmp/sdk_tools/arthome-obras.json` over the developer connection (see
  [connect.md](connect.md#7-pushing-data-without-reinstalling)). The service copies it to its
  data folder, and ArtHome merges it over the built-in list the next time it comes to the
  front.
- **Built in:** regenerate `launcher/js/obras.js` and reinstall.

New works added to the TV get the next free ID (`MY_F0043`…). They show without a label until
they're added to the list.
