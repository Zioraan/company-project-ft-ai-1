# Directorio apps

Rol actual en este repositorio: referencia legacy y compatibilidad durante la migracion por etapas.

## Estado actual

1. Las superficies UI activas viven en `uis/*`.
2. La extraccion de servicios compartidos avanza hacia `services/*`.
3. Las rutas bajo `apps/*` se mantienen temporalmente por compatibilidad y trazabilidad.

## Politica de desarrollo

1. No agregar funcionalidades nuevas en `apps/*`.
2. Todo trabajo UI nuevo debe ir en `uis/website` o `uis/backoffice`.
3. La logica de integracion compartida debe ir en `services/*`.
4. La documentacion de apps legacy debe indicar claramente su estado deprecado y ruta de reemplazo.

## Referencias por etapa

1. `docs/migration-checkpoints.md`
2. `docs/eval-traceability.md`
3. `docs/stage2-cutover-checklist.md`

## Criterios de retiro deprecado

Las rutas legacy en `apps/*` solo se pueden eliminar cuando se cumplan todas estas condiciones:

1. El comportamiento de reemplazo en `uis/*` esta validado en los flujos criticos.
2. La extraccion de servicios compartidos a `services/*` esta completa para los consumidores activos.
3. Las regresiones pasan en website, backoffice y logica raiz.
4. La evidencia de trazabilidad para Stage 4 cutover esta marcada como completa.
5. El equipo confirma que no quedan dependencias operativas sobre rutas `apps/*`.
