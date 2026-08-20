# Validación de datos

## Fuentes internas
- `Análisis general`: consolidado departamental e indicadores generales.
- `Municipios completos`: detalle territorial para 432 municipios con DIVIPOLA.
- `Noticias`: fallecidos, heridos y enlaces/noticias por municipio.
- `mapa_municipios.json`: TopoJSON municipal usado por la Vista 2.

## Regla de presentación
El visor no fuerza la reconciliación entre cifras de bloques distintos del Excel.

- Puntos del consolidado general: **3.366**.
- Suma del campo `Puntos` en los 432 municipios: **3.478**.
- Heridos del consolidado general: **4.400**.
- Fallecidos del consolidado general: **304**.

Para el mapa se usa el valor municipal, porque cada color debe corresponder al registro asociado al DIVIPOLA del polígono. En el panel general, cuando no hay filtros, se identifican explícitamente los indicadores procedentes del consolidado general.
