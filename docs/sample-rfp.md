# RFP security requirements

- Requirements found: 15 (13 mandatory)
- Covered: 9, partial: 6, gaps: 0
- Mandatory coverage: 69% (4 not fully covered)

## Biggest gap topics

| Topic | Mandatory | Total |
|---|---|---|
| Business continuity and disaster recovery | 1 | 1 |
| ENS conformity | 1 | 1 |
| NIS2 alignment | 1 | 1 |
| Supply chain and subcontracting | 1 | 1 |
| Logging and monitoring | 0 | 1 |
| Security testing and audit | 0 | 1 |

## Requirement matrix

| # | Requirement | Type | Status | NIS2 | ISO 27001:2022 | ENS |
|---|---|---|---|---|---|---|
| 1 | El adjudicatario deberá estar en posesión de la certificación ISO/IEC 27001 en vigor para el alcance del servicio. | mandatory | covered | 21(2)(a) | Cl. 4-10 | - |
| 2 | El adjudicatario deberá acreditar la conformidad con el Esquema Nacional de Seguridad en categoría media para los sistemas que den soporte al servicio. | mandatory | partial | 21(2)(a) | - | all |
| 3 | Todos los accesos de administración deberán protegerse con autenticación multifactor. | mandatory | covered | 21(2)(j) | A.8.5 | op.acc |
| 4 | Se aplicará el principio de mínimo privilegio y el control de acceso basado en roles a todos los usuarios del servicio. | mandatory | covered | 21(2)(i) | A.5.15, A.5.18, A.8.2 | op.acc |
| 5 | La información de la entidad deberá cifrarse en tránsito mediante TLS 1.2 o superior y en reposo con AES-256. | mandatory | covered | 21(2)(h) | A.8.24 | mp.info, mp.com, op.exp |
| 6 | El adjudicatario realizará copias de seguridad diarias y deberá probar la restauración al menos una vez al trimestre. | mandatory | covered | 21(2)(c) | A.8.13 | mp.info |
| 7 | El adjudicatario dispondrá de un plan de continuidad de negocio y recuperación ante desastres con un RTO máximo de 4 horas. | mandatory | partial | 21(2)(c) | A.5.29, A.5.30 | op.cont |
| 8 | Se valorará disponer de un SOC 24x7 con SIEM propio y retención de registros de actividad durante 12 meses. | desirable | partial | 21(2)(b) | A.8.15, A.8.16 | op.exp, op.mon |
| 9 | El adjudicatario deberá gestionar las vulnerabilidades críticas aplicando los parches en un máximo de 15 días. | mandatory | covered | 21(2)(e) | A.8.8 | op.exp |
| 10 | Se valorará que el adjudicatario realice pruebas de penetración anuales realizadas por un tercero independiente. | desirable | partial | 21(2)(f) | A.8.29, A.5.35 | op.mon |
| 11 | Los subcontratistas deberán cumplir los mismos requisitos de seguridad y el adjudicatario deberá informar de cualquier subcontratación a la entidad. | mandatory | partial | 21(2)(d) | A.5.19, A.5.20, A.5.21, A.5.22 | op.ext |
| 12 | El personal del adjudicatario deberá firmar un acuerdo de confidencialidad y recibir formación de concienciación en seguridad cada año. | mandatory | covered | 21(2)(g), 21(2)(i) | A.6.3, A.6.1, A.6.6 | mp.per |
| 13 | Los datos deberán tratarse exclusivamente en el Espacio Económico Europeo conforme al RGPD y la LOPDGDD. | mandatory | covered | - | A.5.34 | mp.info |
| 14 | El adjudicatario deberá cumplir los requisitos de la Directiva NIS2 que le sean aplicables como proveedor de servicios gestionados. | mandatory | partial | 21(2)(a) | - | - |
| 15 | El centro de datos deberá contar con medidas de seguridad física y control de acceso físico. | mandatory | covered | 21(2)(i) | A.5.15, A.5.18, A.8.2, A.7.1, A.7.2, A.7.4 | op.acc, mp.if |

> Topics are detected by keywords: review every row. ENS references are at family level.

