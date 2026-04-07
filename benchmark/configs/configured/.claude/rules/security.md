<!-- Claude rule file — loaded automatically based on paths. -->

# Règles de sécurité

- Ne jamais commit de secrets, clés API ou tokens
- Valider toutes les entrées utilisateur côté serveur
- Utiliser des requêtes paramétrées pour les BDD
- Sanitiser les outputs HTML pour éviter le XSS
- Utiliser HTTPS pour toutes les communications externes