<!-- Claude rule file — loaded automatically based on paths. -->
---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
---

# Conventions de tests

- Utiliser describe/it pour structurer les tests
- Nommer les tests: "should [expected behavior] when [condition]"
- Un fichier de test par module/composant
- Tester les cas limites et erreurs, pas seulement le happy path
- Préférer des assertions spécifiques à toEqual générique