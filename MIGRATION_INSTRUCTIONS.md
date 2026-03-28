# Migration: Assignations multiples pour les tâches

## Changements effectués:

### Backend:
1. **Entity Task** - Modifié pour utiliser `ManyToMany` au lieu de `ManyToOne`
   - Supprimé: `assignedToId` (colonne unique)
   - Ajouté: `assignedTo` (relation ManyToMany avec table de jointure `task_assignees`)

2. **DTO CreateTaskDto** - Modifié pour accepter un tableau
   - Supprimé: `assignedToId?: string`
   - Ajouté: `assignedToIds?: string[]`

3. **Service TasksService** - Mis à jour pour gérer les assignations multiples
   - Utilise `In()` pour récupérer plusieurs utilisateurs
   - Gère correctement la création et mise à jour des relations

### Frontend:
1. **Interface Task** - Modifié pour refléter les changements
   - Supprimé: `assignedToId?: string`
   - Ajouté: `assignedTo?: User[]`

2. **Formulaire de tâche** - Remplacé select par checkboxes
   - Permet de sélectionner plusieurs membres
   - Affiche les membres sélectionnés avec compteur

3. **TaskCard** - Affiche plusieurs avatars
   - Affiche jusqu'à 3 avatars empilés
   - Affiche "+X" pour les membres supplémentaires

## Actions requises:

### 1. Supprimer l'ancienne table tasks (si elle existe)

```sql
-- Dans PostgreSQL
DROP TABLE IF EXISTS task_assignees CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
```

### 2. Redémarrer le backend

```bash
cd PI-DEV-BACKEND
npm run start:dev
```

TypeORM va automatiquement créer:
- La table `tasks` avec la nouvelle structure
- La table de jointure `task_assignees` pour les relations many-to-many

### 3. Vérifier les tables créées

```sql
-- Vérifier la structure
\d tasks
\d task_assignees

-- La table task_assignees devrait avoir:
-- - taskId (UUID, FK vers tasks.id)
-- - userId (UUID, FK vers users.id)
-- - PRIMARY KEY (taskId, userId)
```

## Utilisation:

### Créer une tâche avec plusieurs assignés:

```json
POST /tasks
{
  "title": "Ma tâche",
  "description": "Description",
  "priority": "HIGH",
  "assignedToIds": ["user-id-1", "user-id-2", "user-id-3"],
  "dueDate": "2024-12-31",
  "businessId": "business-id"
}
```

### Mettre à jour les assignés:

```json
PATCH /tasks/:id
{
  "assignedToIds": ["user-id-1", "user-id-4"]
}
```

## Notes:

- Les anciennes données de tâches seront perdues (si vous en aviez)
- Si vous voulez conserver les données, créez une migration manuelle
- La relation many-to-many permet une flexibilité maximale
