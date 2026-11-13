# Plan de conformidad ENS

| Dimensión | Nivel |
|---|---|
| Confidencialidad | medio |
| Integridad | medio |
| Disponibilidad | alto |
| Autenticidad | medio |
| Trazabilidad | medio |

**Categoría del sistema: ALTA**

- Conformidad: Certificación de conformidad emitida por una entidad de certificación acreditada.
- Auditoría: Auditoría ordinaria al menos cada dos años y tras modificaciones sustanciales.
- Designe los roles de seguridad (responsables de la información, del servicio, del sistema y de seguridad) y apruebe una política de seguridad.
- Realice un análisis de riesgos y publique una declaración de aplicabilidad con las medidas seleccionadas.
- Los sistemas de categoría alta tienen las medidas más exigentes y la supervisión más cercana del CCN.

## Orden de trabajo por familia

| # | Familia | Madurez | Esfuerzo | Puntuación |
|---|---|---|---|---|
| 1 | op.exp Explotación (inventario, configuración, parches, incidentes, registros, claves) | ninguna | L | 1 |
| 2 | op.cont Continuidad del servicio | ninguna | L | 0.9 |
| 3 | op.ext Servicios externos | ninguna | M | 0.8 |
| 4 | op.mon Monitorización del sistema | ninguna | M | 0.8 |
| 5 | mp.eq Protección de los equipos | desconocida | M | 0.6 |
| 6 | mp.s Protección de los servicios | desconocida | M | 0.6 |
| 7 | op.nub Servicios en la nube | desconocida | M | 0.6 |
| 8 | mp.info Protección de la información (cifrado, copias, datos personales) | parcial | M | 0.5 |
| 9 | op.acc Control de acceso | parcial | M | 0.5 |
| 10 | op.pl Planificación (análisis de riesgos, arquitectura, adquisición) | parcial | M | 0.5 |
| 11 | org Marco organizativo | parcial | S | 0.5 |
| 12 | mp.com Protección de las comunicaciones | parcial | M | 0.4 |
| 13 | mp.per Gestión del personal y formación | parcial | S | 0.4 |
| 14 | mp.si Protección de los soportes de información | desconocida | S | 0.4 |
| 15 | mp.if Instalaciones e infraestructuras | sólida | M | 0 |
| 16 | mp.sw Protección de las aplicaciones informáticas | sólida | M | 0 |

> Pesos y esfuerzo son valores de criterio. Los números de control dentro de cada familia cambian entre ediciones: consulte las guías CCN-STIC.

